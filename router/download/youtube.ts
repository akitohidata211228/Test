/*
  Engine lama (iframe.y2meta-uk.com + cnv.cx) sudah balas 403 ke semua request
  per 29 Agustus 2026, jadi endpoint ini dipindah ke backend ytmp3.mobi yang
  sama dengan /api/download/ytmp3 — cuma format-nya mp4.

  Bentuk response dijaga tetap sama biar /api/download/aio (yang delegasi ke
  sini untuk link YouTube) dan pemakai lama nggak perlu ganti apa-apa.
*/
import type { Request, Response } from "express"
import { scrapeYtmp3 } from "./ytmp3"

export default async function handler(req: Request, res: Response) {
  try {
    const url = (req.query.url || req.query.q || req.body?.url) as string

    if (!url) {
      return res.status(400).json({
        status: false,
        message: "Parameter url wajib"
      })
    }

    const result = await scrapeYtmp3(url, "mp4")

    res.status(200).json({
      status: true,
      platform: "youtube",
      id: result.videoId,
      title: result.title,
      author: result.author,
      format: "mp4",
      quality: "720",
      thumbnail: result.thumbnail,
      download: result.download
    })
  } catch (e: any) {
    res.status(typeof e.code === "number" ? e.code : 500).json({
      status: false,
      message: e.message
    })
  }
}
