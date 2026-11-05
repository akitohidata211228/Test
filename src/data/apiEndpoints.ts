import { ApiEndpoint } from '../types/api';

export const BASE_URL = 'https://lirenxin-api.my.id';

/**
 * Katalog lengkap LIRENXIN REST API (Open Gateway).
 * Seluruh endpoint ini adalah implementasi NYATA dari server (api/app.ts) —
 * dipindahkan dari proyek downloader lama "Akito Downloader".
 */

interface PlatformMeta {
  id: string;
  name: string;
  sample: string;
  note: string;
}

const PLATFORMS: PlatformMeta[] = [
  { id: 'tiktok', name: 'TikTok', sample: 'https://www.tiktok.com/@tiktok/video/7106594212292457010', note: 'Video TikTok tanpa watermark + audio MP3' },
  { id: 'instagram', name: 'Instagram', sample: 'https://www.instagram.com/reel/C7YtX9EFfVN/', note: 'Reels, Post, IGTV & Story (akun publik)' },
  { id: 'youtube', name: 'YouTube', sample: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', note: 'Video + MP3 via YTUltra' },
  { id: 'snackvideo', name: 'SnackVideo', sample: 'https://sck.io/p/0HtZuxXB', note: 'Video SnackVideo langsung dari link' },
  { id: 'facebook', name: 'Facebook', sample: 'https://www.facebook.com/watch/?v=10153231379946729', note: 'Video Facebook / Reels (publik)' },
  { id: 'douyin', name: 'Douyin', sample: 'https://www.douyin.com/video/7312345678901234567', note: 'Video Douyin tanpa watermark' },
  { id: 'xiaohongshu', name: 'XiaoHongShu', sample: 'https://www.xiaohongshu.com/explore/64ec98c8deadbeef0123456', note: 'Note / video XiaoHongShu (RED)' },
  { id: 'twitter', name: 'Twitter / X', sample: 'https://x.com/Twitter/status/1585634057469378561', note: 'Video & GIF dari Tweet publik' },
  { id: 'bilibili', name: 'Bilibili', sample: 'https://www.bilibili.com/video/BV1GJ411x7h7', note: 'Video Bilibili dalam kualitas terbaik' },
  { id: 'kwai', name: 'Kwai', sample: 'https://www.kwai.com/video/362549D-8c8f-4a01-9bd3-1c5e96e0a4b1', note: 'Video Kwai / KwaiVideo' },
  { id: 'threads', name: 'Threads', sample: 'https://www.threads.net/@instagram/post/C6FwXAskBB7', note: 'Video & foto Threads Meta' },
];

const MEDIA_FIELDS = [
  { name: 'url', type: 'string', required: true, description: 'Link publik konten yang akan diunduh' },
];

function buildProxyEndpoint(p: PlatformMeta): ApiEndpoint {
  return {
    id: `proxy-${p.id}`,
    name: `${p.name} Media Proxy`,
    category: 'downloaders',
    method: 'GET',
    path: `/api/proxy/${p.id}`,
    summary: p.note,
    description: `Endpoint proxy media ${p.name} yang sudah produkif digunakan di Akito Downloader. Server mengekstrak media dari URL yang dikirim, mencoba kualitas terbaik terlebih dahulu (Cuki AIO), lalu otomatis beralih ke scraper fallback bila layanan utama gagal. Mendukung video sekali-tap, album foto, dan audio MP3 bila tersedia.`,
    rateLimit: 'TANPA API KEY • BEBAS',
    headers: [
      { key: 'Accept', value: 'application/json', required: true, description: 'Format respon JSON' }
    ],
    queryParams: [
      { name: 'url', type: 'string', required: true, default: p.sample, description: `Link ${p.name} publik yang akan diekstrak` }
    ],
    responses: [
      {
        statusCode: 200,
        statusText: 'OK',
        description: `Media ${p.name} berhasil diekstrak (sumber: Cuki AIO / YTUltra)`,
        body: {
          status: true,
          title: `Contoh ${p.name} Media`,
          thumbnail: 'https://media-cdn.example/thumb_hd.jpg',
          video: 'https://media-cdn.example/video/720p.mp4',
          audio: 'https://media-cdn.example/audio/128kbps.mp3',
          music: 'https://media-cdn.example/audio/128kbps.mp3',
          mp3: 'https://media-cdn.example/audio/128kbps.mp3',
          downloads: [
            { url: 'https://media-cdn.example/video/720p.mp4', quality: 'VIDEO (HD) [.mp4]', ext: 'mp4' },
            { url: 'https://media-cdn.example/audio/128kbps.mp3', quality: 'AUDIO MP3', ext: 'mp3' }
          ],
          images: [],
          author: '@username',
          source: p.id
        }
      },
      {
        statusCode: 200,
        statusText: 'OK (Fallback)',
        description: 'Scraper cadangan berhasil mengekstrak media (wowdownloader/dll)',
        body: {
          status: true,
          title: `${p.name} Media`,
          thumbnail: 'https://media-cdn.example/thumb.jpg',
          video: 'https://media-cdn.example/video.mp4',
          audio: '',
          images: [],
          size: 'Unknown',
          isFallback: true
        }
      },
      {
        statusCode: 500,
        statusText: 'Internal Server Error',
        description: 'Link tidak valid / konten privat / semua penyedia gagal',
        body: {
          error: `Gagal mengunduh dari ${p.name.toUpperCase()}. Pastikan link bersifat publik (bukan akun privat), valid, dan coba lagi.`
        }
      }
    ]
  };
}

const proxyEndpoints: ApiEndpoint[] = PLATFORMS.map(buildProxyEndpoint);

export const API_ENDPOINTS: ApiEndpoint[] = [
  // 1. HEALTH CHECK
  {
    id: 'health-check',
    name: 'Gateway Health Check',
    category: 'getting-started',
    method: 'GET',
    path: '/api/health',
    summary: 'Periksa status operasional server API',
    description: 'Endpoint publik tanpa API Key untuk memverifikasi apakah server LIRENXIN REST API online dan siap menerima permintaan unduhan.',
    rateLimit: 'TANPA API KEY • BEBAS',
    headers: [
      { key: 'Accept', value: 'application/json', required: true, description: 'Format respon yang diharapkan' }
    ],
    responses: [
      {
        statusCode: 200,
        statusText: 'OK',
        description: 'Server beroperasi normal',
        body: {
          status: 'ok'
        }
      }
    ]
  },

  // 2. GATEWAY STATS
  {
    id: 'gateway-stats',
    name: 'Statistik Gateway',
    category: 'analytics',
    method: 'GET',
    path: '/api/stats',
    summary: 'Statistik real-time total request & distribusi per platform',
    description: 'Mengembalikan penghitung request aktual yang dipersistensi ke disk: total seluruh unduhan, breakdown 11 platform, dan grafik 7 hari terakhir. Dipakai langsung oleh beranda web.',
    rateLimit: 'TANPA API KEY • BEBAS',
    headers: [
      { key: 'Accept', value: 'application/json', required: true, description: 'application/json' }
    ],
    responses: [
      {
        statusCode: 200,
        statusText: 'OK',
        description: 'Statistik penggunaan gateway',
        body: {
          totalRequests: 19451,
          requestsByPlatform: {
            tiktok: 5420,
            instagram: 4812,
            youtube: 3110,
            facebook: 2105,
            twitter: 1240,
            douyin: 930,
            bilibili: 720,
            kwai: 590,
            snackvideo: 310,
            xiaohongshu: 214,
            threads: 150
          },
          dailyRequests: [
            { date: '2 Nov', count: 1950 },
            { date: '3 Nov', count: 1910 }
          ]
        }
      }
    ]
  },

  // 3..13 DOWNLOADER PROXY (11 PLATFORM)
  ...proxyEndpoints,

  // 14. STREAM PROXY
  {
    id: 'media-stream-proxy',
    name: 'Stream Proxy (Pratinjau Video/Audio)',
    category: 'utilities',
    method: 'GET',
    path: '/api/stream-proxy',
    summary: 'Streaming passthrough dengan Referer otomatis untuk tag <video>/<audio>',
    description: 'Meneruskan byte media apa pun (rangewise) sehingga file yang memblokir hotlinking/CORS tetap bisa dipratinjau langsung di browser. Referer, User-Agent, dan header Range dikirim ke CDN sumber secara otomatis untuk TikTok, Instagram, Facebook, dan YouTube.',
    rateLimit: 'TANPA API KEY • BEBAS',
    headers: [],
    queryParams: [
      { name: 'url', type: 'string', required: true, default: 'https://media-cdn.example/video/720p.mp4', description: 'URL CDN media hasil proxy downloader' }
    ],
    responses: [
      {
        statusCode: 200,
        statusText: 'Partial Content',
        description: 'Byte stream media (video/mp4, audio/mpeg, image/jpeg…). Header Content-Range & Accept-Ranges disertakan agar seek jalan mulus.',
        body: {
          _note: 'Respons berupa binaer (video/audio stream), bukan JSON. Dipakai sebagai src pada <video src="/api/stream-proxy?url=..."> atau <audio>.'
        }
      },
      {
        statusCode: 400,
        statusText: 'Bad Request',
        description: 'Parameter url wajib diisi',
        body: { error: 'URL is required' }
      }
    ]
  },

  // 15. CDN DOWNLOAD FILE
  {
    id: 'cdn-download-file',
    name: 'CDN Download (Simpan ke Perangkat)',
    category: 'utilities',
    method: 'GET',
    path: '/api/download-file',
    summary: 'Paksa unduh file langsung ke penyimpanan (attachment)',
    description: 'Mengalirkan file dari CDN sumber dengan header Content-Type: application/octet-stream dan Content-Disposition: attachment sehingga browser SELALU menyimpan ke perangkat, bukan mempratinjau. Ekstensi opsi & nama file otomatis dibersihkan.',
    rateLimit: 'TANPA API KEY • BEBAS',
    headers: [],
    queryParams: [
      { name: 'url', type: 'string', required: true, default: 'https://media-cdn.example/video/720p.mp4', description: 'URL CDN file yang diunduh' },
      { name: 'filename', type: 'string', required: false, default: 'media_download', description: 'Nama file tersimpan (dibersihkan otomatis + ekstensi tepat)' }
    ],
    responses: [
      {
        statusCode: 200,
        statusText: 'OK',
        description: 'File binaer dengan header attachment (unduh langsung ke disk)',
        body: {
          _note: 'Respons berupa file binaer + header Content-Disposition: attachment; filename="media_download.mp4". Cocok untuk tombol Unduh di aplikasi Anda.'
        }
      },
      {
        statusCode: 400,
        statusText: 'Bad Request',
        description: 'Parameter url wajib diisi',
        body: { error: 'URL is required' }
      }
    ]
  },

  // 16. FORCE DOWNLOAD
  {
    id: 'force-download',
    name: 'Force Download Sekali Tap',
    category: 'utilities',
    method: 'GET',
    path: '/api/force-download',
    summary: 'Award link unduhan instan tanpa memproses JSON — langsung redirect',
    description: 'Satu tap → server memanggil YTUltra (YouTube) atau Cuki AIO, lalu HTTP redirect 302 ke URL media kualitas terbaik. Cocok untuk Deep Link / tombol Unduh Cepat di WebView, bot, atau aplikasi seluler.',
    rateLimit: 'TANPA API KEY • BEBAS',
    headers: [],
    queryParams: [
      { name: 'url', type: 'string', required: true, default: 'https://www.tiktok.com/@tiktok/video/7106594212292457010', description: 'Link konten publik yang diunduh cepat' },
      { name: 'platform', type: 'string', required: false, default: 'tiktok', description: 'Label platform untuk logging: tiktok, instagram, youtube, dll.' }
    ],
    responses: [
      {
        statusCode: 302,
        statusText: 'Found (Redirect)',
        description: 'Redirect langsung ke URL media kualitas terbaik',
        body: {
          _note: 'Respon adalah redirect HTTP 302 ke media CDN. Untuk YouTube dicoba YTUltra dulu, lainnya langsung Cuki AIO.'
        }
      },
      {
        statusCode: 400,
        statusText: 'Bad Request',
        description: 'Parameter url wajib diisi',
        body: { error: 'URL is required' }
      }
    ]
  },
];

export const PLATFORM_LIST = PLATFORMS.map((p) => p.id);

export const CATEGORY_LABELS: Record<string, { label: string; icon: string }> = {
  'getting-started': { label: 'Quickstart & Status', icon: '⚡' },
  'analytics': { label: 'Statistik Gateway', icon: '📊' },
  'downloaders': { label: 'Downloader Media (11 Platform)', icon: '🎬' },
  'utilities': { label: 'Stream & Unduh Tools', icon: '🛠️' },
};
