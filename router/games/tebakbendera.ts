import { Request, Response } from "express"
import axios from "axios"

async function scrape() {
  try {
    const response = await axios.get(
      "https://flagcdn.com/en/codes.json",
      {
        timeout: 30000,
        headers: {
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
        },
      }
    )

    const data = response.data
    const keys = Object.keys(data)

    const randomKey =
      keys[Math.floor(Math.random() * keys.length)]

    return {
      gambar: `https://flagpedia.net/data/flags/ultra/${randomKey}.png`,
      jawaban: data[randomKey].toUpperCase(),
      index: keys.indexOf(randomKey) + 1,
    }

  } catch (error: any) {
    try {
      const srcResponse = await axios.get(
        "https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakbendera2.json",
        { timeout: 30000 }
      )

      const src = srcResponse.data
      const random =
        src[Math.floor(Math.random() * src.length)]

      return {
        gambar: random.img,
        jawaban: random.name.toUpperCase(),
        index: 1,
      }

    } catch (innerError: any) {
      throw new Error("Failed to get response from API")
    }
  }
}

export default async function tebakBenderaHandler(
  req: Request,
  res: Response
) {
  try {
    const data = await scrape()

    if (!data) {
      return res.status(500).json({
        status: false,
        message: "No result returned from API",
      })
    }

    res.setHeader("Cache-Control", "no-store")

    return res.json({
      status: true,
      data: data,
      timestamp: new Date().toISOString(),
    })

  } catch (error: any) {
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
    })
  }
}