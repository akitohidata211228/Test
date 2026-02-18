import type { VercelRequest, VercelResponse } from "@vercel/node"
import axios from "axios"

const BASE = "https://rednotedownloader.com"

async function rednoteDownloader(url: string) {
  if (!url) throw new Error("URL is required.")

  const response = await axios.post(
    `${BASE}/id`,
    [url, ""],
    {
      headers: {
        Accept: "text/x-component",
        "Content-Type": "application/json",
        "Next-Action": "352bef296627adedcfc99e32c80dd93a4ee49d35",
        "Next-Router-State-Tree":
          "%5B%22%22%2C%7B%22children%22%3A%5B%5B%22locale%22%2C%22id%22%2C%22d%22%5D%2C%7B%22children%22%3A%5B%22__PAGE__%22%2C%7B%7D%2C%22%2Fid%22%2C%22refresh%22%5D%7D%2Cnull%2Cnull%2Ctrue%5D%7D%5D"
      },
      responseType: "text"
    }
  )

  if (typeof response.data !== "string") {
    throw new Error("Unexpected response format")
  }

  const parsed = parseRSC(response.data)

  // Fix relative download URLs
  if (parsed.medias && Array.isArray(parsed.medias)) {
    parsed.medias = parsed.medias.map((m: any) => ({
      ...m,
      url: m.url.startsWith("http") ? m.url : BASE + m.url
    }))
  }

  return parsed
}

function parseRSC(data: string) {
  const lines = data.split("\n")

  for (const line of lines) {
    if (line.startsWith("1:")) {
      const jsonPart = line.replace(/^1:/, "").trim()
      return JSON.parse(jsonPart)
    }
  }

  throw new Error("Failed to parse RSC response")
}

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    if (req.method !== "GET") {
      return res.status(405).json({
        status: false,
        message: "Method Not Allowed"
      })
    }

    const { url } = req.query

    if (!url) {
      return res.status(400).json({
        status: false,
        message: "Parameter url wajib"
      })
    }

    const data = await rednoteDownloader(url as string)

    return res.status(200).json({
      creator: "Lǐ Rén Xīn",
      status: true,
      platform: "rednote",
      data
    })
  } catch (e: any) {
    return res.status(500).json({
      status: false,
      message: e.message
    })
  }
}