import { Request, Response } from "express"
import axios from "axios"

export default async function tebakGambarHandler(
  req: Request,
  res: Response
) {
  try {
    const LIST_URL =
      "https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakgambar.json"

    const listRes = await axios.get(LIST_URL, { timeout: 30000 })
    const data = listRes.data

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error("Data kosong")
    }

    const random =
      data[Math.floor(Math.random() * data.length)]

    // mapping field
    const result = {
      gambar: random.img,
      jawaban: random.jawaban
    }

    res.json({
      status: true,
      data: result,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    res.status(500).json({
      status: false,
      message: "Internal Server Error",
    })
  }
}