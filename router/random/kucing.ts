/*
  Diadaptasi dari koleksi endpoint siputzx/apisku (github.com/siputzx/apisku).
  Kredit scraper: siputzx. Dipasang di sini lewat adapter descriptor src/autoload.ts.
*/
import axios from "axios"
import { Buffer } from "buffer"

const createImageResponse = (buffer: Buffer, filename: string | null = null) => {
  const headers: { [key: string]: string } = {
    "Content-Type": "image/jpeg",
    "Content-Length": buffer.length.toString(),
    "Cache-Control": "public, max-age=3600",
  }

  if (filename) {
    headers["Content-Disposition"] = `inline; filename="${filename}"`
  }

  return new Response(buffer, { headers })
}

async function getRandomCatImage() {
  try {
    /*
      Upstream lama (api.sefinek.net) rate-limit-nya galak: probe pertama 200,
      sesudahnya 403 terus, jadi endpoint ini praktis selalu gagal.
      Diganti TheCatAPI yang publik + tanpa kunci. Bentuk hasilnya array,
      URL gambar ada di [0].url.
    */
    const API_URL = "https://api.thecatapi.com/v1/images/search"
    const { data } = await axios.get(API_URL, {
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    const imageUrl = Array.isArray(data) ? data[0]?.url : data?.message
    if (!imageUrl) {
      throw new Error("Invalid response from external API: Missing image URL.")
    }

    const imageResponse = await axios.get(imageUrl, {
      responseType: "arraybuffer",
      timeout: 30000,
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })
    return Buffer.from(imageResponse.data, "binary")
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error("Failed to get random cat image from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/r/cats",
    name: "random foto kucing",
    category: "Random",
    description: "This API endpoint delivers a random image of a cat. It fetches the image from an external API and returns it directly as a binary response. This is ideal for applications, websites, or bots that need to display cute cat pictures to users, providing a delightful and engaging experience with every request.",
    tags: ["Random", "Image", "Cat", "Animal"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const imageData = await getRandomCatImage()
        return createImageResponse(imageData)
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        }
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/r/cats",
    name: "random foto kucing",
    category: "Random",
    description: "This API endpoint provides a random image of a cat via a POST request. It retrieves the image from an external source and sends it back as a binary response. This can be utilized in scenarios where POST requests are preferred for content retrieval, such as within web forms or specific backend integrations. The endpoint ensures a direct and efficient delivery of cat images.",
    tags: ["Random", "Image", "Cat", "Animal"],
    example: "",
    requestBody: {},
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      try {
        const imageData = await getRandomCatImage()
        return createImageResponse(imageData)
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Internal Server Error",
          code: 500,
        }
      }
    },
  },
]