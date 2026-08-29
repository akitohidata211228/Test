/*
  Diadaptasi dari koleksi endpoint siputzx/apisku (github.com/siputzx/apisku).
  Kredit scraper: siputzx. Dipasang di sini lewat adapter descriptor src/autoload.ts.
*/
import axios from "axios"

/*
  Upstream lama (POST https://www.nslookup.io/api/v1/records) sudah nggak
  nerima request dari luar situsnya -> semua lookup dibalas "Failed to get
  response from API". Sekarang query langsung ke DNS-over-HTTPS resmi
  (Cloudflare / Google), jadi nggak nebeng API internal orang lagi.

  Bentuk hasil dijaga: { domain, dnsServer, records: { A: [], MX: [], ... } }.
*/
const DOH: Record<string, string> = {
  cloudflare: "https://cloudflare-dns.com/dns-query",
  google: "https://dns.google/resolve",
}

const TYPES = ["A", "AAAA", "CNAME", "MX", "NS", "TXT", "SOA", "CAA", "SRV"]

async function scrape(domain: string, dnsServer: string) {
  const resolver = DOH[String(dnsServer || "cloudflare").toLowerCase()] || DOH.cloudflare
  try {
    const answers = await Promise.all(
      TYPES.map(async (type) => {
        try {
          const { data } = await axios.get(resolver, {
            params: { name: domain, type },
            headers: { accept: "application/dns-json" },
            timeout: 20000,
          })
          // Status 0 = NOERROR; tipe yang nggak ada record-nya balas tanpa Answer.
          const list = (data?.Answer || [])
            .filter((a: any) => a?.data)
            .map((a: any) => ({ name: a.name, ttl: a.TTL, value: String(a.data) }))
          return [type, list] as const
        } catch {
          return [type, []] as const
        }
      }),
    )

    const records: Record<string, any[]> = {}
    let found = 0
    for (const [type, list] of answers) {
      if (!list.length) continue
      records[type] = list
      found += list.length
    }

    if (!found) {
      throw new Error(`Tidak ada record DNS untuk ${domain}`)
    }

    return { domain, dnsServer: dnsServer || "cloudflare", records }
  } catch (error: any) {
    console.error("API Error:", error.message)
    throw new Error(error.message || "Failed to get response from API")
  }
}

export default [
  {
    metode: "GET",
    endpoint: "/api/tools/dns",
    name: "dns",
    category: "Tools",
    description: "This API endpoint allows you to retrieve DNS records for a specified domain. You can optionally choose a specific DNS server to perform the lookup. This is useful for debugging DNS issues, verifying domain ownership, or simply gathering information about a domain's DNS configuration. The API provides a structured response containing various types of DNS records such as A, AAAA, MX, NS, CNAME, TXT, and more, depending on what is configured for the domain. If no DNS server is specified, it defaults to Cloudflare's DNS.",
    tags: ["Tools", "Network", "DNS"],
    example: "?domain=google.com&dnsServer=cloudflare",
    parameters: [
      {
        name: "domain",
        in: "query",
        required: true,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 255,
        },
        description: "Domain name",
        example: "google.com",
      },
      {
        name: "dnsServer",
        in: "query",
        required: false,
        schema: {
          type: "string",
          minLength: 1,
          maxLength: 100,
          default: "cloudflare",
        },
        description: "DNS server",
        example: "cloudflare",
      },
    ],
    isPremium: false,
    isMaintenance: false,
    isPublic: true,
    async run({ req }) {
      const { domain, dnsServer } = req.query || {}

      if (!domain) {
        return {
          status: false,
          error: "Parameter 'domain' is required",
          code: 400,
        }
      }

      if (typeof domain !== "string" || domain.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'domain' must be a non-empty string",
          code: 400,
        }
      }

      if (dnsServer && typeof dnsServer !== "string") {
        return {
          status: false,
          error: "Parameter 'dnsServer' must be a string",
          code: 400,
        }
      }

      try {
        const result = await scrape(domain.trim(), (dnsServer as string || "cloudflare").trim())

        if (!result) {
          return {
            status: false,
            error: "No DNS records found for the specified domain",
            code: 404,
          }
        }

        return {
          status: true,
          data: result,
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
    endpoint: "/api/tools/dns",
    name: "dns",
    category: "Tools",
    description: "This API endpoint allows you to retrieve DNS records for a specified domain using a JSON request body. You can optionally choose a specific DNS server to perform the lookup. This is useful for debugging DNS issues, verifying domain ownership, or simply gathering information about a domain's DNS configuration. The API provides a structured response containing various types of DNS records such as A, AAAA, MX, NS, CNAME, TXT, and more, depending on what is configured for the domain. If no DNS server is specified, it defaults to Cloudflare's DNS.",
    tags: ["Tools", "Network", "DNS"],
    example: "",
    requestBody: {
      required: true,
      content: {
        "application/json": {
          schema: {
            type: "object",
            required: ["domain"],
            properties: {
              domain: {
                type: "string",
                description: "The domain to lookup DNS records for",
                example: "google.com",
                minLength: 1,
                maxLength: 255,
              },
              dnsServer: {
                type: "string",
                description: "The DNS server to use for the lookup (e.g., cloudflare, google)",
                example: "cloudflare",
                default: "cloudflare",
                minLength: 1,
                maxLength: 100,
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
      const { domain, dnsServer } = req.body || {}

      if (!domain) {
        return {
          status: false,
          error: "Parameter 'domain' is required",
          code: 400,
        }
      }

      if (typeof domain !== "string" || domain.trim().length === 0) {
        return {
          status: false,
          error: "Parameter 'domain' must be a non-empty string",
          code: 400,
        }
      }

      if (dnsServer && typeof dnsServer !== "string") {
        return {
          status: false,
          error: "Parameter 'dnsServer' must be a string",
          code: 400,
        }
      }

      try {
        const result = await scrape(domain.trim(), (dnsServer as string || "cloudflare").trim())

        if (!result) {
          return {
            status: false,
            error: "No DNS records found for the specified domain",
            code: 404,
          }
        }

        return {
          status: true,
          data: result,
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