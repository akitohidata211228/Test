import { Request, Response } from "express";
import axios from "axios";
import cheerio from "cheerio";

async function fetchHTML(url: string) {
  try {
    const res = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7"
      },
      timeout: 15000
    });
    return res.data || "";
  } catch (err) {
    console.error("Fetch error:", err.message);
    return ""; // return empty string biar cheerio.load tidak error
  }
}

export default async function moviekuHandler(req: Request, res: Response) {
  const query = (req.query.q || req.query.query) as string;
  if (!query) {
    return res.status(400).json({
      creator: "Lǐ Rén Xīn",
      status: false,
      message: "Parameter 'q' diperlukan",
      timestamp: new Date().toISOString()
    });
  }

  try {
    // SEARCH
    const searchURL = `https://movieku.fit/?s=${encodeURIComponent(query)}`;
    const searchHTML = await fetchHTML(searchURL);

    if (!searchHTML) {
      return res.status(500).json({
        creator: "Lǐ Rén Xīn",
        status: false,
        message: "Gagal fetch MovieKu atau website berubah",
        timestamp: new Date().toISOString()
      });
    }

    const $ = cheerio.load(searchHTML);
    const results: any[] = [];

    $(".los article.box").each((_, el) => {
      const item = $(el);
      const link = item.find("a.tip");
      const title = link.attr("title") || link.find("h2.entry-title").text();
      const url = link.attr("href");
      const img = item.find("img").attr("src");
      const quality = item.find(".quality").text();
      const year = title?.match(/\((\d{4})\)/)?.[1] || "";

      if (url) {
        results.push({ title, url, image: img, quality, year });
      }
    });

    // Ambil detail film pertama
    let detail: any = {};
    if (results.length > 0) {
      const firstURL = results[0].url;
      const detailHTML = await fetchHTML(firstURL);
      if (detailHTML) {
        const $$ = cheerio.load(detailHTML);
        detail = {
          title: results[0].title,
          url: firstURL,
          image: results[0].image,
          synopsis: $$(".synops .entry-content p").first().text().trim(),
        };
      }
    }

    return res.json({
      creator: "Lǐ Rén Xīn",
      status: true,
      total: results.length,
      search: results,
      detail,
      timestamp: new Date().toISOString()
    });

  } catch (err: any) {
    return res.status(500).json({
      creator: "Lǐ Rén Xīn",
      status: false,
      message: err.message,
      timestamp: new Date().toISOString()
    });
  }
}