import { Request, Response } from "express"
import axios from "axios"
import { load } from "cheerio"

const baseURL = "https://klikxxi.me"

const client = axios.create({
  headers: {
    "User-Agent":
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "Accept":
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Referer": "https://google.com",
    "Connection": "keep-alive"
  },
  timeout: 30000,
})

function extractYear(title: string) {
  const match = title.match(/\b(19|20)\d{2}\b/)
  return match ? match[0] : null
}

export default async function klikxxiSearchHandler(
  req: Request,
  res: Response
) {
  const query = req.query.q as string

  if (!query) {
    return res.status(400).json({
      status: false,
      message: "Parameter 'q' diperlukan",
    })
  }

  try {
    const url = `${baseURL}/?s=${encodeURIComponent(query)}&post_type[]=post&post_type[]=tv`

    const response = await client.get(url)

    // 🔥 DEBUG HTML
    console.log("===== HTML PREVIEW =====")
    console.log(response.data.slice(0, 800))
    console.log("===== END PREVIEW =====")

    const $ = load(response.data)
    const results: any[] = []

    // coba selector alternatif juga
    $(".item-infinite, .gmr-box-content").each((_, el) => {
      const item = $(el)

      const title = item.find(".entry-title a").text().trim()
      const url = item.find(".entry-title a").attr("href")

      const thumbnail =
        item.find("img").attr("data-lazy-src") ||
        item.find("img").attr("src")

      const rating = item.find(".gmr-rating-item").text().trim()
      const duration = item.find(".gmr-duration-item").text().trim()
      const quality = item.find(".gmr-quality-item").text().trim()

      if (title && url) {
        results.push({
          title,
          url,
          thumbnail: thumbnail?.startsWith("http")
            ? thumbnail
            : thumbnail
            ? baseURL + thumbnail
            : null,
          rating,
          duration,
          quality,
          year: extractYear(title),
        })
      }
    })

    return res.json({
      status: true,
      total: results.length,
      data: results,
      timestamp: new Date().toISOString(),
    })

  } catch (error: any) {
    console.error("Search Error:", error.message)
    return res.status(500).json({
      status: false,
      message: error.message,
    })
  }
}