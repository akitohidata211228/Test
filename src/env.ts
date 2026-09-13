/*
  Pembaca file .env kecil, tanpa dependency.

  Env yang dipakai router (BILIBILI_COOKIE, PINTEREST_TOKEN, PROXY_URL, ...)
  di Vercel diisi dari dashboard, tapi waktu jalan lokal atau pm2 nggak ada yang
  memuatnya dari file — jadi cookie/token yang sudah ditulis di .env dulu diam
  saja dan endpoint-nya kelihatan seperti "butuh premium". Ini yang menambal itu.

  Aturannya: env asli dari shell / Vercel / pm2 selalu menang, file cuma mengisi
  yang belum ada. Baris `KEY=value`, `#` komentar, kutip di ujung dibuang, dan
  value boleh mengandung `=` (contohnya cookie: `SESSDATA=abc; bili_jct=def`).
*/
import fs from "fs"
import path from "path"

const CANDIDATES = [
    path.join(process.cwd(), ".env"),
    path.join(__dirname, "..", ".env"),
    path.join(__dirname, "..", "..", ".env")
]

const parse = (raw: string): Record<string, string> => {
    const out: Record<string, string> = {}

    for (const line of raw.split(/\r?\n/)) {
        const s = line.trim()
        if (!s || s.startsWith("#")) continue

        const eq = s.indexOf("=")
        if (eq < 1) continue

        const key = s.slice(0, eq).trim().replace(/^export\s+/, "")
        if (!/^[A-Za-z_][A-Za-z0-9_]*$/.test(key)) continue

        let value = s.slice(eq + 1).trim()
        const quoted = /^(['"])([\s\S]*)\1$/.exec(value)
        // Komentar di belakang value cuma dibuang kalau value-nya nggak dikutip.
        value = quoted ? quoted[2] : value.replace(/\s+#.*$/, "").trim()

        out[key] = value
    }

    return out
}

export function loadEnv(): string[] {
    const loaded: string[] = []

    for (const file of CANDIDATES) {
        if (!fs.existsSync(file)) continue

        try {
            for (const [k, v] of Object.entries(parse(fs.readFileSync(file, "utf8")))) {
                if (process.env[k] === undefined) {
                    process.env[k] = v
                    loaded.push(k)
                }
            }
        } catch {
            // .env rusak / nggak kebaca bukan alasan server gagal start.
        }

        break
    }

    return loaded
}

export default loadEnv
