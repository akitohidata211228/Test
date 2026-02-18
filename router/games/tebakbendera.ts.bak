import axios from "axios"

async function scrape() {
  try {
    const response = await axios.get("https://flagcdn.com/en/codes.json", {
      timeout: 30000,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36",
      },
    })

    const data = response.data
    const keys = Object.keys(data)

    if (!keys.length) {
      throw new Error("Data kosong")
    }

    const randomKey =
      keys[Math.floor(Math.random() * keys.length)]

    return {
      index: keys.indexOf(randomKey) + 1,
      gambar: `https://flagpedia.net/data/flags/ultra/${randomKey}.png`,
      jawaban: data[randomKey].toUpperCase(),
    }

  } catch (error: any) {
    try {
      const srcResponse = await axios.get(
        "https://raw.githubusercontent.com/BochilTeam/database/master/games/tebakbendera2.json",
        { timeout: 30000 }
      )

      const src = srcResponse.data

      if (!Array.isArray(src) || !src.length) {
        throw new Error("Fallback data kosong")
      }

      const random =
        src[Math.floor(Math.random() * src.length)]

      return {
        index: random.index,
        gambar: random.img,
        jawaban: random.jawaban?.toUpperCase(),
      }

    } catch (innerError: any) {
      throw new Error("Failed to get response from API")
    }
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/games/tebakbendera",
    name: "tebak bendera",
    category: "Games",
    description: "",
    tags: ["Games"],
    example: "",
    parameters: [],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,

    async run() {
      try {
        const data = await scrape()

        if (!data) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

        return {
          status: true,
          data: data,
          timestamp: new Date().toISOString(),
        }

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
    endpoint: "/api/games/tebakbendera",
    name: "tebak bendera",
    category: "Games",
    description: "",
    tags: ["Games"],
    example: "",
    requestBody: {},
    isPremium: false,
    isMaintenance: false,
    isPublic: true,

    async run() {
      try {
        const data = await scrape()

        if (!data) {
          return {
            status: false,
            error: "No result returned from API",
            code: 500,
          }
        }

        return {
          status: true,
          data: data,
          timestamp: new Date().toISOString(),
        }

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