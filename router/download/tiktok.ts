/*
  Engine lama (snaptik.app) sudah nggak ngasih token lagi -> "Gagal mengambil
  token dari SnapTik" untuk semua link. Endpoint ini sekarang pakai engine
  snaptik.fi yang dipakai /api/download/aio dan masih hidup.

  Field `links` dipertahankan supaya response lama tetap kompatibel, dan
  `medias` ditambahkan biar tiap link ada label + tipenya.
*/
import { Request, Response } from 'express';
import { snaptikFi } from './aio';

export default async function tiktokHandler(req: Request, res: Response) {
    const url = (req.query.url || req.body?.url) as string;

    if (!url) return res.status(400).json({ status: false, message: "URL required" });

    try {
        const result = await snaptikFi(url);

        res.json({
            status: true,
            data: {
                platform: result.platform,
                type: result.type,
                title: result.title,
                author: result.author,
                duration: result.duration,
                thumbnail: result.cover,
                links: result.medias.map((m: any) => m.url),
                medias: result.medias
            }
        });
    } catch (error: any) {
        res.status(500).json({ status: false, message: error.message });
    }
}
