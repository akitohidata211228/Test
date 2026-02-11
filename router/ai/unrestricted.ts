import axios, { AxiosInstance } from "axios";
import fs from "fs";
import path from "path";

interface ImageResult {
  success: boolean;
  imageUrl?: string;
  prompt?: string;
  style?: string;
  nonce?: string;
  info?: any;
  error?: string;
  html?: string;
}

class UnrestrictedAIScraper {
  private baseURL: string;
  private headers: Record<string, string>;
  private cookie: string;
  private session: AxiosInstance;

  constructor() {
    this.baseURL = "https://unrestrictedaiimagegenerator.com";
    this.headers = {
      authority: "unrestrictedaiimagegenerator.com",
      accept: "*/*",
      "accept-encoding": "gzip, deflate, br, zstd",
      "accept-language": "id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      origin: "https://unrestrictedaiimagegenerator.com",
      priority: "u=1, i",
      referer: "https://unrestrictedaiimagegenerator.com/",
      "sec-ch-ua":
        '"Not(A:Brand";v="8", "Chromium";v="144", "Google Chrome";v="144"',
      "sec-ch-ua-mobile": "?1",
      "sec-ch-ua-platform": '"Android"',
      "sec-fetch-dest": "empty",
      "sec-fetch-mode": "cors",
      "sec-fetch-site": "same-origin",
      "user-agent":
        "Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Mobile Safari/537.36",
      "x-requested-with": "XMLHttpRequest",
    };

    this.cookie = this.generateCookies();
    this.headers["cookie"] = this.cookie;

    this.session = axios.create({
      baseURL: this.baseURL,
      headers: this.headers,
      withCredentials: true,
    });
  }

  private generateCookies(): string {
    const timestamp = Math.floor(Date.now() / 1000);
    const ga1 = `GA1.1.${Math.floor(Math.random() * 1_000_000_000)}.${timestamp}`;
    const ga2 = `GS2.1.s${timestamp}$o1$g1$t${timestamp}$j40$l0$h0`;
    return `_ga=${ga1}; _ga_J4MEF7G6YX=${ga2}`;
  }

  private async getNonce(): Promise<string> {
    const response = await this.session.get("/");
    const match = response.data.match(/name="_wpnonce" value="([^"]+)"/);
    if (match) return match[1];

    const altMatch = response.data.match(/name="_wpnonce".*?value="([^"]+)"/);
    return altMatch ? altMatch[1] : "218155152c";
  }

  public async generateImage(prompt: string, style = "photorealistic"): Promise<ImageResult> {
    const nonce = await this.getNonce();

    const payload = new URLSearchParams({
      generate_image: "true",
      image_description: prompt,
      image_style: style,
      _wpnonce: nonce,
    }).toString();

    const response = await this.session.post("/", payload, {
      headers: {
        ...this.headers,
        "content-length": Buffer.byteLength(payload).toString(),
        cookie: this.cookie,
      },
    });

    const imageUrl = this.extractImageUrl(response.data);

    if (imageUrl) {
      const imageInfo = this.extractImageInfo(response.data);
      return { success: true, imageUrl, prompt, style, nonce, info: imageInfo };
    }

    return { success: false, error: "Gambar tidak ditemukan", html: response.data.slice(0, 500) + "..." };
  }

  private extractImageUrl(html: string): string | null {
    const patterns = [
      /src="([^"]*\/ai-images\/[^"]*\.(?:png|jpg|jpeg|webp))"/i,
      /src="([^"]*\/wp-content\/uploads\/ai-images\/[^"]*\.(?:png|jpg|jpeg|webp))"/i,
      /resultImage.*?src="([^"]+)"/i,
      /src="([^"]*unrestrictedaiimagegenerator_com_ai_[^"]*\.png)"/i,
    ];

    for (const pattern of patterns) {
      const match = html.match(pattern);
      if (match && match[1]) return match[1];
    }

    const imgMatch = html.match(/<img[^>]*src="([^"]*\/ai-images\/[^"]*)"[^>]*>/i);
    return imgMatch ? imgMatch[1] : null;
  }

  private extractImageInfo(html: string) {
    const info: { recentImages: Array<{ imageUrl: string; prompt: string; style: string }> } = { recentImages: [] };
    const recentRegex =
      /<div class="recent-item">[\s\S]*?<img[^>]*src="([^"]*)"[^>]*>[\s\S]*?<div class="recent-item-prompt">([^<]*)<\/div>[\s\S]*?<div class="recent-item-style">([^<]*)<\/div>/gi;

    let match;
    while ((match = recentRegex.exec(html)) !== null) {
      info.recentImages.push({ imageUrl: match[1], prompt: match[2], style: match[3] });
    }

    return info;
  }

  public async downloadImage(imageUrl: string, savePath = "./downloads"): Promise<string> {
    if (!fs.existsSync(savePath)) fs.mkdirSync(savePath, { recursive: true });

    const filename = path.basename(imageUrl);
    const filePath = path.join(savePath, filename);

    const response = await axios.get(imageUrl, {
      responseType: "stream",
      headers: { Referer: this.baseURL, "User-Agent": this.headers["user-agent"] },
    });

    const writer = fs.createWriteStream(filePath);
    response.data.pipe(writer);

    return new Promise((resolve, reject) => {
      writer.on("finish", () => resolve(filePath));
      writer.on("error", reject);
    });
  }

  public async batchGenerate(prompts: string[], style = "photorealistic", delay = 2000) {
    const results: ImageResult[] = [];
    for (let i = 0; i < prompts.length; i++) {
      results.push(await this.generateImage(prompts[i], style));
      if (i < prompts.length - 1) await this.sleep(delay);
    }
    return results;
  }

  private sleep(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Contoh pakai di script
(async () => {
  const scraper = new UnrestrictedAIScraper();
  const data = await scraper.generateImage("Kucing lucu", "photorealistic");
  console.log(JSON.stringify(data, null, 2));
})();