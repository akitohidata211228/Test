import app from "./apisrc/app";
import { mountDanzzApi } from "./server/danzz/integrate";
import express from "express";
import path from "path";
import fs from "fs";

const PORT = Number(process.env.PORT) || 3000;

// Serverless Vercel (api/index.mjs): tanpa listen, tanpa vite, tanpa static.
const isServerless = !!process.env.VERCEL;

// Production saat dijalankan dari bundle dist/ meski NODE_ENV tidak diset
const isRunningFromDist = /dist[\\/]server\.cjs$/.test(process.argv[1] || "");
const isProduction =
  process.env.NODE_ENV === "production" || isRunningFromDist || isServerless;

// Halaman statis proyek repo "Test" (docs/donasi/console) hidup di folder public/
// dan ikut otomatis tersalin vite ke dist/ saat build.
const publicFile = (name: string) =>
  isProduction ? path.join(process.cwd(), "dist", name) : path.join(process.cwd(), "public", name);

const serveStaticPage = (route: string, file: string) => {
  app.get(route, (req, res) => {
    const target = publicFile(file);
    if (fs.existsSync(target)) return res.sendFile(target);
    res.status(404).send(`${file} tidak ditemukan (jalankan npm run build dulu?).`);
  });
};

async function startServer() {
  // Gateway Danzz/Lirenxin: /config, /health, /api/create-payment + seluruh
  // route autoload dari folder router/ (169 file, 259 endpoint config).
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

  // Serverless: tetap layani static dist/ + SPA fallback, lalu request
  // di-handle via export default di bawah (tanpa vite & tanpa listen).
  if (isServerless) {
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        const index = path.join(distPath, "index.html");
        if (fs.existsSync(index)) return res.sendFile(index);
        res.status(404).send("index.html tidak ditemukan - jalankan npm run build.");
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
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      if (req.path.startsWith("/api")) {
        return res.status(404).json({ error: `Rute API tidak ditemukan: ${req.method} ${req.path}` });
      }
      const index = path.join(distPath, "index.html");
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
