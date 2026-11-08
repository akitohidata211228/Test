/*
  Watermark Remover (watermarkremover.io) - diadaptasi jadi endpoint.
  Butuh apikey captcha-solver (fgsi.dpdns.org), fallback ke env FGSI_APIKEY.
*/
import crypto from 'crypto';

const HOST = 'https://www.watermarkremover.io';
const API_URL = 'https://api.watermarkremover.io/service/public/transformation/v1.0/predictions/wm/remove';
const CAPTCHA_SOLVER_URL = 'https://fgsi.dpdns.org/api/tools/cfclearance/recaptcha-v2';
const RECAPTCHA_SITE_KEY = '6LcgwSsdAAAAAJO_QsCkkQuSlkOal2jqXic2Zuvj';
const ANON_SIGN_KEY = 'A4nzUYcDOZ';

const DEFAULT_HEADERS: Record<string, string> = {
  Origin: HOST,
  Referer: `${HOST}/`,
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
};

async function toBlob(input: string) {
  if (input.startsWith('http://') || input.startsWith('https://')) {
    const res = await fetch(input);
    if (!res.ok) throw new Error(`Gagal ambil gambar: HTTP ${res.status}`);
    return await res.blob();
  }
  throw new TypeError('url gambar tidak valid');
}

async function solveCaptcha(apiKey: string, retries = 3) {
  const solverUrl = `${CAPTCHA_SOLVER_URL}?apikey=${encodeURIComponent(apiKey)}&url=${encodeURIComponent(`${HOST}/`)}&sitekey=${RECAPTCHA_SITE_KEY}&invisible=true`;
  let lastErr: any = null;
  for (let i = 0; i < retries; i++) {
    try {
      const res = await fetch(solverUrl);
      if (!res.ok) {
        lastErr = new Error(`Captcha solver HTTP ${res.status}`);
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      const data: any = await res.json();
      if (!data.status || !data.data?.token) {
        lastErr = new Error(data.message || 'Gagal solve captcha');
        await new Promise((r) => setTimeout(r, 1000));
        continue;
      }
      return data.data.token;
    } catch (e) {
      lastErr = e;
      await new Promise((r) => setTimeout(r, 1000));
    }
  }
  throw lastErr;
}

function generateSignature(urlStr: string, visitorId: string) {
  const url = new URL(urlStr);
  const isoDate = new Date().toISOString();
  const stringToSign = `POST${encodeURI(url.pathname + url.search)}${isoDate}${visitorId}`;
  const signature = crypto.createHmac('sha256', ANON_SIGN_KEY).update(stringToSign).digest('hex');
  const param = Buffer.from(isoDate).toString('base64');
  return { signature, param };
}

async function removeWatermark(url: string, apiKey: string, removeText = true, removeLogo = true) {
  const [captchaToken, blob] = await Promise.all([solveCaptcha(apiKey), toBlob(url)]);
  const visitorId = crypto.randomBytes(16).toString('hex');
  const { signature, param } = generateSignature(API_URL, visitorId);

  const fd = new FormData();
  fd.append('retention', '1d');
  fd.append('captchaToken', captchaToken);
  fd.append('input.rem_text', String(removeText));
  fd.append('input.rem_logo', String(removeLogo));
  fd.append('input.fileType', 'image');
  fd.append('input.image', blob, 'image.png');

  const submitRes = await fetch(API_URL, {
    method: 'POST',
    headers: {
      ...DEFAULT_HEADERS,
      'pixb-cl-id': visitorId,
      'x-ebg-signature': signature,
      'x-ebg-param': param,
    } as any,
    body: fd,
  });

  if (!submitRes.ok) {
    const errText = await submitRes.text();
    throw new Error(`Submit HTTP ${submitRes.status}: ${errText.slice(0, 200)}`);
  }

  const submitData: any = await submitRes.json();
  const pollUrl = submitData.urls?.get;
  if (!pollUrl) throw new Error('Polling URL tidak dikembalikan server');

  const startTime = Date.now();
  while (Date.now() - startTime < 60_000) {
    await new Promise((r) => setTimeout(r, 2000));
    const pollRes = await fetch(pollUrl, { headers: DEFAULT_HEADERS });
    if (!pollRes.ok) continue;
    const pollData: any = await pollRes.json();
    if (pollData.status === 'SUCCESS') {
      return {
        id: pollData._id || submitData._id,
        status: 'SUCCESS',
        originalUrl: pollData.input?.image || null,
        resultUrl: pollData.output?.[0] || pollData.output?.image || pollData.output?.url || null,
      };
    }
    if (pollData.status === 'FAILURE') throw new Error(pollData.error || 'Proses transformasi gagal');
  }
  throw new Error('Proses loading timeout (60s)');
}

const DESC = {
  name: 'Watermark Remover',
  category: 'tools',
  description:
    'Hapus watermark (teks/logo) dari gambar memakai engine watermarkremover.io (submit + polling 60s). Terima link gambar langsung, hasil berupa link gambar bersih.',
  tags: ['Tools', 'Watermark', 'Image'],
  example: '?url=https://example.com/gambar.png&apikey=FGSI_KEY',
  params: [
    { name: 'url', required: true, description: 'Link gambar (png/jpg)' },
    { name: 'apikey', required: true, description: 'API key captcha solver (fgsi.dpdns.org)' },
    { name: 'remText', required: false, description: 'Hapus teks watermark (default true)' },
    { name: 'remLogo', required: false, description: 'Hapus logo watermark (default true)' },
  ],
  run: async ({ req }: any) => {
    const url = String(req.query.url ?? req.body?.url ?? '').trim();
    const apikey = String(req.query.apikey ?? req.body?.apikey ?? process.env.FGSI_APIKEY ?? '').trim();
    const remText = String(req.query.remText ?? req.body?.remText ?? 'true') !== 'false';
    const remLogo = String(req.query.remLogo ?? req.body?.remLogo ?? 'true') !== 'false';

    if (!url) return { status: false, error: 'Parameter wajib: url', code: 400 };
    if (!apikey) return { status: false, error: 'apikey wajib (atau set env FGSI_APIKEY di server)', code: 400 };

    try {
      const result = await removeWatermark(url, apikey, remText, remLogo);
      return { status: true, data: result, timestamp: new Date().toISOString() };
    } catch (error: any) {
      return { status: false, error: error.message || 'Internal Server Error', code: 500 };
    }
  },
};

export default [
  { ...DESC, metode: 'GET', endpoint: '/api/tools/wmremove' },
  { ...DESC, metode: 'POST', endpoint: '/api/tools/wmremove' },
];
