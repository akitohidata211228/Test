/*
  Downloader bilibili.tv (Bstation). Diadaptasi dari script CLI kiriman user;
  bagian CLI-nya (unduh file + merge ffmpeg + progress bar) dibuang karena
  endpoint cuma perlu balikin daftar stream.

  bilibili.tv pakai DASH: video dan audio terpisah, jadi hasilnya dua bagian
  (`videos` per kualitas + satu `audio`) yang harus digabung sendiri di sisi
  klien, dan waktu mengunduh header `Referer` wajib dikirim.

  Kualitas 1080P ke atas biasanya terkunci (butuh akun premium). Kalau punya
  cookie, kirim lewat ?cookie=... atau isi env BILIBILI_COOKIE.
*/
import type { Request, Response } from "express"
import axios from "axios"

const QUALITY_MAP: Record<number, string> = {
  5: "144P",
  6: "240P",
  16: "360P",
  32: "480P",
  64: "720P",
  80: "1080P",
  112: "1080P HD",
  116: "1080P 60FPS",
  120: "4K",
}

const ORDER = ["4K", "1080P 60FPS", "1080P HD", "1080P", "720P", "480P", "360P", "240P", "144P"]

const SHORT_DOMAINS = [
  "bili.im",
  "b23.tv",
  "b23.wtf",
  "b23.tf",
  "b23.icu",
  "b23.app",
  "bili2233.cn",
  "bili2233.ch",
  "b23bb.tv",
  "bstation.app",
]

const UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
const REF = "https://www.bilibili.tv/"

const fail = (message: string, code = 502) => Object.assign(new Error(message), { code })

const fmtSize = (b: any) =>
  !b || isNaN(b) ? null : b >= 1048576 ? (b / 1048576).toFixed(1) + " MB" : Math.round(b / 1024) + " KB"

const fmtDur = (ms: any) => {
  if (!ms) return null
  const t = Math.round(ms / 1000)
  const h = Math.floor(t / 3600)
  const m = Math.floor((t % 3600) / 60)
  const s = t % 60
  const pad = (v: number) => String(v).padStart(2, "0")
  return h > 0 ? [h, m, s].map(pad).join(":") : [m, s].map(pad).join(":")
}

const isHevc = (c = "") => /hev|hvc/i.test(c)

