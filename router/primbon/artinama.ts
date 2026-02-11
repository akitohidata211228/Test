import { Request, Response } from "express"
import axios from "axios"
import * as cheerio from "cheerio"

async function scrapeArtiNama(nama: string) {
  const { data } = await axios.get(
    `https://primbon.com/arti_nama.php?nama1=${encodeURIComponent(nama)}&proses=+Submit%21+`,
    {
      timeout: 30000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Linux; Android 10) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Mobile Safari/537.36",
        "Accept-Language": "id-ID,id;q=0.9",
      },
    }
  )

  const $ = cheerio.load(data)
  const text = $("#body").text()

  if (!text.includes("memiliki arti")) return null

  return {
    nama,
    arti: text.split("memiliki arti: ")[1].split("Nama:")[0].trim(),
    catatan:
      "Gunakan juga aplikasi numerologi Kecocokan Nama untuk melihat keselarasan nama.",
  }
}

export default async function artiNamaHandler(req: Request, res: Response) {
  const nama = (req.query.nama || req.body?.nama) as string

  if (!nama || typeof nama !== "string") {
    return res.status(400).json({
      status: false,
      message: "Parameter 'nama' wajib diisi",
    })
  }

  try {
    const result = await scrapeArtiNama(nama.trim())

    if (!result) {
      return res.status(404).json({
        status: false,
        message: `Arti nama "${nama}" tidak ditemukan`,
      })
    }

    res.json({
      status: true,
      data: result,
    })
  } catch (error: any) {
    console.error("Primbon error:", error.message)
    res.status(500).json({
      status: false,
      message: "Gagal mengambil data Primbon",
    })
  }
}