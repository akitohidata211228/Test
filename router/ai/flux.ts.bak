import { Request, Response } from "express"
import axios from "axios"
import { Buffer } from "buffer"

/**
 * Ambil base URL Cloudflare AI dari env
 * WAJIB ADA
 */
function CloudflareAi(): string {
  if (!process.env.CLOUDFLARE_AI_URL) {
    throw new Error("CLOUDFLARE_AI_URL belum diset di environment")
  }
  return process.env.CLOUDFLARE_AI_URL
}

/**
 * Generate image dari Flux
 */
async function generateFluxImage(prompt: string): Promise<Buffer> {
  try {
    const response = await axios.post(
      CloudflareAi() + "/image-generation",
      {
        model: "@cf/black-forest-labs/flux-1-schnell",
        prompt: prompt,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        },
        responseType: "arraybuffer",
        timeout: 30000,
      }
    )

    return Buffer.from(response.data)
  } catch (error: any) {
    const msg =
      error?.response?.data?.toString() ||
      error?.message ||
      "Flux API Error"
    throw new Error(msg)
  }
}

/**
 * EXPRESS HANDLER (FORMAT SAMA KAYAK GEMINI)
 */
export default async function fluxHandler(req: Request, res: Response) {
  const q = (req.query.q || req.body.q) as string

  if (!q) {
    return res.status(400).json({
      status: false,
      message: "Parameter 'q' diperlukan sebagai prompt",
    })
  }

  if (typeof q !== "string" || q.trim().length === 0) {
    return res.status(400).json({
      status: false,
      message: "Parameter 'q' harus berupa string",
    })
  }

  try {
    const imageBuffer = await generateFluxImage(q.trim())

    res.setHeader("Content-Type", "image/png")
    res.setHeader("Cache-Control", "public, max-age=3600")
    res.setHeader("Content-Length", imageBuffer.length)

    return res.send(imageBuffer)
  } catch (error: any) {
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    })
  }
}