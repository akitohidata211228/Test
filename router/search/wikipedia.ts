/*
  Diadaptasi dari koleksi endpoint siputzx/apisku (github.com/siputzx/apisku).
  Kredit scraper: siputzx. Dipasang di sini lewat adapter descriptor src/autoload.ts.
*/
import axios from "axios"

/*
  Dulu ini nyeruput HTML id.m.wikipedia.org dan ngambil #mf-section-0.
  Per 29 Agustus 2026 dua-duanya sudah nggak jalan: tanpa User-Agent Wikimedia
  balas 403, dan /wiki/<judul> versi mobile di-redirect ke desktop yang
  markup-nya Parsoid (paragraf dibungkus <section>), jadi selector lamanya
  selalu kosong -> semua query dibalas "artikel tidak ditemukan".

  Sekarang pakai MediaWiki API resmi: kontraknya stabil, redirect + normalisasi
  judul ditangani server (prabowo -> Prabowo Subianto), dan responsenya ~2 KB
  bukan 2 MB. Bentuk data yang dikembalikan tetap { wiki, thumb }.
*/
async function wikipediaScraper(query: string): Promise<any> {
  try {
    const response = await axios.get("https://id.wikipedia.org/w/api.php", {
      timeout: 30000,
      params: {
        action: "query",
        format: "json",
        prop: "extracts|pageimages",
        exintro: 1,
        explaintext: 1,
        redirects: 1,
        piprop: "original|thumbnail",
        pithumbsize: 600,
        titles: query,
      },
      // Wikimedia wajib minta User-Agent, kalau nggak dibalas 403.
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/139.0.0.0 Safari/537.36",
        "Accept-Language": "id-ID,id;q=0.9",
      },
    })

    const pages = response.data?.query?.pages || {}
    // Key-nya pageid, dan halaman yang nggak ada dapat key negatif + flag "missing".
    const page: any = Object.values(pages).find((p: any) => p && !p.missing)
    const wiki = String(page?.extract || "").trim()
    const thumb = page?.original?.source || page?.thumbnail?.source

    if (!wiki) {
      throw new Error("Artikel tidak ditemukan atau tidak memiliki deskripsi.")
    }

    return {
      wiki,
      thumb: thumb || "Gambar tidak tersedia",
    }
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error(`Error fetching Wikipedia data: ${error.message}`)
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/s/wikipedia",
    name: "wikipedia",
    category: "Search",
    description:
      "This API endpoint allows you to search for articles on Wikipedia (Indonesian version) by providing a search query. It returns the main descriptive paragraph of the article and an associated thumbnail image if available. This is useful for quickly retrieving summaries of topics from Wikipedia.",
    tags: ["Search", "Wikipedia", "Information", "Knowledge"],
    example: "?query=prabowo",
    parameters: [
      {
        name: "query",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 200,
        },
        description: "The search query for Wikipedia (e.g., 'prabowo', 'jakarta').",
        example: "prabowo",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { query } = req.query || {}

      if (!query) {
        return {
          status: false,
          error: "Parameter 'query' diperlukan.",
          code: 400,
        }
      }

      if (typeof query !== "string" || query.trim().length === 0) {
        return {
          status: false,
          error: "Query must be a non-empty string.",
          code: 400,
        }
      }

      if (query.length > 200) {
        return {
          status: false,
          error: "Query must be less than 200 characters.",
          code: 400,
        }
      }

      try {
        const result = await wikipediaScraper(query.trim())
        return {
          status: true,
          data: result,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Terjadi kesalahan pada server.",
          code: 404,
        }
      }
    },
  },
  {
    metode: "POST",
    endpoint: "/api/s/wikipedia",
    name: "wikipedia",
    category: "Search",
    description:
      "This API endpoint allows you to search for articles on Wikipedia (Indonesian version) by providing a search query in the JSON request body. It returns the main descriptive paragraph of the article and an associated thumbnail image if available. This is useful for quickly retrieving summaries of topics from Wikipedia using POST requests.",
    tags: ["Search", "Wikipedia", "Information", "Knowledge"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["query"],
            properties: {
              query: {
                type: "string",
                description: "The search query for Wikipedia (e.g., 'prabowo', 'jakarta').",
                example: "prabowo",
                minLength: 1,
                maxLength: 200,
              },
            },
            additionalProperties: false,
          },
        },
      },
    },
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { query } = req.body || {}

      if (!query) {
        return {
          status: false,
          error: "Parameter 'query' diperlukan.",
          code: 400,
        }
      }

      if (typeof query !== "string" || query.trim().length === 0) {
        return {
          status: false,
          error: "Query must be a non-empty string.",
          code: 400,
        }
      }

      if (query.length > 200) {
        return {
          status: false,
          error: "Query must be less than 200 characters.",
          code: 400,
        }
      }

      try {
        const result = await wikipediaScraper(query.trim())
        return {
          status: true,
          data: result,
          timestamp: new Date().toISOString(),
        }
      } catch (error: any) {
        return {
          status: false,
          error: error.message || "Terjadi kesalahan pada server.",
          code: 404,
        }
      }
    },
  },
]