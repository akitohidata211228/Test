/*
  Danzz For You 💌
*/
import { Application, Request, Response, NextFunction, Router } from 'express';
import * as fs from 'fs';
import * as path from 'path';
import { logRouterRequest } from './logger';

let regRouter = new Set<string>();
let currentConfig: any = null;
let appInstance: any = null;

/*
  Route didaftarkan ke Router terpisah, bukan langsung ke app.
  Ini penting: catch-all 404 di index.ts dipasang setelah router ini di-mount,
  jadi route yang muncul belakangan (hasil hot reload) tetap kebaca,
  bukan ketelan 404.
*/
export const createApiRouter = (): Router => Router();

export const getRouteCount = (): number => regRouter.size;

export const initAutoLoad = (app: Application, config: any, configPath: string, router?: any) => {
    appInstance = router || app;
    currentConfig = config;

    console.log('[✓] Auto Load Activated');

    if (fs.existsSync(configPath)) {
        fs.watch(configPath, (eventType, filename) => {
            if (filename && eventType === 'change') {
                console.log(`Config file changed: ${filename}`);
                try {
                    const newConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
                    currentConfig = newConfig;
                    console.log('[✓] Config reloaded successfully');
                    reloadRouter();
                } catch (error) {
                    console.error('[ㄨ] Failed to reload config:', error);
                }
            }
        });
    }

    const routerDir = path.join(process.cwd(), 'router');
    if (fs.existsSync(routerDir)) {
        console.log(`[i] Watching router directory: ${routerDir}`);
        fs.watch(routerDir, { recursive: true }, (eventType, filename) => {
            if (filename && (filename.endsWith('.ts') || filename.endsWith('.js'))) {
                console.log(`[✓] Route file changed: ${filename}`);

                const fullPath = path.join(routerDir, filename);

                if (require.cache[fullPath]) {
                    delete require.cache[fullPath];
                }

                console.log(`Route cache cleared for: ${filename}`);
                reloadSingleRoute(filename);
            }
        });
    } else {
        console.warn(`[!] Router directory not found at: ${routerDir}`);
    }
};

const reloadSingleRoute = (filename: string) => {
    const normalized = filename.split(path.sep).join('/');
    const parts = normalized.split('/');

    const category = parts.length > 1 ? parts[parts.length - 2] : null;
    const fileNameWithExt = parts[parts.length - 1];
    const routeName = fileNameWithExt.replace(/\.(ts|js)$/, '');

    if (category && currentConfig?.tags?.[category]) {
        /*
          Satu file bisa dipakai beberapa entry config (endpoint beda,
          filename sama), jadi semuanya perlu diregister ulang.
        */
        const routes = currentConfig.tags[category].filter((r: any) => r.filename === routeName);
        routes.forEach((route: any) => {
            regRouter.delete(`${route.method}:${route.endpoint}`);
            registerRoute(route, category);
        });
    }
};

const reloadRouter = () => {
    console.log('Reloading all routes...');
    regRouter.clear();
    loadRouter(appInstance, currentConfig);
};

export const loadRouter = (app: any, config: any) => {
    const tags = config.tags;
    const creatorName = config.settings.creator;

    if (!tags) {
        console.error("[!] Error: 'tags' not found in config.json");
        return;
    }

    Object.keys(tags).forEach((category) => {
        const routes = tags[category];
        routes.forEach((route: any) => {
            registerRoute(route, category, creatorName, app);
        });
    });
};

/*
  Buang layer lama dengan path + method yang sama.
  Express nggak punya API unregister, jadi stack-nya disunting langsung.
  Tanpa ini, hot reload cuma numpuk handler dan yang lama tetap menang.
*/
const dropExistingLayer = (target: any, route: any) => {
    const stack: any[] = target?.stack || target?._router?.stack;
    if (!Array.isArray(stack)) return;

    const method = route.method.toLowerCase();
    for (let i = stack.length - 1; i >= 0; i--) {
        const layer = stack[i];
        if (layer?.route?.path === route.endpoint && layer.route.methods?.[method]) {
            stack.splice(i, 1);
        }
    }
};

