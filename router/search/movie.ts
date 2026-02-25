import { Request, Response } from "express";
import axios from "axios";
import cheerio from "cheerio";

async function fetchHTML(url: string) {
  try {
    const res = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
      },
      timeout: 15000
    });
    return res.data || "";
  } catch {
    return "";
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
    // 1. SEARCH
    const searchUrl = `https://movieku.fit/?s=${encodeURIComponent(query)}`;
    const searchHTML = await fetchHTML(searchUrl);
    const $search = cheerio.load(searchHTML);

    const searchResults: any = {
      query,
      total: 0,
      results: []
    };

    $search(".los article.box").each((_, el) => {
      const article = $search(el);
      const link = article.find("a.tip");
      const title = link.attr("title") || link.find("h2.entry-title").text();
      const url = link.attr("href");
      const img = article.find("img").attr("src");
      const quality = article.find(".quality").text();
      const year = title.match(/\((\d{4})\)/)?.[1] || "";

      if (url) {
        searchResults.results.push({
          title,
          url,
          image: img,
          quality,
          year,
          type: "Movie"
        });
      }
    });

    searchResults.total = searchResults.results.length;

    // 2. DETAIL dari hasil pertama
    let detail: any = {};
    const firstResult = searchResults.results[0];

    if (firstResult) {
      const detailHTML = await fetchHTML(firstResult.url);
      const $detail = cheerio.load(detailHTML);

      detail = {
        title: firstResult.title,
        url: firstResult.url,
        image: firstResult.image,
        synopsis: $detail(".synops .entry-content p").first().text().trim(),
        genres: $detail(".data li")
          .filter((_, el) => $detail(el).text().includes("Genre:"))
          .find("a")
          .map((_, a) => $detail(a).text().trim())
          .get(),
        release: $detail(".data li")
          .filter((_, el) => $detail(el).text().includes("Release:"))
          .text()
          .replace("Release:", "")
          .trim(),
        duration: $detail(".data li")
          .filter((_, el) => $detail(el).text().includes("Duration:"))
          .text()
          .replace("Duration:", "")
          .trim(),
        country: $detail(".data li")
          .filter((_, el) => $detail(el).text().includes("Country:"))
          .text()
          .replace("Country:", "")
          .trim(),
        rating: $detail(".data li")
          .filter((_, el) => $detail(el).text().includes("Rating:"))
          .text()
          .replace("Rating:", "")
          .trim(),
        quality: firstResult.quality,
        downloads: []
      };

      $detail("#smokeddl .smokeurl p").each((_, el) => {
        const q = $detail(el).find("strong").text().replace(":", "").trim();
        const links = $detail(el)
          .find("a")
          .map((_, a) => ({
            provider: $detail(a).text().trim(),
            url: $detail(a).attr("href")
          }))
          .get();
        if (q) detail.downloads.push({ quality: q, links });
      });
    }

    return res.json({
      creator: "Lǐ Rén Xīn",
      status: true,
      total: searchResults.total,
      search: searchResults.results,
      detail: detail,
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