/* Short link (b23.tv dan kawan-kawan) dibuka dulu biar dapat aid/ep_id-nya. */
export async function resolveShortUrl(input: string): Promise<string> {
  let url = String(input).trim()
  if (!url) return input
  if (!/^https?:\/\//i.test(url)) url = "https://" + url

  let parsed: URL
  try {
    parsed = new URL(url)
  } catch {
    return input
  }

  const host = parsed.hostname.replace(/^www\./i, "").toLowerCase()
  if (!SHORT_DOMAINS.some((d) => host === d || host.endsWith("." + d))) return input

  try {
    const r = await axios.get(url, {
      maxRedirects: 0,
      timeout: 8000,
      headers: { "User-Agent": UA, Accept: "text/html" },
      validateStatus: (s: number) => s < 400,
    } as any)
    if (r.headers.location) return new URL(r.headers.location as string, url).href
  } catch (e: any) {
    if (e.response?.headers?.location) return new URL(e.response.headers.location, url).href
  }

  // Kalau redirect-nya nggak kelihatan di header, ikuti sampai habis lalu ambil URL akhirnya.
  try {
    const r2: any = await axios.get(url, { maxRedirects: 8, timeout: 12000, headers: { "User-Agent": UA } })
    const final = r2.request?.res?.responseUrl || r2.request?._redirectable?._currentUrl
    if (final && final !== url) return final
  } catch {}

  return input
}

export function parseBilibiliTvUrl(input: string): any {
  if (!input) throw fail("URL / ID kosong", 400)

  let s = String(input).trim()
  if (/^\d+$/.test(s)) return { raw_id: s }
  if (!/^https?:\/\//i.test(s)) s = "https://" + s

  let url: URL
  try {
    url = new URL(s)
  } catch {
    throw fail("URL tidak valid", 400)
  }

  const p = url.pathname

  const play = p.match(/\/play\/(\d+)(?:\/(\d+))?/i)
  if (play) return { type: "ogv", season_id: play[1], ep_id: play[2] || null }

  const vid = p.match(/\/(?:id|en|vi|th|ms|zh)?\/video\/(\d+)/i) || p.match(/\/video\/(\d+)/i)
  if (vid) return { type: "ugc", aid: vid[1] }

  const any = p.match(/\/(\d{10,})/)
  if (any) return { raw_id: any[1] }

  throw fail("Format tidak dikenali. Pakai /video/AID, /play/SEASON/EP, short link, atau ID mentah", 400)
}

/*
  API playurl nggak ngasih judul/cover sama sekali, jadi metadata diambil dari
  meta og:* halaman web-nya. Gagal di sini nggak boleh bikin endpoint gagal.
*/
async function fetchMeta(pageUrl: string) {
  try {
    const { data } = await axios.get(pageUrl, {
      timeout: 12000,
      headers: { "User-Agent": UA, "Accept-Language": "id-ID,id;q=0.9" },
    })
    const html = String(data)
    const pick = (prop: string) =>
      html.match(new RegExp(`<meta[^>]+property=["']${prop}["'][^>]+content=["']([^"']*)["']`, "i"))?.[1] || null
    /*
      <title> lebih informatif daripada og:title untuk episode anime:
      "Black Clover E1 - Asta dan Yuno - Bstation" vs "Black Clover HD".
    */
    const title = (html.match(/<title>([^<]*)<\/title>/i)?.[1] || pick("og:title") || "")
      .replace(/\s*[|\-–]\s*(bilibili|Bstation)\s*$/i, "")
      .trim()
    return { title: title || null, thumbnail: pick("og:image") }
  } catch {
    return { title: null, thumbnail: null }
  }
}

export async function getBilibiliTvStreams(
  input: string,
  { qn = 120, cookie = "", locale = "id_ID" }: { qn?: number; cookie?: string; locale?: string } = {},
) {
  const resolved = await resolveShortUrl(input)
  const parsed = parseBilibiliTvUrl(resolved)

  const params: any = { s_locale: locale, platform: "web", qn, type: 0, device: "wap", tf: 0 }
  if (parsed.type === "ogv") {
    if (!parsed.ep_id) throw fail("Link /play/ butuh nomor episode juga (/play/SEASON/EP)", 400)
    params.ep_id = parsed.ep_id
  } else {
    params.aid = parsed.aid || parsed.raw_id
  }

  const headers: any = { "User-Agent": UA, Referer: REF, Origin: "https://www.bilibili.tv" }
  if (cookie) headers.Cookie = cookie

  const call = (p: any) =>
    axios
      .get("https://api.bilibili.tv/intl/gateway/web/playurl", { params: p, headers, timeout: 20000 })
      .then((r) => r.data)

  let data = await call(params).catch((e: any) => {
    throw fail("Gagal request API bilibili: " + e.message)
  })

  // ID mentah bisa aid atau ep_id; kalau ditebak sebagai aid gagal, coba lagi sebagai ep_id.
  if (data.code !== 0 && parsed.raw_id && params.aid) {
    params.ep_id = parsed.raw_id
    delete params.aid
    data = await call(params)
  }

  if (data.code !== 0) {
    const msg = data.message || String(data.code)
    if (data.code === 10004001) throw fail("Geo-restricted / tidak tersedia di wilayah server", 451)
    if ([10004004, 10004005, 10023006].includes(data.code)) throw fail("Butuh login / premium: " + msg, 403)
    throw fail("API Error: " + msg)
  }

  const playurl = data.data?.playurl
  if (!playurl) throw fail("Tidak ada data playurl", 404)

  const allVids = (playurl.video || []).map((v: any) => {
    const r = v.video_resource || v
    return {
      quality_text: QUALITY_MAP[r.quality] || String(r.quality),
      codecs: r.codecs || "",
      size: r.size,
      duration: r.duration,
      url: r.url || null,
    }
  })

  // Satu kualitas bisa muncul dua kali (avc + hevc); hevc dimenangkan karena filenya lebih kecil.
  const vg: any = {}
  const lockedSet = new Set<string>()
  for (const v of allVids) {
    const k = v.quality_text
    if (v.url && (!vg[k] || (isHevc(v.codecs) && !isHevc(vg[k].codecs)))) vg[k] = v
    else if (!v.url) lockedSet.add(k)
  }

  const videos: any = Object.fromEntries(
    ORDER.filter((q) => vg[q]).map((q) => [
      q,
      { url: vg[q].url, size: fmtSize(vg[q].size), codec: isHevc(vg[q].codecs) ? "hevc" : "avc" },
    ]),
  )
  const locked_qualities = ORDER.filter((q) => lockedSet.has(q) && !vg[q])

  let bestAudio: any = null
  for (const a of playurl.audio_resource || playurl.audio || []) {
    const r = a.audio_resource || a
    if (!r.url) continue
    if (!bestAudio || (r.bandwidth || 0) > (bestAudio.bandwidth || 0)) {
      bestAudio = { url: r.url, size: fmtSize(r.size), bandwidth: r.bandwidth || 0, codecs: r.codecs || "mp4a" }
    }
  }

  if (!Object.keys(videos).length) {
    throw fail(
      locked_qualities.length
        ? "Semua kualitas terkunci, butuh cookie akun premium"
        : "Tidak ada stream video yang bisa diambil",
      403,
    )
  }

  const pageUrl =
    /^https?:\/\//i.test(String(resolved)) && !SHORT_DOMAINS.some((d) => String(resolved).includes(d))
      ? String(resolved)
      : parsed.type === "ogv"
        ? `https://www.bilibili.tv/id/play/${parsed.season_id}/${parsed.ep_id}`
        : `https://www.bilibili.tv/id/video/${parsed.aid || parsed.raw_id}`

  const meta = await fetchMeta(pageUrl)
  const cookieValid = cookie
    ? Object.keys(videos).some((q) => ORDER.indexOf(q) < ORDER.indexOf("720P")) || locked_qualities.length === 0
    : null

  return {
    platform: "bilibili.tv",
    type: params.ep_id ? "ogv" : "ugc",
    id: params.ep_id || params.aid,
    title: meta.title,
    thumbnail: meta.thumbnail,
    duration: fmtDur(playurl.duration || allVids[0]?.duration),
    cookie_status: cookie ? (cookieValid ? "valid" : "invalid/expired") : "none",
    ...(resolved !== input && { resolved_url: resolved }),
    videos,
    ...(locked_qualities.length && { locked_qualities }),
    audio: bestAudio ? { url: bestAudio.url, size: bestAudio.size, codec: bestAudio.codecs } : null,
    // Wajib: CDN bilibili nolak request tanpa Referer ini.
    headers: { Referer: REF },
    note: "Format DASH: unduh salah satu video + audio, lalu gabung (mis. ffmpeg -i video -i audio -c copy out.mp4)",
  }
}

export default async function handler(req: Request, res: Response) {
  const q: any = req.method === "POST" ? { ...(req.query || {}), ...(req.body || {}) } : req.query || {}
  const url = String(q.url || q.q || q.id || "").trim()

  if (!url) {
    return res.status(400).json({
      status: false,
      message: "Parameter url wajib (link bilibili.tv, short link b23.tv, atau ID)",
    })
  }

  const qn = Number(q.qn) || 120
  const locale = typeof q.locale === "string" && q.locale ? q.locale : "id_ID"
  const cookie = typeof q.cookie === "string" && q.cookie ? q.cookie : process.env.BILIBILI_COOKIE || ""

  try {
    const data = await getBilibiliTvStreams(url, { qn, cookie, locale })

    // ?quality=720P menyaring satu kualitas saja, biar respon ringkas.
    const wanted = typeof q.quality === "string" ? q.quality.toUpperCase().replace(/\s+/g, " ").trim() : ""
    if (wanted) {
      if (!data.videos[wanted]) {
        return res.status(404).json({
          status: false,
          message: `Kualitas ${wanted} tidak tersedia`,
          available: Object.keys(data.videos),
          ...(data.locked_qualities && { locked_qualities: data.locked_qualities }),
        })
      }
      data.videos = { [wanted]: data.videos[wanted] }
    }

    return res.status(200).json({ status: true, data })
  } catch (e: any) {
    const code = typeof e.code === "number" && e.code >= 400 && e.code < 600 ? e.code : 500
    return res.status(code).json({ status: false, message: e.message || "Gagal memproses link bilibili" })
  }
}

