import { Request, Response } from "express"
import axios from "axios"
import { Buffer } from "buffer"

declare const CloudflareAi: () => string | null

async function generateFluxImage(prompt: string): Promise<Buffer> {
  try {
    const response = await axios.post(
      CloudflareAi() + "/image-generation",
      {
        model: "@cf/black-forest-labs/flux-1-schnell",
        prompt,
      },
      {
        headers: {
          "Content-Type": "application/json",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
        },
        responseType: "arraybuffer",
        timeout: 30000,
      }
    )

    return Buffer.from(response.data)
  } catch (error: any) {
    const msg = error?.response?.data || error?.message || "Unknown error"
    throw new Error(`Flux API Error: ${msg}`)
  }
}

export default async function fluxHandler(req: Request, res: Response) {
  const prompt = (req.query.prompt || req.body.prompt) as string

  if (!prompt) {
    return res.status(400).json({
      status: false,
      message: "Parameter 'prompt' diperlukan.",
    })
  }

  if (typeof prompt !== "string" || prompt.trim().length === 0) {
    return res.status(400).json({
      status: false,
      message: "Parameter 'prompt' harus berupa string.",
    })
  }

  try {
    const imageBuffer = await generateFluxImage(prompt.trim())

    res.setHeader("Content-Type", "image/png")
    res.setHeader("Content-Length", imageBuffer.length)
    res.setHeader("Cache-Control", "public, max-age=3600")

    res.send(imageBuffer)
  } catch (error: any) {
    res.status(500).json({
      status: false,
      message: error.message,
    })
  }
}