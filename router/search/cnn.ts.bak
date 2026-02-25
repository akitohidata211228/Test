import { Request, Response } from "express";
import axios from "axios";
import cheerio from "cheerio";

const baseUrl = "https://www.cnnindonesia.com";

async function fetchHTML(url: string) {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      },
      timeout: 15000,
    });
    return response.data || "";
  } catch (err) {
    return "";
  }
}

function extractYear(title: string) {
  const match = title.match(/\b(19|20)\d{2}\b/);
  return match ? match[0] : null;
}

export default async function cnnHandler(
  req: Request,
  res: Response
) {
  try {
    const html = await fetchHTML(baseUrl);
    if (!html) {
      return res.status(500).json({
        creator: "Lǐ Rén Xīn",
        status: false,
        message: "Gagal mengambil halaman CNN",
        timestamp: new Date().toISOString(),
      });
    }

    const $ = cheerio.load(html);
    const results: any[] = [];

    $(".nhl-list article").each((i, el) => {
      const article = $(el);
      const link = article.find("a").first();
      const url = link.attr("href") || "";
      const title = link.find("h2").text().trim() || "";
      const image = article.find("img").attr("src") || "";
      const category =
        article.find(".text-cnn_red").first().text().trim() || "";

      if (url && title) {
        results.push({
          title,
          url,
          image,
          category,
          year: extractYear(title),
        });
      }
    });

    return res.json({
      creator: "Lǐ Rén Xīn",
      status: true,
      total: results.length,
      data: results,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return res.status(500).json({
      creator: "Lǐ Rén Xīn",
      status: false,
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }
}