# LǐRénXīn API

REST API gratis berisi downloader, games, info, search, dan tools. **52 endpoint** dalam 8 kategori, dokumentasi interaktif langsung di browser.

🔗 **[lirenxin-api.my.id](https://lirenxin-api.my.id)** · [Dokumentasi](https://lirenxin-api.my.id/docs)

---

## Kategori

| Kategori   | Jumlah | Isi                                                        |
|------------|--------|------------------------------------------------------------|
| `games`    | 27     | Tebak-tebakan: bendera, kabupaten, JKT48, hero ML, dll     |
| `random`   | 7      | Gambar random per negara (Indonesia, China, Japan, …)      |
| `download` | 6      | TikTok, Instagram, Facebook, YouTube, Rednote              |
| `info`     | 4      | Cuaca, gempa BMKG, hari libur nasional, jadwal TV          |
| `search`   | 4      | Movie, CNN, Loklok, TikTok                                 |
| `tools`    | 2      | Shorturl, screenshot web                                   |
| `ai`       | 1      | Zhuanxin                                                   |
| `maker`    | 1      | Flux image generator                                       |

Daftar lengkap ada di `src/config.json` atau langsung di halaman `/docs`.

---

## Menjalankan lokal

```bash
npm install
npm run dev          # ts-node, port 3000
```

Buka `http://localhost:3000`.

Script lain:

```bash
npm run typecheck    # tsc --noEmit, tanpa emit file
npm run build        # compile ke dist/ + copy asset
npm start            # jalankan hasil build
npm run dev:watch    # nodemon, restart otomatis
npm run pm2          # deploy pakai pm2 (VPS)
```

---

## Endpoint bawaan (non-API)

| Path      | Isi                                                                    |
|-----------|------------------------------------------------------------------------|
| `/`       | Landing page                                                           |
| `/docs`   | Dokumentasi + playground, bisa test endpoint dari browser              |
| `/donasi` | Halaman donasi QRIS                                                    |
| `/config` | Config publik + statistik (`endpoints`, `categories`, `uptimeSeconds`) |
| `/health` | Health check ringan untuk uptime monitor                               |

---

## Menambah endpoint

Route didaftarkan dari config, **bukan** dari scan folder. Dua langkah:

**1. Buat file handler** di `router/<kategori>/<nama>.ts`. Ada dua format, keduanya didukung:

```ts
// Format A — Express handler biasa
import { Request, Response } from "express";

export default async function handler(req: Request, res: Response) {
    res.json({ status: true, data: "hai" });
}
```

```ts
// Format B — descriptor, lebih deskriptif
export default [
    {
        metode: "GET",
        endpoint: "/api/tools/contoh",
        name: "Contoh",
        isPublic: true,
        isMaintenance: false,
        async run({ req }) {
            return { status: true, data: req.query.q };
        }
    }
];
```

Format B cukup `return` objeknya — `src/autoload.ts` yang mengurus status code, `isMaintenance` (503), dan `isPublic: false` (403). Kalau perlu balikin `Buffer` (gambar/audio), langsung `return` buffer-nya.

**2. Daftarkan di `src/config.json`** di dalam `tags`:

```json
"tools": [
    {
        "name": "Contoh",
        "endpoint": "/api/tools/contoh",
        "method": "GET",
        "filename": "contoh",
        "params": [
            { "name": "q", "required": true, "description": "Kata kunci" }
        ]
    }
]
```

`filename` menunjuk ke `router/<kategori>/<filename>.ts` tanpa ekstensi. `endpoint` **harus** sama dengan `endpoint` di descriptor kalau pakai Format B.

`params` cuma dipakai untuk generate form di `/docs` — validasi tetap tanggung jawab handler.

Config di-watch saat `dev`: ubah `config.json`, route langsung reload tanpa restart server.

---

## Struktur

```
index.ts              server, static, QRIS, /config, /health, 404
src/
  autoload.ts         registrasi route + hot reload + adapter descriptor
  config.json         daftar semua endpoint (sumber tunggal)
  qris.ts             generate QRIS dinamis dari QRIS statis
  proxy.ts            proxy opsional, dari env PROXY_URL
router/<kategori>/    file handler
public/
  landing.html        landing
  docs.html           dokumentasi + playground
  donasi.html         QRIS
  404.html            not found
  style.css           design token (warna, shadow, komponen) — satu sumber
  theme.js            light/dark, jalan sebelum paint pertama
  script.js           logic docs playground
```

---

## Environment

Semua opsional:

| Variable    | Fungsi                                      | Default |
|-------------|---------------------------------------------|---------|
| `PORT`      | Port server                                 | `3000`  |
| `PROXY_URL` | Proxy untuk endpoint yang butuh (BMKG, dll) | kosong  |

QRIS diatur lewat `STATIC_QRIS` di `src/qris.ts`. Kalau belum diisi, `/api/create-payment` balas `503` dan halaman donasi tetap aman dibuka.

---

## Tema

`public/style.css` memegang semua token desain (`--brand`, `--surface`, `--shadow`, …). Dark mode aktif via `<html class="dark">`, yang di-set `theme.js` sebelum render supaya tidak ada kedipan putih. Ganti warna cukup di `:root` dan `html.dark` — semua halaman ikut, tidak perlu sentuh HTML.

`prefers-reduced-motion` dihormati; animasi dimatikan kalau OS minta.

---

## Deploy

**Vercel** — `vercel.json` sudah siap, semua request diarahkan ke `index.ts` lewat `@vercel/node`.

**VPS** — `npm run pm2`.

---

## Catatan

Beberapa endpoint scraping bergantung pada website pihak ketiga. Kalau situs sumbernya berubah struktur atau memblokir IP server, endpoint itu bisa balas error meski kodenya benar.

---

Dibuat oleh **[Akito Hidata](https://github.com/akitohidata211228)** · didedikasikan untuk Zhao Lusi 💌
