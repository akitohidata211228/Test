// cnnHandler.ts
import { Request, Response } from "express";
import axios from "axios";
import cheerio from "cheerio";

class CNNNews {
  baseUrl: string;

  constructor() {
    this.baseUrl = "https://www.cnnindonesia.com";
  }

  async scrape() {
    const homeResponse = await axios.get(this.baseUrl);
    const $ = cheerio.load(homeResponse.data);

    const newsList: any[] = [];

    $(".nhl-list article").each((i, el) => {
      const article = $(el);
      const link = article.find("a").first();
      const url = link.attr("href");

      if (url && url !== "#") {
        newsList.push({
          url: url,
          title: link.find("h2").text().trim(),
          image: article.find("img").attr("src") || "",
          category: article.find(".text-cnn_red").first().text().trim() || "",
        });
      }
    });

    const results: any[] = [];

    for (const item of newsList.slice(0, 5)) { // ambil 5 berita teratas
      try {
        const articleResponse = await axios.get(item.url);
        const $$ = cheerio.load(articleResponse.data);

        const content: string[] = [];
        $$(".detail-text p").each((i, el) => {
          const text = $$(el).text().trim();
          if (text && !text.includes("BACA JUGA:")) content.push(text);
        });

        results.push({
          news: {
            title: item.title,
            url: item.url,
            image: item.image,
            category: item.category,
          },
          detail: {
            title: $$("h1").text().trim() || item.title,
            date: $$(".text-cnn_grey.text-sm").first().text().trim() || "",
            author: $$(".text-cnn_red").first().text().trim() || "",
            content: content.slice(0, 3), // ambil 3 paragraf pertama
            tags: $$(".flex.flex-wrap.gap-3 a")
              .map((i, el) => $$(el).text().trim())
              .get()
              .slice(0, 3), // ambil 3 tag
          },
        });
      } catch (err) {
        continue;
      }
    }

    return results;
  }
}

export default async function cnnHandler(
  req: Request,
  res: Response
) {
  try {
    const scraper = new CNNNews();
    const result = await scraper.scrape();

    return res.json({
      status: true,
      total: result.length,
      data: result,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    return res.status(500).json({
      status: false,
      message: error.message || "Internal Server Error",
      timestamp: new Date().toISOString(),
    });
  }
}