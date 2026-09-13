/*
  Pencarian web umum — satu endpoint, banyak sumber.

  Kenapa endpoint ini ada padahal sudah ada /api/s/brave:
  brave memblokir IP datacenter (lihat catatan audit 29 Agt 2026), jadi dari
  Vercel dia SELALU balas "Failed to get response from API". Endpoint ini
  mencoba beberapa mesin berurutan dan memakai yang pertama berhasil, supaya
  satu mesin yang ngambek tidak mematikan fiturnya.

  Urutan sengaja: DuckDuckGo lite dulu (paling ringan, ~24 KB, hasilnya paling
  relevan untuk query Indonesia), baru mesin lain sebagai cadangan.

  Catatan lapangan 13 Sep 2026, diukur dari IP Azure 40.81.18.4:
  DDG lite membalas HTTP 200 + 10 hasil untuk query PERTAMA, lalu langsung
  HTTP 202 "anomaly" untuk semua query sesudahnya, dan belum pulih setelah
  4 menit. Artinya scraping langsung dari satu IP tetap TIDAK bisa diandalkan
  untuk dipakai ramai-ramai. Dua penawarnya ada di sini:
    1. cache in-memory — query yang sama tidak menembak mesin dua kali
    2. rantai cadangan — kalau DDG kena rem, mesin lain yang jawab
  Kalau semua mesin kena rem, isi env PROXY_URL (dipakai src/proxy.ts).
*/
import axios from "axios"
import * as cheerio from "cheerio"
import { proxy } from "../../src/proxy"

/* ── cache sederhana ────────────────────────────────────────────────────────
   Vercel serverless: cache cuma hidup selama instance-nya hangat. Itu sudah
   cukup — yang mau dicegah adalah 50 orang mengetik query sama beruntun lalu
   memicu rem anomaly untuk semua orang. TTL pendek supaya hasil tidak basi. */
const TTL_MS = 10 * 60 * 1000
const MAKS_CACHE = 200
const cache = new Map<string, { waktu: number; data: any }>()

function ambilCache(k: string) {
  const c = cache.get(k)
  if (!c) return null
  if (Date.now() - c.waktu > TTL_MS) {
    cache.delete(k)
    return null
  }
  return c.data
}

function simpanCache(k: string, data: any) {
  // Buang entri tertua kalau penuh (Map menjaga urutan sisip).
  if (cache.size >= MAKS_CACHE) {
    const tertua = cache.keys().next().value
    if (tertua !== undefined) cache.delete(tertua)
  }
  cache.set(k, { waktu: Date.now(), data })
}

/* ── util ───────────────────────────────────────────────────────────────── */

const UA_LIST = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
]

function ua() {
  return UA_LIST[Math.floor(Math.random() * UA_LIST.length)]
}

function headerUmum() {
  return {
    "User-Agent": ua(),
    Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
    "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
  }
}

function rapikan(s: string | undefined | null): string {
  return String(s || "")
    .replace(/\s+/g, " ")
    .trim()
}

/*
  DDG membungkus tiap tautan jadi //duckduckgo.com/l/?uddg=<url-encoded>&rut=...
  Tanpa dibuka, yang sampai ke pengguna adalah tautan redirect DDG, bukan
  alamat aslinya.
*/
function bukaRedirect(href: string): string {
  if (!href) return ""
  let u = href.startsWith("//") ? "https:" + href : href
  const m = u.match(/[?&]uddg=([^&]+)/)
  if (m) {
    try {
      u = decodeURIComponent(m[1])
    } catch {
      /* biarkan apa adanya kalau encoding-nya rusak */
    }
  }
  return u
}

function domainDari(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "")
  } catch {
    return ""
  }
}

/** Halaman rem/captcha sering balas HTTP 200, jadi status code saja tidak cukup. */
function halamanRem(html: string): boolean {
  const h = String(html || "").toLowerCase()
  return (
    h.includes("anomaly") ||
    h.includes("unusual traffic") ||
    h.includes("are you a robot") ||
    (h.includes("captcha") && h.length < 20000)
  )
}

type Hasil = {
  title: string
  description: string
  url: string
  displayUrl: string
}

/* ── sumber 1: DuckDuckGo lite ──────────────────────────────────────────────
   Markup-nya tabel polos: tiap hasil = <a class='result-link'> (judul+href),
   <td class='result-snippet'> (cuplikan), <span class='link-text'> (alamat
   tampil). Jumlah ketiganya sama dan urutannya sejajar, jadi dipasangkan
   berdasarkan indeks. */
