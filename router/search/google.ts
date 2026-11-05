/*
  Pencarian web umum — satu endpoint, banyak sumber, banyak jalur egress.

  Kenapa endpoint ini ada padahal sudah ada /api/s/brave:
  brave memblokir IP datacenter (lihat catatan audit 29 Agt 2026), jadi dari
  Vercel dia SELALU balas "Failed to get response from API".

  TEMUAN UTAMA (diukur 13 Sep 2026)
  Yang diblokir adalah IP-nya, BUKAN cara request-nya. Request DDG yang sama
  persis balas 10 hasil bersih lewat proxy, dan HTTP 202 "anomaly" kalau
  langsung dari Azure VPS 40.81.18.4 atau dari Vercel. Dari VPS, query PERTAMA
  sempat berhasil lalu semua query sesudahnya kena rem dan belum pulih setelah
  4 menit — itu sebabnya gejalanya dulu terlihat seperti "kadang jalan kadang
  tidak". Mojeek balas <title>Captcha</title> dengan HTTP 200, Brave 429,
  Google halaman consent.

  Karena itu strukturnya dua lapis: tiap MESIN dicoba lewat beberapa JALUR
  egress (lihat jalurEgress), dan kalau satu mesin habis semua jalurnya,
  lanjut ke mesin berikutnya.

  Untuk hasil yang bisa diandalkan, deploy proxy sendiri — lihat
  worker-cari-proxy.js di akar repo (Cloudflare Worker, gratis 100.000
  request/hari, tanpa kartu kredit) lalu isi env SEARCH_PROXIES.

  Cache in-memory 10 menit dipasang supaya query yang sama tidak menembak
  mesin pencari dua kali. Di Vercel cache cuma hidup selama instance-nya
  hangat; itu sudah cukup untuk mencegah satu query viral memicu rem untuk
  semua pemakai.
*/
import axios from "axios"
import * as cheerio from "cheerio"

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

/*
  Anggaran waktu.

  Ini dipakai bot WhatsApp: pemakai mengetik .google lalu menunggu di depan
  layar. Rantai jalur × rantai mesin bisa panjang, dan tanpa anggaran waktu
  total, permintaan pertama yang lewat proxy lambat sempat menggantung 90 detik
  saat diuji — buruk untuk pemakai DAN membuat request menumpuk di Vercel.

  Angkanya diukur, bukan ditebak (13 Sep 2026):
    langsung    → gagal 0,2–0,8 dtk (HTTP 202 anomaly) — murah, jadi dicoba duluan
    allorigins  → ±1 dari 2 berhasil; yang BERHASIL 6,5–6,8 dtk,
                  yang gagal 0,5–0,7 dtk (HTTP 500) atau menggantung sampai putus
    codetabs    → 0 dari 5 berhasil, SEMUA menghabiskan ~19 dtk (HTTP 522)

  Dua keputusan lahir dari situ: per-percobaan 9 dtk, dan allorigins dicoba
  ULANG karena gagalnya murah (0,5–0,7 dtk) sedangkan berhasilnya sering baru
  datang di percobaan kedua — sementara codetabs ditaruh paling belakang supaya
  tidak memakan anggaran punya jalur lain.

  Kenapa 9 dtk, bukan 7: allorigins yang BERHASIL diukur 6,5–6,8 dtk. Batas
  7 dtk persis menempel di angka itu, jadi keberhasilan yang sah ikut terpotong
  hanya karena selisih ratusan milidetik — terbukti di jejak: percobaan pertama
  mati di 7024 ms padahal uji terpisah berhasil di 6551 ms. Batasnya harus di
  ATAS waktu berhasil, bukan menempel.

  MIN_COBA_MS: jangan MULAI percobaan yang sudah pasti tidak akan selesai.
  Tanpa ini, sisa anggaran 0,8 dtk tetap dipakai menembak proxy yang butuh
  6,5 dtk — jejaknya terlihat sebagai percobaan mati di 829/976/685 ms. Itu
  bukan cuma sia-sia, tapi juga menutupi sebab aslinya (kelihatan seperti
  "proxy gagal" padahal "waktu tidak cukup").

  Total 25 dtk, bukan 30: sisi plugin bot membatalkan di 30 dtk, jadi API harus
  selesai lebih dulu. Kalau keduanya 30 dtk, pencarian yang lambat tapi
  SEBENARNYA berhasil selalu keburu dimatikan plugin.
*/
const PER_COBA_MS = 9000
const MIN_COBA_MS = 2500
const TOTAL_MS = 25000

