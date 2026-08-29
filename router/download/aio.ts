/*
  AIO Downloader — satu endpoint untuk semua platform.

  Engine utama: snaptik.fi (/api/tiktok). Dia yang pegang TikTok + Douyin,
  termasuk slideshow foto, story, dan audio mp3-nya.
  Platform lain didelegasikan ke handler yang sudah ada di folder ini,
  biar nggak ada scraper kembar yang harus dirawat dua kali.
*/
import type { Request, Response } from "express";
import axios from "axios";

/*
  Scraper facebook / instagram / rednote sudah mati semua per 29 Agustus 2026
  (fb: "Video is private or URL is invalid", ig: upstream 404, rednote: null),
  jadi file-nya dihapus dan platform-nya dicabut dari sini. Link fb/ig/xhs
  sekarang jujur dibalas "Link tidak dikenali" + daftar platform yang jalan.
*/
import youtubeHandler from "./youtube";
import ytmp3Handler from "./ytmp3";


type MediaType = "video" | "audio" | "image";
type Media = { type: MediaType; label: string; url: string };
type Result = { medias: Media[]; [key: string]: any };

const HOSTS: Record<string, string> = {
    "tiktok.com": "tiktok",
    "douyin.com": "douyin",
    "iesdouyin.com": "douyin",
    "youtube.com": "youtube",
    "youtu.be": "youtube"
};

const SUPPORTED = Array.from(new Set(Object.values(HOSTS)));