/*
  Dua format handler hidup bareng di folder router/:

  A. Express biasa  -> export default (req, res) => {}
  B. Descriptor     -> export default [{ metode, endpoint, run({ req }) }]

  Format B datang dari struktur project lain: dia balikin object hasil,
  bukan nulis ke res. Adapter ini yang nerjemahin ke Express, biar
  29 file router format B nggak perlu ditulis ulang satu-satu.
*/
const fromDescriptor = (descriptors: any[], route: any) => {
    const wanted = String(route.method || 'GET').toUpperCase();
    const picked =
        descriptors.find((d: any) => String(d?.metode || d?.method || 'GET').toUpperCase() === wanted) ||
        descriptors[0];

    if (!picked || typeof picked.run !== 'function') return null;

    return async (req: Request, res: Response) => {
        if (picked.isMaintenance) {
            return res.status(503).json({
                status: false,
                message: `Endpoint ${route.endpoint} sedang maintenance`
            });
        }

        if (picked.isPublic === false) {
            return res.status(403).json({
                status: false,
                message: `Endpoint ${route.endpoint} tidak terbuka untuk publik`
            });
        }

        const result = await picked.run({ req, res });

        // Sebagian handler nulis sendiri ke res (stream/buffer), jangan ditimpa.
        if (res.headersSent) return;

        if (result === undefined || result === null) {
            return res.status(500).json({
                status: false,
                message: 'Handler tidak mengembalikan hasil apa pun'
            });
        }

        if (Buffer.isBuffer(result)) return res.end(result);
        if (typeof result !== 'object') return res.send(result);

        // `code` dipakai sebagai HTTP status, jadi nggak perlu ikut di body.
        const { code, ...body } = result as any;
        const httpStatus = typeof code === 'number' ? code : body.status === false ? 500 : 200;
        return res.status(httpStatus).json(body);
    };
};

const resolveHandler = (mod: any, route: any) => {
    const exported = mod?.default || mod;

    if (typeof exported === 'function') return exported;
    if (Array.isArray(exported)) return fromDescriptor(exported, route);
    if (exported && typeof exported.run === 'function') return fromDescriptor([exported], route);

    return null;
};

const registerRoute = (route: any, category: string, creatorName?: string, app?: any) => {
    const targetApp = app || appInstance;
    const targetCreator = creatorName || currentConfig?.settings?.creator;

    if (!targetApp || !targetCreator) return;

    const routeKey = `${route.method}:${route.endpoint}`;

    if (regRouter.has(routeKey)) {
        return;
    }

    const possibleBaseDirs = [
        path.join(__dirname, '..', 'router', category),
        path.join(process.cwd(), 'router', category),
        path.join(process.cwd(), 'dist', 'router', category)
    ];

    const extensions = ['.ts', '.js'];
    let modulePath = '';

    outerLoop:
    for (const dir of possibleBaseDirs) {
        for (const ext of extensions) {
            const attemptPath = path.join(dir, `${route.filename}${ext}`);
            if (fs.existsSync(attemptPath)) {
                modulePath = attemptPath;
                break outerLoop;
            }
        }
    }

    if (modulePath) {
        try {
            try {
                delete require.cache[require.resolve(modulePath)];
            } catch (e) {}

            const handlerModule = require(modulePath);
            const handler = resolveHandler(handlerModule, route);

            if (typeof handler === 'function') {
                const wrappedHandler = async (req: Request, res: Response, next: NextFunction) => {
                    logRouterRequest(req, res);

                    const originalJson = res.json;
                    res.json = function (body) {
                        if (body && typeof body === 'object' && !Array.isArray(body)) {
                            const modifiedBody = {
                                creator: targetCreator,
                                ...body
                            };
                            return originalJson.call(this, modifiedBody);
                        }
                        return originalJson.call(this, body);
                    };

                    try {
                        await handler(req, res, next);
                    } catch (err) {
                        console.error(`Error in route ${route.endpoint}:`, err);
                        if (!res.headersSent) {
                            res.status(500).json({ status: false, error: 'Internal Server Error', message: err instanceof Error ? err.message : String(err) });
                        }
                    }
                };

                dropExistingLayer(targetApp, route);

                if (route.method === 'GET') targetApp.get(route.endpoint, wrappedHandler);
                else if (route.method === 'POST') targetApp.post(route.endpoint, wrappedHandler);
                else {
                    console.error(`[ㄨ] Method ${route.method} belum didukung untuk ${route.endpoint}`);
                    return;
                }

                regRouter.add(routeKey);
                console.log(`[✓] LOADED: ${route.method} ${route.endpoint} -> ${path.basename(modulePath)}`);
            } else {
                console.error(`[ㄨ] Invalid handler in ${modulePath}. Butuh function, array descriptor, atau object ber-run().`);
            }
        } catch (error) {
            console.error(`[ㄨ] Failed to load route ${route.endpoint} from ${modulePath}:`, error);
        }
    } else {
        console.error(`[!] FILE NOT FOUND: router/${category}/${route.filename}.ts`);
    }
};
