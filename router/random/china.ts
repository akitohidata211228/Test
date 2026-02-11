import { Request, Response } from "express"
import axios from "axios"
import { Buffer } from "buffer"

async function getRandomCecanChinaImage(): Promise<Buffer> {
  const GIST_URL =
    "https://raw.githubusercontent.com/siputzx/Databasee/refs/heads/main/cecan/china.json"

  const { data: imageUrls } = await axios.get(GIST_URL, {
    timeout: 30000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  })

  if (!Array.isArray(imageUrls) || imageUrls.length === 0) {
    throw new Error("No image URLs found")
  }

  // 🔥 RANDOM BENARAN
  const randomUrl =
    imageUrls[Math.floor(Math.random() * imageUrls.length)] +
    "?rand=" +
    Date.now() +
    Math.random()

  const imageResponse = await axios.get(randomUrl, {
    responseType: "arraybuffer",
    timeout: 30000,
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
      "Cache-Control": "no-cache",
      Pragma: "no-cache",
    },
  })

  return Buffer.from(imageResponse.data)
}

export default async function cecanChinaHandler(
  req: Request,
  res: Response
) {
  try {
    const buffer = await getRandomCecanChinaImage()

    // 🚫 ANTI CACHE LEVEL DEWA
    res.set({
      "Content-Type": "image/jpeg",
      "Cache-Control":
        "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
      Pragma: "no-cache",
      Expires: "0",
      "Surrogate-Control": "no-store",
      "CDN-Cache-Control": "no-store",
      "Cloudflare-CDN-Cache-Control": "no-store",
      "X-Random": Date.now().toString(),
    })

    res.send(buffer)
  } catch (error: any) {
    console.error("Error cecan china:", error)
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
    })
  }
}