async function cariDdgLite(query: string): Promise<Hasil[]> {
  const { data, status } = await axios.get(
    proxy() + `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`,
    { timeout: 20000, headers: headerUmum(), validateStatus: () => true },
  )
  const html = String(data || "")
  // HTTP 202 = halaman anomaly DDG. Bukan error jaringan, tapi jelas bukan hasil.
  if (status !== 200 || halamanRem(html)) throw new Error(`ddg-lite kena rem (HTTP ${status})`)

  const $ = cheerio.load(html)
  const judul: { t: string; u: string }[] = []
  const cuplikan: string[] = []
  const alamat: string[] = []

  $("a.result-link").each((_, el) => {
    judul.push({
      t: rapikan($(el).text()),
      u: bukaRedirect($(el).attr("href") || ""),
    })
  })
  $(".result-snippet").each((_, el) => {
    cuplikan.push(rapikan($(el).text()))
  })
  $(".link-text").each((_, el) => {
    alamat.push(rapikan($(el).text()))
  })

  return judul
    .map((j, i) => ({
      title: j.t,
      description: cuplikan[i] || "",
      url: j.u,
      displayUrl: alamat[i] || domainDari(j.u),
    }))
    .filter((h) => h.title && h.url)
}

/* ── sumber 2: DuckDuckGo html ─────────────────────────────────────────────
   Markup berbeda (div.result), kadang hidup saat /lite kena rem. */
async function cariDdgHtml(query: string): Promise<Hasil[]> {
  const { data, status } = await axios.get(
    proxy() + `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    { timeout: 20000, headers: headerUmum(), validateStatus: () => true },
  )
  const html = String(data || "")
  if (status !== 200 || halamanRem(html)) throw new Error(`ddg-html kena rem (HTTP ${status})`)

  const $ = cheerio.load(html)
  const out: Hasil[] = []
  $("div.result, div.web-result").each((_, el) => {
    const a = $(el).find("a.result__a").first()
    const url = bukaRedirect(a.attr("href") || "")
    const title = rapikan(a.text())
    if (!title || !url) return
    out.push({
      title,
      description: rapikan($(el).find(".result__snippet").first().text()),
      url,
      displayUrl: rapikan($(el).find(".result__url").first().text()) || domainDari(url),
    })
  })
  return out
}

/* ── sumber 3: Mojeek ──────────────────────────────────────────────────────
   Indeks sendiri (bukan pinjam Bing/Google), jadi remnya beda dari DDG. */
async function cariMojeek(query: string): Promise<Hasil[]> {
  const { data, status } = await axios.get(
    proxy() + `https://www.mojeek.com/search?q=${encodeURIComponent(query)}`,
    { timeout: 20000, headers: headerUmum(), validateStatus: () => true },
  )
  const html = String(data || "")
  if (status !== 200 || halamanRem(html)) throw new Error(`mojeek kena rem (HTTP ${status})`)

  const $ = cheerio.load(html)
  const out: Hasil[] = []
  $("ul.results-standard li, li.result").each((_, el) => {
    const a = $(el).find("h2 a, a.title").first()
    const url = a.attr("href") || ""
    const title = rapikan(a.text())
    if (!title || !url) return
    out.push({
      title,
      description: rapikan($(el).find("p.s, .s").first().text()),
      url: url.startsWith("http") ? url : `https://www.mojeek.com${url}`,
      displayUrl: rapikan($(el).find("a.ob, .url").first().text()) || domainDari(url),
    })
  })
  return out
}

/* ── sumber 4: SearXNG ─────────────────────────────────────────────────────
   Beberapa instance membuka format=json. Instance publik gonta-ganti aturan,
   jadi dicoba berurutan dan yang gagal dilewat diam-diam. */
const SEARX = [
  "https://searx.be",
  "https://search.inetol.net",
  "https://baresearch.org",
  "https://priv.au",
]

async function cariSearx(query: string): Promise<Hasil[]> {
  for (const basis of SEARX) {
    try {
      const { data, status } = await axios.get(
        proxy() + `${basis}/search`,
        {
          timeout: 15000,
          headers: { ...headerUmum(), Accept: "application/json" },
          params: { q: query, format: "json", language: "id" },
          validateStatus: () => true,
        },
      )
      if (status !== 200 || typeof data !== "object" || !Array.isArray(data?.results)) continue
      const out = data.results
        .map((r: any) => ({
          title: rapikan(r.title),
          description: rapikan(r.content),
          url: String(r.url || ""),
          displayUrl: domainDari(String(r.url || "")),
        }))
        .filter((h: Hasil) => h.title && h.url)
      if (out.length) return out
    } catch {
      /* instance ini mati/menolak — coba berikutnya */
    }
  }
  throw new Error("semua instance searx menolak")
}

