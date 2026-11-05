import type { Request, Response } from "express"
import axios from "axios"

/*
  YouTube -> mp3/mp4 lewat backend ytmp3.mobi (a.ymcdn.org).
  Alurnya 3 tahap: init session -> minta convert -> polling progress
  sampai progress >= 3, baru downloadURL-nya valid.
*/

const HEADERS = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "*/*",
  "Accept-Language": "en-US,en;q=0.9",
  Origin: "https://id.ytmp3.mobi",
  Referer: "https://id.ytmp3.mobi/",
  "Sec-Fetch-Dest": "empty",
  "Sec-Fetch-Mode": "cors",
  "Sec-Fetch-Site": "cross-site"
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

/*
  Batas polling. Vercel serverless punya limit eksekusi (10s hobby, 60s pro),
  jadi jangan nunggu sampai 60x — lebih baik balas 504 daripada dipotong
  platform dan client dapat response kosong.
*/
const POLL_INTERVAL = 1500
const MAX_POLL = Number(process.env.YTMP3_MAX_POLL || 18)

/*
  Pola per bentuk URL dulu, baru fallback ID mentah.
  Fallback-nya WAJIB punya capture group: tanpa itu match[1] selalu
  undefined dan input berupa ID polos ("dQw4w9WgXcQ") ikut gagal.
*/
const ID_PATTERNS = [
  /youtu\.be\/([a-zA-Z0-9_-]{11})/,
  /[?&]v=([a-zA-Z0-9_-]{11})/,
  /\/shorts\/([a-zA-Z0-9_-]{11})/,
  /\/live\/([a-zA-Z0-9_-]{11})/,
  /\/embed\/([a-zA-Z0-9_-]{11})/,
  /^([a-zA-Z0-9_-]{11})$/
]

export function extractVideoId(input: string): string | null {
  if (!input) return null
  const clean = input.trim()

  for (const re of ID_PATTERNS) {
    const m = re.exec(clean)
    if (m) return m[1]
  }
  return null
}

/* Backend pakai field `error` numerik, bukan HTTP status. */
const assertOk = (data: any, stage: string) => {
  if (!data || typeof data !== "object") {
    throw new Error(`Respon ${stage} tidak valid`)
  }
  if (Number(data.error) > 0) {
    throw new Error(`Backend ${stage} balas error: ${data.error}`)
  }
}

async function metadata(videoId: string) {
  try {
    const r = await axios.get(
      `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`,
      { timeout: 8000 }
    )
    return { title: r.data?.title || "", author: r.data?.author_name || "" }
  } catch {
    /* Metadata cuma pelengkap — kalau gagal, jangan gagalkan konversinya. */
    return { title: "", author: "" }
  }
}

export async function scrapeYtmp3(youtubeUrl: string, format = "mp3") {
  const videoId = extractVideoId(youtubeUrl)
  if (!videoId) {
    const err: any = new Error("URL YouTube tidak valid, video ID tidak ketemu")
    err.code = 400
    throw err
  }

  const fmt = String(format).toLowerCase()
  if (fmt !== "mp3" && fmt !== "mp4") {
    const err: any = new Error('Format harus "mp3" atau "mp4"')
    err.code = 400
    throw err
  }

  const cacheBust = () => Date.now().toString(36) + Math.random().toString(36).slice(2)

  // 1. Init session
  const initRes = await axios.get(
    `https://a.ymcdn.org/api/v1/init?p=y&23=1llum1n471&_=${cacheBust()}`,
    { headers: HEADERS, timeout: 15000 }
  )
  assertOk(initRes.data, "init")

  if (!initRes.data.convertURL) {
    throw new Error("Respon init tidak mengandung convertURL")
  }

  // 2. Minta konversi. Backend bisa balas redirect, ikutin sampai selesai.
  let convertRequestUrl = `${initRes.data.convertURL}&v=${videoId}&f=${fmt}&_=${cacheBust()}`
  let convertData: any
  let hops = 0

  while (true) {
    if (++hops > 5) throw new Error("Terlalu banyak redirect dari backend convert")

    const convertRes = await axios.get(convertRequestUrl, { headers: HEADERS, timeout: 20000 })
    assertOk(convertRes.data, "convert")
    convertData = convertRes.data

    if (Number(convertData.redirect) > 0 && convertData.redirectURL) {
      convertRequestUrl = `${convertData.redirectURL}&v=${videoId}&f=${fmt}&_=${cacheBust()}`
      continue
    }
    break
  }

  const progressUrl = convertData.progressURL
  let downloadUrl = convertData.downloadURL
  let title = convertData.title || ""

  if (!progressUrl) throw new Error("Respon convert tidak mengandung progressURL")

  // 3. Polling sampai progress >= 3 (selesai)
  let progress = 0
  for (let i = 0; i < MAX_POLL && progress < 3; i++) {
    await sleep(POLL_INTERVAL)

    const progressRes = await axios.get(`${progressUrl}&_=${cacheBust()}`, {
      headers: HEADERS,
      timeout: 15000
    })
    assertOk(progressRes.data, "progress")

    progress = Number(progressRes.data.progress) || 0
    if (progressRes.data.title) title = progressRes.data.title
    if (progressRes.data.downloadURL) downloadUrl = progressRes.data.downloadURL
  }

  if (progress < 3) {
    const err: any = new Error(
      `Konversi belum selesai setelah ${Math.round((MAX_POLL * POLL_INTERVAL) / 1000)}s, coba lagi`
    )
    err.code = 504
    throw err
  }

  if (!downloadUrl) throw new Error("Konversi selesai tapi downloadURL kosong")

  /* Judul dari backend sering kosong; ambil dari oembed sebagai cadangan. */
  const meta = title ? { title, author: "" } : await metadata(videoId)

  return {
    videoId,
    title: title || meta.title,
    author: meta.author,
    format: fmt,
    thumbnail: `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
    download: downloadUrl
  }
}

export default async function handler(req: Request, res: Response) {
  try {
    const url = (req.query.url || req.query.q) as string
    const format = (req.query.format as string) || "mp3"

    if (!url) {
      return res.status(400).json({
        status: false,
        message: "Parameter url wajib diisi"
      })
    }

    const result = await scrapeYtmp3(url, format)

    return res.status(200).json({
      status: true,
      platform: "youtube",
      ...result
    })
  } catch (e: any) {
    const code = Number(e?.code) >= 400 && Number(e?.code) < 600 ? Number(e.code) : 502
    return res.status(code).json({
      status: false,
      message: e?.message || "Gagal memproses video"
    })
  }
}
