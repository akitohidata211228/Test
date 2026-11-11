import app from "./apisrc/app";
import { mountDanzzApi } from "./server/danzz/integrate";
import express from "express";
import path from "path";
import fs from "fs";

const PORT = Number(process.env.PORT) || 3000;

// Serverless Vercel (api/gateway.mjs): tanpa listen, tanpa vite.
const isServerless = !!process.env.VERCEL;

// Production saat dijalankan dari bundle runtime/server.cjs (atau dist/server.cjs lama)
const isRunningFromBundle = /(dist|runtime)[\\/]server\.cjs$/.test(process.argv[1] || "");
const isProduction =
  process.env.NODE_ENV === "production" || isRunningFromBundle || isServerless;

// Beri tahu autoload/integrate bahwa kita jalan dari bundle runtime.
if (/runtime[\\/]server\.cjs$/.test(process.argv[1] || "")) {
  process.env.LIRENXIN_DIST = "1";
  process.env.LIRENXIN_RUNTIME_DIR = "runtime";
}

// Root file statis: serverless -> runtime/static (ikut di-include ke lambda),
// prod lokal -> dist (hasil vite), dev -> public.
const staticRoot = isServerless
  ? path.join(process.cwd(), "runtime", "static")
  : isProduction
    ? path.join(process.cwd(), "dist")
    : path.join(process.cwd(), "public");

const publicFile = (name: string) => path.join(staticRoot, name);

const serveStaticPage = (route: string, file: string) => {
  app.get(route, (req, res) => {
    const target = publicFile(file);
    if (fs.existsSync(target)) return res.sendFile(target);
    res.status(404).send(`${file} tidak ditemukan (jalankan npm run build dulu?).`);
  });
};

async function startServer() {
  // Gateway Danzz/Lirenxin: /config, /health, /api/create-payment + seluruh
  // route autoload dari folder router/ (176 file, 259 endpoint config).
  mountDanzzApi(app);

  // Halaman statis repo — docs.html, donasi.html, dsb.
  serveStaticPage("/docs", "docs.html");
  serveStaticPage("/donasi", "donasi.html");

  // Catch-all 404 khusus /api/* (didaftarkan PALING AKHIR supaya route
  // core 16 + gateway 259 endpoint punya prioritas lebih dulu).
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) {
      return res.status(404).json({
        error: `Rute API tidak ditemukan: ${req.method} ${req.path}`,
        hint: "Lihat /docs untuk daftar seluruh endpoint aktif (259 endpoint, 19 kategori)."
      });
    }
    next();
  });

  // Serverless: layani static (runtime/static) + SPA fallback, lalu request
  // di-handle via export default di bawah (tanpa vite & tanpa listen).
  if (isServerless) {
    const safeList = (dir: string) => {
      try {
        return fs.readdirSync(dir).slice(0, 40);
      } catch (e: any) {
        return `ERROR: ${e?.message}`;
      }
    };
    if (fs.existsSync(staticRoot)) {
      app.use(express.static(staticRoot));
      app.get("*", (req, res) => {
        const index = path.join(staticRoot, "index.html");
        if (fs.existsSync(index)) return res.sendFile(index);
        res.status(404).json({
          error: "index.html tidak ditemukan di runtime/static (diagnostik)",
          cwd: process.cwd(),
          dirname: __dirname,
          staticEntries: safeList(staticRoot),
        });
      });
    } else {
      app.get("*", (req, res) => {
        res.status(404).json({
          error: "folder runtime/static tidak ada (diagnostik)",
          cwd: process.cwd(),
          dirname: __dirname,
          argv1: process.argv[1],
          cwdEntries: safeList(process.cwd()),
        });
      });
    }
    return;
  }

  // Vite middleware for development — frontend & REST API satu origin (http://localhost:3000)
  if (!isProduction) {
    // Import lazy: bundle prod tidak boleh require('vite') (dep dev, tidak ikut di lambda).
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Serve static files in production (dist berisi React build + aset public/ repo)
    app.use(express.static(staticRoot));
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api")) {
        return res.status(404).json({ error: `Rute API tidak ditemukan: ${req.method} ${req.path}` });
      }
      const index = path.join(staticRoot, "index.html");
      if (fs.existsSync(index)) return res.sendFile(index);
      res.status(500).json({ error: "dist/index.html tidak ada - jalankan npm run build." });
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`LIRENXIN API server running on http://localhost:${PORT}`);
    console.log(`Dokumentasi: http://localhost:${PORT}/docs | Gateway: /api/* | /config | /health`);
  });
}

startServer();

// Handler serverless: Express app dipanggil langsung sebagai (req, res).
export default app;
