import express, { Application, Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { loadEnv } from './env';
import { generateQrisDynamic, isStaticQrisConfigured } from './qris';
import { loadRouter, initAutoLoad, createApiRouter, getRouteCount } from './autoload';

/**
 * Integrasi Danzz/Lirenxin API gateway (dipindahkan dari repo "Test"
 * akitohidata211228) ke server utama proyek ini.
 *
 * Semua endpoint `/api/{kategori}/{route}` dari src/config.json otomatis
 * ter-baca lewat autoload dynamic "require" pada folder `router/` di root
 * proyek — dev (tsx, langsung .ts) maupun prod (dist/router/*.js hasil
 * transpile server/bundleRouter.mjs). Response JSON dibungkus `creator`
 * oleh autoload, persis perilaku repo asal.
 */

const BOOT_TIME = Date.now();

const buildStats = (config: any) => {
  const tags = config.tags || {};
  const categories = Object.keys(tags);
  const endpoints = categories.reduce((n: number, c: string) => n + (tags[c]?.length || 0), 0);
  return {
    endpoints,
    categories: categories.length,
    routesLoaded: getRouteCount(),
    uptimeSeconds: Math.floor((Date.now() - BOOT_TIME) / 1000),
    serverTime: new Date().toISOString(),
  };
};

const findConfigPath = (): string => {
  const candidates = [
    path.join(process.cwd(), 'server', 'danzz', 'config.json'),
    path.join(process.cwd(), 'dist', 'danzz', 'config.json'),
    path.join(process.cwd(), 'src', 'config.json'),
    path.join('/var/task/src/config.json'),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return '';
};

export function mountDanzzApi(app: Application): void {
  // Parser body untuk endpoint POST (ai, tools, dll) — repo aslinya pakai express.json().
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Env opsional (BILIBILI_COOKIE, PROXY_URL, CLOUDFLARE_AI_URL, ...) — tanpa ini
  // endpoint terkait tetap hidup, hanya warna dasarnya "terbatas".
  loadEnv();

  const configPath = findConfigPath();
  if (!configPath) {
    console.error('[✗] Danzz config (server/danzz/config.json) tidak ditemukan — gateway repo dilewati');
    return;
  }

  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

  // ---- Endpoint service: /config, /health, /api/create-payment ----
  app.get('/config', (req: Request, res: Response) => {
    try {
      const currentConfig = JSON.parse(JSON.stringify(config));
      currentConfig.stats = buildStats(config);
      currentConfig.qris_configured = isStaticQrisConfigured();
      res.set('Access-Control-Allow-Origin', '*');
      res.json({ creator: config.settings.creator, ...currentConfig });
    } catch {
      res.status(500).json({ creator: config.settings.creator, error: 'Internal Server Error' });
    }
  });

  app.get('/health', (req: Request, res: Response) => {
    res.set('Access-Control-Allow-Origin', '*');
    res.json({ status: true, ...buildStats(config) });
  });

  app.post('/api/create-payment', async (req: Request, res: Response) => {
    const { amount, name } = req.body || {};

    if (!isStaticQrisConfigured()) {
      return res.status(503).json({
        status: 'error',
        message: 'QRIS payment is temporarily unavailable',
        creator: config.settings.creator,
        note: 'Please configure STATIC_QRIS in src/qris.ts',
      });
    }

    if (!amount || isNaN(parseInt(amount)) || parseInt(amount) < 1000) {
      res.status(400).json({ status: 'error', message: 'Minimum Rp 1.000' });
      return;
    }

    try {
      const nominal = parseInt(amount);
      const qrString = generateQrisDynamic(nominal);

      if (!qrString || qrString === '') {
        return res.status(500).json({
          status: 'error',
          message: 'Failed to generate QRIS',
          creator: config.settings.creator,
        });
      }

      const orderId = `Q-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await new Promise(r => setTimeout(r, 500));

      res.json({
        creator: config.settings.creator,
        status: 'success',
        order_id: orderId,
        amount: nominal,
        qr_string: qrString,
        expired_at: Date.now() + 300000,
      });
    } catch {
      res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
  });

  // ---- Autoload seluruh route dari config.tags → router/{kategori}/{file} ----
  const apiRouter = createApiRouter();
  loadRouter(apiRouter, config);
  initAutoLoad(app, config, configPath, apiRouter);
  app.use(apiRouter);

  console.log(
    `[✓] Danzz/Lirenxin gateway aktif: ${buildStats(config).endpoints} endpoint, ${getRouteCount()} route ter-load (config: ${configPath})`
  );
}
