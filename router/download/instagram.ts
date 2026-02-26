import { Request, Response } from "express";
import axios from "axios";

async function getDownloadgramMedia(url: string) {
    const headers = {
        "content-type": "application/x-www-form-urlencoded",
        "user-agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36",
        referer: "https://downloadgram.org/",
        origin: "https://downloadgram.org/",
    };

    try {
        const payload = new URLSearchParams({
            url: url,
            v: "3",
            lang: "en",
        });

        const response = await axios.post(
            "https://api.downloadgram.org/media",
            payload.toString(),
            { headers }
        );

        const rawData = response.data;

        const linkMatch = rawData.match(
            /<a download=\\"\\" target=\\"_blank\\" rel=\\"noopener noreferrer\\" href=\\"([^"]+)\\">/
        );

        if (linkMatch && linkMatch[1]) {
            const downloadUrl = linkMatch[1].replace(/\\/g, "");

            return {
                status: true,
                url: downloadUrl,
            };
        }

        return {
            status: false,
            message: "Download link not found",
        };
    } catch (error: any) {
        return {
            status: false,
            message: error.message || "Failed to fetch media",
        };
    }
}

export default async function instagramDownloader(
    req: Request,
    res: Response
) {
    const url = (req.query.url || req.body.url) as string;

    if (!url) {
        return res.status(400).json({
            status: false,
            message: "URL is required",
        });
    }

    if (!url.includes("instagram.com")) {
        return res.status(400).json({
            status: false,
            message: "Invalid Instagram URL",
        });
    }

    try {
        const result = await getDownloadgramMedia(url);

        if (!result?.status) {
            return res.status(500).json(result);
        }

        return res.json({
            status: true,
            creator: "LǐRénXīn",
            data: {
                download: result.url,
            },
        });
    } catch (error: any) {
        return res.status(500).json({
            status: false,
            message: error.message,
        });
    }
}