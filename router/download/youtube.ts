import type { VercelRequest, VercelResponse } from "@vercel/node"
import axios from "axios"

const qualityvideo = ["144", "240", "360", "720", "1080"]

const headers = {
  "User-Agent":
    "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Mobile Safari/537.36",
  Accept: "*/*",
  "Accept-Language": "id-ID,id;q=0.9",
  "Content-Type": "application/x-www-form-urlencoded",
  Origin: "https://iframe.y2meta-uk.com",
  Referer: "https://iframe.y2meta-uk.com/"
}

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms))

function extractId(url: string): string {
  const patterns = [
    /youtu\.be\/([a-zA-Z0-9_-]{11})/,
    /watch\?v=([a-zA-Z0-9_-]{11})/,
    /shorts\/([a-zA-Z0-9_-]{11})/,
    /live\/([a-zA-Z0-9_-]{11})/,
    /embed\/([a-zA-Z0-9_-]{11})/
  ]

  for (const r of patterns) {
    const m = url.match(r)
    if (m) return m[1]
  }

  throw new Error("Invalid YouTube URL")
}

async function metadata(id: string) {
  const r = await axios.get(
    `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${id}&format=json`
  )

  return {
    title: r.data.title,
    author: r.data.author_name,
    thumbnail: `https://i.ytimg.com/vi/${id}/0.jpg`
  }
}

async function getKey(): Promise<string> {
  const r = await axios.get("https://cnv.cx/v2/sanity/key", { headers })
  return r.data.key
}

async function createJob(id: string) {
  const key = await getKey()
  const quality = "720"

  const r = await axios.post(
    "https://cnv.cx/v2/converter",
    new URLSearchParams({
      link: `https://youtu.be/${id}`,
      format: "mp4",
      audioBitrate: "128",
      videoQuality: qualityvideo.includes(quality) ? quality : "720",
      filenameStyle: "pretty",
      vCodec: "h264"
    }).toString(),
    { headers: { ...headers, key } }
  )

  return r.data
}

async function getJob(jobId: string) {
  const r = await axios.get(`https://cnv.cx/v2/status/${jobId}`, { headers })
  return r.data
}

async function poll(jobId: string, id: string, meta: any) {
  for (let i = 0; i < 30; i++) {
    await sleep(2000)
    const s = await getJob(jobId)

    if (s.status === "completed" && s.url) {
      return {
        id,
        ...meta,
        format: "mp4",
        quality: "720",
        download: s.url,
        filename: s.filename
      }
    }

    if (s.status === "error") {
      throw new Error(s.message)
    }
  }

  throw new Error("Timeout processing video")
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({ message: "Method Not Allowed" })
    }

    const { url } = req.query

    if (!url) {
      return res.status(400).json({
        status: false,
        message: "Parameter url wajib"
      })
    }

    const id = extractId(url as string)
    const meta = await metadata(id)
    const job = await createJob(id)

    let result
    if (job.status === "tunnel" && job.url) {
      result = {
        id,
        ...meta,
        format: "mp4",
        quality: "720",
        download: job.url,
        filename: job.filename
      }
    } else if (job.status === "processing") {
      result = await poll(job.jobId, id, meta)
    } else {
      throw new Error("Gagal memproses video")
    }

    res.status(200).json({
      status: true,
      platform: "youtube",
      ...result
    })
  } catch (e: any) {
    res.status(500).json({
      status: false,
      message: e.message
    })
  }
}