/* ── rantai sumber ─────────────────────────────────────────────────────── */

const SUMBER: { nama: string; jalan: (q: string) => Promise<Hasil[]> }[] = [
  { nama: "DuckDuckGo", jalan: cariDdgLite },
  { nama: "DuckDuckGo", jalan: cariDdgHtml },
  { nama: "Mojeek", jalan: cariMojeek },
  { nama: "SearXNG", jalan: cariSearx },
]

async function cariWeb(query: string, limit: number) {
  const kunci = `${query.toLowerCase()}|${limit}`
  const dariCache = ambilCache(kunci)
  if (dariCache) return { ...dariCache, cached: true }

  const kendala: string[] = []

  for (const s of SUMBER) {
    try {
      const hasil = await s.jalan(query)
      if (!hasil.length) {
        kendala.push(`${s.nama}: 0 hasil`)
        continue
      }
      const data = {
        query,
        source: s.nama,
        totalResults: Math.min(hasil.length, limit),
        results: hasil.slice(0, limit),
      }
      simpanCache(kunci, data)
      return { ...data, cached: false }
    } catch (e: any) {
      kendala.push(`${s.nama}: ${e?.message || "gagal"}`)
    }
  }

  // Semua sumber gagal — laporkan APA yang gagal, jangan cuma "error".
  // Tanpa detail ini mustahil tahu bedanya "IP kena rem" vs "selector berubah".
  throw new Error(`Semua sumber pencarian gagal. ${kendala.join("; ")}`)
}

/* ── validasi bersama GET & POST ───────────────────────────────────────── */

function periksa(query: any, limitMentah: any) {
  if (!query) return { salah: { status: false, error: "Parameter 'query' diperlukan.", code: 400 } }
  if (typeof query !== "string" || query.trim().length === 0) {
    return { salah: { status: false, error: "Query harus berupa teks dan tidak boleh kosong.", code: 400 } }
  }
  if (query.length > 300) {
    return { salah: { status: false, error: "Query maksimal 300 karakter.", code: 400 } }
  }
  let limit = parseInt(String(limitMentah ?? "10"), 10)
  if (!Number.isFinite(limit) || limit < 1) limit = 10
  if (limit > 20) limit = 20
  return { query: query.trim(), limit }
}

async function jalankan(query: any, limitMentah: any) {
  const cek = periksa(query, limitMentah)
  if (cek.salah) return cek.salah
  try {
    const data = await cariWeb(cek.query as string, cek.limit as number)
    return { status: true, data, timestamp: new Date().toISOString() }
  } catch (error: any) {
    return { status: false, error: error?.message || "Terjadi kesalahan pada server.", code: 503 }
  }
}

const DESKRIPSI =
  "Pencarian web umum dengan rantai cadangan otomatis: DuckDuckGo, Mojeek, lalu SearXNG. " +
  "Mengembalikan judul, cuplikan, URL asli (redirect DuckDuckGo sudah dibuka), dan alamat tampil. " +
  "Hasil di-cache 10 menit supaya query yang sama tidak memicu pembatasan laju mesin pencari."

const PARAM_LIMIT = {
  name: "limit",
  in: "query",
  required: false,
  schema: { type: "integer", minimum: 1, maximum: 20, default: 10 },
  description: "Jumlah hasil maksimal (1-20, bawaan 10).",
  example: 10,
}

export default [
  {
    metode: "GET",
    endpoint: "/api/s/google",
    name: "google",
    category: "Search",
    description: DESKRIPSI,
    tags: ["Search", "Web", "Google", "DuckDuckGo"],
    example: "?query=siapa akito hidata",
    parameters: [
      {
        name: "query",
        in: "query",
        required: true,
        schema: { type: "string", minLength: 1, maxLength: 300 },
        description: "Kata kunci pencarian.",
        example: "siapa akito hidata",
      },
      PARAM_LIMIT,
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }: any) {
      const { query, limit } = req.query || {}
      return jalankan(query, limit)
    },
  },
  {
    metode: "POST",
    endpoint: "/api/s/google",
    name: "google",
    category: "Search",
    description: DESKRIPSI,
    tags: ["Search", "Web", "Google", "DuckDuckGo"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["query"],
            properties: {
              query: {
                type: "string",
                description: "Kata kunci pencarian.",
                example: "siapa akito hidata",
                minLength: 1,
                maxLength: 300,
              },
              limit: {
                type: "integer",
                description: "Jumlah hasil maksimal (1-20, bawaan 10).",
                example: 10,
                minimum: 1,
                maximum: 20,
              },
            },
            additionalProperties: false,
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }: any) {
      const { query, limit } = req.body || {}
      return jalankan(query, limit)
    },
  },
]
