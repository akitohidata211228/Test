/*
  Danzz For You 💌
*/
import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { generateQrisDynamic, isStaticQrisConfigured } from './src/qris';
import { loadRouter, initAutoLoad, createApiRouter, getRouteCount } from './src/autoload';

const app: Application = express();
const PORT = process.env.PORT || 3000;
const BOOT_TIME = Date.now();

const configNya = [
    path.join(__dirname, 'src', 'config.json'),
    path.join(__dirname, '..', 'src', 'config.json'),
    path.join(process.cwd(), 'src', 'config.json'),
    path.join('/var/task/src/config.json')
];

let configPath = '';
for (const p of configNya) {
    if (fs.existsSync(p)) {
        configPath = p;
        break;
    }
}
if (!configPath) {
    console.error('[✗] Config file not found');
    process.exit(1);
}

let config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

/*
  Statistik yang beneran bisa dihitung dari config + proses.
  Counter visitor lama nulis ke /tmp: di Vercel itu ke-reset tiap cold start
  dan tiap instance punya angka sendiri, jadi angkanya nggak pernah benar.
*/
const buildStats = () => {
    const tags = config.tags || {};
    const categories = Object.keys(tags);
    const endpoints = categories.reduce((n, c) => n + (tags[c]?.length || 0), 0);

    return {
        endpoints,
        categories: categories.length,
        routesLoaded: getRouteCount(),
        uptimeSeconds: Math.floor((Date.now() - BOOT_TIME) / 1000),
        serverTime: new Date().toISOString()
    };
};

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(process.cwd(), 'public')));
app.use('/src', express.static(path.join(process.cwd(), 'src')));

app.post('/api/create-payment', async (req: Request, res: Response) => {
    const { amount, name } = req.body;

    if (!isStaticQrisConfigured()) {
        return res.status(503).json({
            status: 'error',
            message: 'QRIS payment is temporarily unavailable',
            creator: config.settings.creator,
            note: 'Please configure STATIC_QRIS in src/qris.ts'
        });
    }

    if (!amount || isNaN(parseInt(amount)) || parseInt(amount) < 1000) {
        res.status(400).json({ status: 'error', message: 'Minimum Rp 1.000' });
        return;
    }

    try {
        const nominal = parseInt(amount);
        const qrString = generateQrisDynamic(nominal);

        if (!qrString || qrString === "") {
            return res.status(500).json({
                status: 'error',
                message: 'Failed to generate QRIS',
                creator: config.settings.creator
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
            expired_at: Date.now() + 300000
        });
    } catch (error) {
        res.status(500).json({ status: 'error', message: 'Internal Server Error' });
    }
});

/*
  Semua route API masuk ke Router sendiri yang di-mount sekarang.
  Route yang ditambahkan belakangan (hot reload config) tetap kepakai,
  karena catch-all 404 di bawah ada di luar router ini.
*/
const apiRouter = createApiRouter();
loadRouter(apiRouter, config);
initAutoLoad(app, config, configPath, apiRouter);
app.use(apiRouter);

app.get('/config', (req: Request, res: Response) => {
    try {
        const currentConfig = JSON.parse(JSON.stringify(config));
        currentConfig.stats = buildStats();
        currentConfig.qris_configured = isStaticQrisConfigured();
        res.json({ creator: config.settings.creator, ...currentConfig });
    } catch (error) { res.status(500).json({ creator: config.settings.creator, error: "Internal Server Error" }); }
});

app.get('/health', (req: Request, res: Response) => {
    res.json({ status: true, ...buildStats() });
});

app.get('/', (req: Request, res: Response) => {
    res.sendFile(path.join(process.cwd(), 'public', 'landing.html'));
});

app.get('/docs', (req: Request, res: Response) => { res.sendFile(path.join(process.cwd(), 'public', 'docs.html')); });
app.get('/donasi', (req: Request, res: Response) => { res.sendFile(path.join(process.cwd(), 'public', 'donasi.html')); });

app.use((req: Request, res: Response) => {
    if (req.accepts('html')) {
        const possible404 = [path.join(process.cwd(), 'public', '404.html'), path.join(__dirname, 'public', '404.html')];
        for (const p of possible404) { if (fs.existsSync(p)) return res.status(404).sendFile(p); }
    }
    res.status(404).json({ status: false, creator: config.settings.creator, message: "Route not found" });
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Routes loaded: ${getRouteCount()}`);
    console.log(`QRIS Configured: ${isStaticQrisConfigured() ? 'Yes' : 'No'}`);
});
export default app;
