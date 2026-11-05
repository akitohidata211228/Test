import { Request, Response } from "express"
import axios from "axios"

export default async function cecanIndonesiaHandler(
  req: Request,
  res: Response
) {
  try {
    const LIST_URL =
      "https://raw.githubusercontent.com/siputzx/Databasee/refs/heads/main/cecan/indonesia.json"

    // ambil list gambar
    const listRes = await axios.get(LIST_URL, { timeout: 30000 })
    const images: string[] = listRes.data

    if (!Array.isArray(images) || images.length === 0) {
      throw new Error("Image list empty")
    }

    // RANDOM SETIAP REQUEST
    const randomUrl =
      images[Math.floor(Math.random() * images.length)]

    // ambil gambar
    const imgRes = await axios.get(randomUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
    })

    const buffer = Buffer.from(imgRes.data)

    // header sama konsepnya kayak waifu
    res.setHeader("Content-Type", "image/jpeg")
    res.setHeader("Content-Length", buffer.length)
    res.setHeader("Cache-Control", "no-store")

    res.send(buffer)
  } catch (error: any) {
    console.error("Error cecan Indonesia:", error)
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
    })
  }
}