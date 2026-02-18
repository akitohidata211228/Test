import type { VercelRequest, VercelResponse } from "@vercel/node"
import axios from "axios"

async function rednoteDownloader(url: string) {
  if (!url) throw new Error("URL is required.")

  try {
    const response = await axios.post(
      "https://rednotedownloader.com/id",
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

    let result: any = response.data

    if (typeof result === "string") {
      const mediaUrlMatch = result.match(
        /(https?:\/\/[^\s"'<>]+\.(mp4|jpg|jpeg|png|gif|webp))/gi
      )

      if (mediaUrlMatch && mediaUrlMatch.length > 0) {
        result = {
          raw: result,
          possibleMediaUrls: mediaUrlMatch,
          message: "Extracted possible direct download link(s)"
        }
      }
    }

    return result
  } catch (err: any) {
    throw new Error(`Downloader error: ${err.message}`)
  }
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

    res.status(200).json({
      status: true,
      platform: "rednote",
      data
    })
  } catch (e: any) {
    res.status(500).json({
      status: false,
      message: e.message
    })
  }
}