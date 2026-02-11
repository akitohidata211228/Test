import axios from "axios"
import { sendBinary } from "./sendBinary"

async function getRandomCecanChinaImage() {
  const URL =
    "https://raw.githubusercontent.com/siputzx/Databasee/refs/heads/main/cecan/china.json"

  const { data } = await axios.get(URL, { timeout: 30000 })

  if (!Array.isArray(data) || !data.length) {
    throw new Error("Image list empty")
  }

  const randomUrl = data[Math.floor(Math.random() * data.length)]

  const img = await axios.get(randomUrl, {
    responseType: "arraybuffer",
    timeout: 30000,
  })

  return Buffer.from(img.data)
}

export default [
  {
    metode: "GET",
    endpoint: "/api/r/cecan/china",
    name: "cecan china",
    async run({ res }) {
      try {
        const buffer = await getRandomCecanChinaImage()
        sendBinary(res, buffer, "image/jpeg", "cecan-china.jpg")
      } catch (e: any) {
        res.statusCode = 500
        res.end(JSON.stringify({ status: false, message: e.message }))
      }
    },
  },
]