/* ── jalur egress ───────────────────────────────────────────────────────────
   Inti masalahnya BUKAN cara request-nya, tapi IP-nya. Request DDG yang sama
   persis balas 10 hasil bersih lewat proxy, dan HTTP 202 anomaly kalau
   langsung. Jadi tiap mesin dicoba lewat beberapa jalur egress berurutan.

   Isi env SEARCH_PROXIES (dipisah koma) dengan proxy sendiri — Cloudflare
   Worker di worker-cari-proxy.js, gratis 100.000 request/hari. Proxy publik
   di bawah cuma cadangan: terbukti bisa (10 hasil, 0 anomaly) tapi sering
   balas 522 karena dipakai ramai-ramai, jadi jangan diandalkan.

   Jalur "langsung" ditaruh TERAKHIR, bukan dibuang: kalau suatu saat IP-nya
   lepas rem, dia jalan sendiri tanpa perlu ubah kode. */
function jalurEgress(): ((url: string) => string)[] {
  const jalur: ((url: string) => string)[] = []

  // 1. proxy milik sendiri (env), paling didahulukan
  const punyaSendiri = [
    ...(process.env.SEARCH_PROXIES || "").split(","),
    process.env.PROXY_URL || "",
  ]
    .map((s) => s.trim())
    .filter(Boolean)

  for (const p of punyaSendiri) {
    // Worker menerima dua bentuk: prefix polos, atau ?url=<encoded>.
    jalur.push((url) => (p.includes("?url=") || p.endsWith("=") ? p + encodeURIComponent(url) : p.replace(/\/$/, "") + "/" + url))
  }

  /*
    2. langsung — ditaruh SEBELUM proxy publik, bukan sesudah.

    Diukur: dari IP ini jalur langsung gagal dalam 0,2–0,8 dtk (HTTP 202
    anomaly, IP-nya memang kena rem). Kegagalan yang hampir gratis itu tidak
    boleh ditaruh di belakang percobaan 9-detik — kalau ditaruh belakang, jatah
    mesin habis dulu oleh allorigins dan jalur ini tidak pernah dicoba, padahal
    dia satu-satunya yang akan langsung menang (hasil instan, tanpa perantara)
    begitu rem IP-nya lepas.
  */
  jalur.push((url) => url)

  /*
    3. proxy publik cadangan.

    allorigins dicoba DUA KALI dengan sengaja. Diukur 13 Sep 2026, URL dan
    header yang sama persis, lima kali berturut-turut: 500 dalam 0,6 dtk →
    200 + 8 hasil terparsing dalam 6,6 dtk. Pola itu berulang — kegagalannya
    murah (0,5–0,7 dtk) sedangkan keberhasilannya butuh ±6,5 dtk, jadi
    percobaan kedua hampir selalu masih muat di anggaran dan sering justru
    dia yang berhasil.
  */
  jalur.push((url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`)
  jalur.push((url) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`)

  // 4. codetabs paling belakang: dari 5 percobaan tidak satu pun berhasil dan
  //    semuanya memakan ~19 dtk. Tetap disimpan kalau-kalau allorigins mati
  //    total suatu saat, tapi tidak boleh memakan jatah jalur lain.
  jalur.push((url) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`)

  return jalur
}

/**
 * Ambil satu URL lewat jalur egress yang tersedia, berhenti di yang pertama
 * memberi halaman bersih.
 *
 * `sah` memutuskan halaman itu hasil sungguhan atau halaman rem. Ini wajib
 * per-mesin karena halaman rem sering balas HTTP 200 — Mojeek terbukti
 * mengirim <title>Captcha</title> dengan status 200, jadi menilai dari status
 * code saja akan lolos.
 *
 * `batasWaktu` = epoch ms kapan seluruh pencarian harus sudah berhenti.
 */
async function ambilLewatProxy(
  targetUrl: string,
  sah: (html: string, status: number) => boolean,
  label: string,
  batasWaktu: number,
): Promise<string> {
  const kendala: string[] = []

  for (const buat of jalurEgress()) {
    const sisa = batasWaktu - Date.now()
    /*
      Jangan MULAI percobaan yang sisanya tidak cukup untuk selesai. Jalur yang
      berhasil butuh ±6,5 dtk; menembak dengan sisa 0,8 dtk pasti gagal, memakan
      anggaran mesin berikutnya, dan melaporkan sebab yang salah ("proxy gagal"
      padahal "waktu habis").
    */
    if (sisa < MIN_COBA_MS) {
      kendala.push("waktu habis")
      break
    }

    const lewat = buat(targetUrl)
    try {
      const { data, status } = await axios.get(lewat, {
        timeout: Math.min(PER_COBA_MS, sisa),
        headers: headerUmum(),
        validateStatus: () => true,
        // Sebagian proxy membalas JSON; minta teks apa adanya.
        responseType: "text",
        transformResponse: [(d: any) => d],
      })
      const html = String(data || "")
      if (sah(html, status)) return html
      kendala.push(`HTTP ${status}`)
    } catch (e: any) {
      kendala.push(e?.code || e?.message || "gagal")
    }
  }

  throw new Error(`${label} kena rem di semua jalur (${kendala.slice(0, 4).join(", ")})`)
}

/* ── sumber 1: DuckDuckGo lite ──────────────────────────────────────────────
   Markup-nya tabel polos: tiap hasil = <a class='result-link'> (judul+href),
   <td class='result-snippet'> (cuplikan), <span class='link-text'> (alamat
   tampil). Jumlah ketiganya sama dan urutannya sejajar, jadi dipasangkan
   berdasarkan indeks. */
async function cariDdgLite(query: string, batasWaktu: number): Promise<Hasil[]> {
  const html = await ambilLewatProxy(
    `https://lite.duckduckgo.com/lite/?q=${encodeURIComponent(query)}`,
    // HTTP 202 = halaman anomaly DDG; `is506` flag rem versi JS-nya.
    (h, s) => s === 200 && !halamanRem(h) && h.includes("result-link"),
    "ddg-lite",
    batasWaktu,
  )

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
async function cariDdgHtml(query: string, batasWaktu: number): Promise<Hasil[]> {
  const html = await ambilLewatProxy(
    `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
    (h, s) => s === 200 && !halamanRem(h) && h.includes("result__a"),
    "ddg-html",
    batasWaktu,
  )

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
   Indeks sendiri (bukan pinjam Bing/Google), jadi remnya beda dari DDG.
   Catatan: Mojeek mengirim halaman captcha dengan HTTP 200, jadi status code
   tidak bisa dipercaya — isi halamannya yang diperiksa. */
async function cariMojeek(query: string, batasWaktu: number): Promise<Hasil[]> {
  const html = await ambilLewatProxy(
    `https://www.mojeek.com/search?q=${encodeURIComponent(query)}`,
    (h, s) => s === 200 && !/<title>\s*captcha/i.test(h) && !halamanRem(h),
    "mojeek",
    batasWaktu,
  )

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

/* ── kenapa SearXNG TIDAK dipakai ───────────────────────────────────────────
   Sempat dicoba sebagai cadangan. Dari 81 instance publik di searx.space,
   hanya 2 yang membuka format=json dari IP datacenter — dan keduanya
   Bing-backed. Masalahnya bukan jumlahnya, tapi ISI hasilnya: Bing MEMBERI
   HASIL PALSU ke IP datacenter. Query "siapa akito hidata" dijawab
   "cheap flights" dan "YouTube Help"; query "kucing oren lucu" dijawab
   registry bisnis Australia. Status 200, JSON valid, 10 hasil — tidak ada
   satu pun tanda error.

   Sumber yang berbohong TANPA gejala lebih berbahaya daripada sumber yang
   mati: yang mati kelihatan dan bisa ditangani, yang bohong lolos ke pemakai
   sebagai jawaban yang terlihat sah. Karena itu dibuang, bukan dijadikan
   cadangan terakhir. */

/* ── rantai sumber ─────────────────────────────────────────────────────── */

const SUMBER: { nama: string; jalan: (q: string, batasWaktu: number) => Promise<Hasil[]> }[] = [
  { nama: "DuckDuckGo", jalan: cariDdgLite },
  { nama: "DuckDuckGo", jalan: cariDdgHtml },
  { nama: "Mojeek", jalan: cariMojeek },
]

async function cariWeb(query: string, limit: number) {
  const kunci = `${query.toLowerCase()}|${limit}`
  const dariCache = ambilCache(kunci)
  if (dariCache) return { ...dariCache, cached: true }

  const batasAkhir = Date.now() + TOTAL_MS
  const kendala: string[] = []

  for (let i = 0; i < SUMBER.length; i++) {
    const s = SUMBER[i]
    const sisaTotal = batasAkhir - Date.now()
    if (sisaTotal <= 500) {
      kendala.push("anggaran waktu habis")
      break
    }

    /*
      Anggaran DIBAGI RATA ke mesin yang belum dicoba, bukan dipakai sepuasnya
      oleh mesin pertama.

      Tanpa pembagian ini, mesin pertama yang jalurnya lambat menghabiskan
      seluruh 30 detik dan mesin sesudahnya tidak pernah kebagian — terbukti di
      uji live: ddg-lite dan ddg-html memakan semuanya, mojeek tidak pernah
      dicoba sama sekali walau mungkin justru dia yang hidup.

      Pembagiannya dihitung dari sisa waktu / sisa mesin, jadi mesin yang gagal
      cepat otomatis mewariskan jatahnya ke mesin berikutnya.
    */
    const batasMesin = Date.now() + Math.floor(sisaTotal / (SUMBER.length - i))

    try {
      const hasil = await s.jalan(query, Math.min(batasMesin, batasAkhir))
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
