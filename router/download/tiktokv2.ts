import { Request, Response } from 'express';
import axios from 'axios';
// @ts-ignore
import { CookieJar } from 'tough-cookie';
import * as cheerio from 'cheerio';
import { wrapper } from 'axios-cookiejar-support';

class SaveTTClient {
private jar: CookieJar;
private client: any;

constructor() {  
    this.jar = new CookieJar();  
    this.client = wrapper(axios.create({  
        baseURL: "https://savett.cc",  
        jar: this.jar,  
        withCredentials: true,  
        headers: {  
            "User-Agent": "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",  
            "Upgrade-Insecure-Requests": "1",  
            "Content-Type": "application/x-www-form-urlencoded"  
        },  
        timeout: 30000,  
    }));  
}  

private async getToken(): Promise<string> {  
    const { data } = await this.client.get("/en1/download", {  
        headers: { Referer: "https://savett.cc/en1/download" },  
    });  

    const token = data.match(/name="csrf_token" value="([^"]+)"/)?.[1];  
    if (!token) throw new Error("Gagal mengambil CSRF token.");  

    return token;  
}  

private async requestDownload(url: string): Promise<string> {  
    const csrf = await this.getToken();  

    const params = new URLSearchParams();  
    params.append("csrf_token", csrf);  
    params.append("url", url);  

    const { data } = await this.client.post("/en1/download", params.toString(), {  
        headers: {  
            Referer: "https://savett.cc/en1/download",  
            Origin: "https://savett.cc",  
        },  
    });  

    return data;  
}  

private parseHtml(html: string) {  
    const $ = cheerio.load(html);  

    const stats: string[] = [];  
    $("#video-info .my-1 span").each((_, el) => {  
        stats.push($(el).text().trim());  
    });  

    const result = {  
        username: $("#video-info h3").first().text().trim() || null,  
        views: stats[0] || null,  
        likes: stats[1] || null,  
        bookmarks: stats[2] || null,  
        comments: stats[3] || null,  
        shares: stats[4] || null,  
        duration: $("#video-info p.text-muted")  
            .first()  
            .text()  
            .replace(/Duration:/i, "")  
            .trim() || null,  
        type: null as "video" | "photo" | null,  
        downloads: {  
            nowm: [] as string[],  
            wm: [] as string[],  
        },  
        mp3: [] as string[],  
        slides: [] as { index: number; url: string }[],  
    };  

    const slides = $(".carousel-item[data-data]");  

    if (slides.length) {  
        result.type = "photo";  

        slides.each((_, el) => {  
            try {  
                const raw = $(el).attr("data-data");  
                if (!raw) return;  

                const json = JSON.parse(raw.replace(/&quot;/g, '"'));  

                if (Array.isArray(json.URL)) {  
                    json.URL.forEach((url: string) => {  
                        result.slides.push({  
                            index: result.slides.length + 1,  
                            url,  
                        });  
                    });  
                }  
            } catch {}  
        });  

        return result;  
    }  

    result.type = "video";  

    $("#formatselect option").each((_, el) => {  
        const label = $(el).text().toLowerCase();  
        const raw = $(el).attr("value");  
        if (!raw) return;  

        try {  
            const json = JSON.parse(raw.replace(/&quot;/g, '"'));  
            if (!json.URL) return;  

            if (label.includes("mp4") && !label.includes("watermark")) {  
                result.downloads.nowm.push(...json.URL);  
            }  

            if (label.includes("watermark")) {  
                result.downloads.wm.push(...json.URL);  
            }  

            if (label.includes("mp3")) {  
                result.mp3.push(...json.URL);  
            }  
        } catch {}  
    });  

    return result;  
}  

public async process(url: string) {  
    try {  
        const html = await this.requestDownload(url);  
        return this.parseHtml(html);  
    } catch (e: any) {  
        throw new Error(e.message);  
    }  
}

}

export default async function tiktokdownloaderv2(req: Request, res: Response) {
const url = (req.query.url || req.body.url) as string;

if (!url)  
    return res.status(400).json({  
        status: false,  
        message: "URL required",  
    });  

try {  
    const client = new SaveTTClient();  
    const result = await client.process(url);  

    res.json({  
        status: true,  
        data: result,  
    });  
} catch (error: any) {  
    res.status(500).json({  
        status: false,  
        message: error.message,  
    });  
}

}