const detectPlatform = (raw: string): string | null => {
    let host: string;

    try {
        const clean = raw.trim();
        host = new URL(/^https?:\/\//i.test(clean) ? clean : `https://${clean}`).hostname.toLowerCase();
    } catch {
        return null;
    }

    host = host.replace(/^www\./, "");

    for (const [domain, platform] of Object.entries(HOSTS)) {
        if (host === domain || host.endsWith(`.${domain}`)) return platform;
    }

    return null;
};

// Link watermark & no-watermark sering identik, jadi duplikat dibuang di sini.
const pushMedia = (list: Media[], type: MediaType, label: string, url?: string | null) => {
    if (!url || typeof url !== "string") return;
    if (list.some(m => m.url === url)) return;
    list.push({ type, label, url });
};

const guessType = (url: string): MediaType => {
    if (/\.(jpe?g|png|webp|heic|gif)(\?|$)/i.test(url)) return "image";
    if (/\.(mp3|m4a|aac|opus|wav)(\?|$)/i.test(url)) return "audio";
    return "video";
};

/* ---------- engine snaptik.fi: tiktok + douyin (video / photo / story) ---------- */

const SNAPTIK = "https://snaptik.fi";

const SNAPTIK_HEADERS = {
    "Content-Type": "application/json",
    Origin: SNAPTIK,
    Referer: `${SNAPTIK}/id/douyin-story-downloader`,
    "User-Agent":
        "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
    "Sec-Ch-Ua": '"Chromium";v="139", "Not;A=Brand";v="99"',
    "Sec-Ch-Ua-Mobile": "?1",
    "Sec-Ch-Ua-Platform": '"Android"'
};

/*
  Upstream kadang balas 5xx sesaat padahal linknya valid, jadi dicoba dua kali
  sebelum dianggap gagal.
*/
const snaptikRequest = async (url: string): Promise<any> => {
    let lastError: any;

    for (let attempt = 0; attempt < 2; attempt++) {
        try {
            const { data } = await axios.post(
                `${SNAPTIK}/api/tiktok`,
                { url },
                { headers: SNAPTIK_HEADERS, timeout: 30000 }
            );
            return data;
        } catch (e: any) {
            lastError = e;

            const status = Number(e?.response?.status);
            if (status >= 400 && status < 500) throw e;   // link salah, retry nggak nolong

            await new Promise(r => setTimeout(r, 1500));
        }
    }

    throw lastError;
};

export async function snaptikFi(url: string): Promise<Result> {
    const data = await snaptikRequest(url);

    if (!data || data.status !== "tunnel") {
        throw new Error(data?.error || `Gagal memproses video (status: ${data?.status || "unknown"})`);
    }

    const link = data.download_link || {};
    const photos: string[] = Array.isArray(data.photos) ? data.photos : [];
    const medias: Media[] = [];

    photos.forEach((photo, i) => pushMedia(medias, "image", `photo ${i + 1}`, photo));

    pushMedia(medias, "video", "no watermark", link.no_watermark);
    pushMedia(medias, "video", "watermark", link.watermark);
    pushMedia(medias, "video", "slideshow", data.download_slideshow);
    pushMedia(medias, "audio", "mp3", link.mp3 || data.audio);

    return {
        type: photos.length ? "image" : "video",
        title: data.title || null,
        description: data.description || null,
        author: data.artist || data.author?.nickname || null,
        profile: data.author || null,
        duration: data.duration ? Math.round(data.duration / 1000) : null,
        cover: data.cover || null,
        audio: data.audio || null,
        statistics: data.statistics || {},
        medias,
        engine: `snaptik.fi (${data.extract_source || "web"})`
    };
}

/* ---------- delegasi ke handler tetangga ---------- */

type Captured = { code: number; body: any };

/*
  Handler lain di folder ini bentuknya Express (req, res) dan nulis langsung
  ke res. Daripada nyalin scrapernya, res-nya dipalsukan supaya hasil JSON-nya
  bisa ditangkap dan dinormalisasi di sini.
*/
const callHandler = (handler: (req: any, res: any) => any, query: Record<string, string>): Promise<Captured> =>
    new Promise((resolve, reject) => {
        let code = 200;
        let done = false;

        const finish = (body: any) => {
            if (done) return;
            done = true;
            resolve({ code, body });
        };

        const res: any = {
            headersSent: false,
            status(c: number) { code = c; return res; },
            json(body: any) { res.headersSent = true; finish(body); return res; },
            send(body: any) { res.headersSent = true; finish(body); return res; },
            end(body: any) { res.headersSent = true; finish(body ?? null); return res; },
            set() { return res; },
            setHeader() { return res; },
            type() { return res; }
        };

        const req = { method: "GET", query, body: {}, params: {}, headers: {} };

        Promise.resolve(handler(req, res)).then(() => finish(null)).catch(reject);
    });

const delegate = async (platform: string, url: string, format?: string): Promise<Result> => {
    // YouTube punya dua jalur: mp4 (youtube.ts) dan mp3/mp4 hasil convert (ytmp3.ts).
    const asMp3 = platform === "youtube" && String(format || "").toLowerCase() === "mp3";

    const handlers: Record<string, (req: any, res: any) => any> = {
        youtube: asMp3 ? ytmp3Handler : youtubeHandler
    };

    const handler = handlers[platform];
    if (!handler) throw Object.assign(new Error(`Platform ${platform} belum didukung`), { code: 400 });

    const query: Record<string, string> = { url };
    if (asMp3) query.format = "mp3";

    const { code, body } = await callHandler(handler, query);

    if (!body) throw new Error(`Handler ${platform} tidak mengembalikan hasil apa pun`);

    if (code >= 400 || body.status === false) {
        throw Object.assign(new Error(body.message || `Gagal memproses link ${platform}`), {
            code: code >= 400 ? code : 502
        });
    }

    const data = body.data ?? body;
    const medias: Media[] = [];

    {
        const type: MediaType = data.format === "mp3" ? "audio" : "video";
        const label = data.quality ? `${data.quality}p` : data.format || "media";
        pushMedia(medias, type, label, data.download);
    }

    return {
        type: medias[0]?.type || "video",
        title: data.title || null,
        description: data.description || null,
        author: data.author || data.artist || null,
        duration: typeof data.duration === "number" ? data.duration : null,
        cover: data.thumbnail || data.cover || null,
        medias,
        engine: `router/download/${asMp3 ? "ytmp3" : platform}`,
        // Bentuk respon tiap scraper beda-beda; simpan aslinya biar nggak ada info hilang.
        raw: data
    };
};

export default async function aioDownloader(req: Request, res: Response) {
    const url = String(req.query.url || req.query.q || req.body?.url || "").trim();

    if (!url) {
        return res.status(400).json({
            status: false,
            message: "Parameter url wajib diisi",
            supported: SUPPORTED
        });
    }

    const platform = detectPlatform(url);

    if (!platform) {
        return res.status(400).json({
            status: false,
            message: "Link tidak dikenali",
            supported: SUPPORTED
        });
    }

    try {
        const result =
            platform === "tiktok" || platform === "douyin"
                ? await snaptikFi(url)
                : await delegate(platform, url, req.query.format as string);

        if (!result.medias.length) {
            return res.status(404).json({ status: false, platform, message: "Media tidak ditemukan" });
        }

        return res.json({ status: true, platform, ...result });
    } catch (e: any) {
        const raw = Number(e?.code ?? e?.response?.status);
        const code = raw >= 400 && raw < 600 ? raw : 502;

        return res.status(code).json({
            status: false,
            platform,
            message:
                e?.response?.data?.error ||
                e?.response?.data?.message ||
                e?.message ||
                "Gagal memproses link"
        });
    }
}

