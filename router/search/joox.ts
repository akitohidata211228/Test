/*
  Joox Music - scrapes web joox.com (Next.js __NEXT_DATA__).
  search / lyric. (Stream & download dimatikan: CDN/API Joox sudah tidak publik.)
*/
const BASE_URL = 'https://www.joox.com';

const DEFAULT_HEADERS: Record<string, string> = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

function extractNextData(html: string) {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/);
  if (!match) throw new Error('Gagal parse state Next.js dari respons');
  return JSON.parse(match[1]);
}

export async function searchJoox(keyword: string, region = 'id') {
  const url = `${BASE_URL}/${region}/search/${encodeURIComponent(keyword)}`;
  const res = await fetch(url, { headers: DEFAULT_HEADERS });
  if (!res.ok) throw new Error(`Search gagal, status: ${res.status}`);

  const html = await res.text();
  const nextData = extractNextData(html);
  const items = nextData.props?.pageProps?.searchSections?.songs?.item_list || [];

  return items.map((item: any) => {
    const song = item.song?.[0]?.song_info;
    if (!song) return null;
    return {
      id: song.id,
      name: song.name,
      duration: song.play_duration,
      album: { id: song.album_id, name: song.album_name },
      artists: (song.artist_list || []).map((a: any) => ({ id: a.id, name: a.name })),
      images: song.images || [],
      url: `${BASE_URL}/${region}/single/${encodeURIComponent(song.id)}`,
    };
  }).filter(Boolean);
}

async function resolveSongId(queryOrId: string, region = 'id') {
  const trimmed = queryOrId.trim();
  if (!trimmed) throw new Error('Query atau ID lagu tidak valid');
  if (/^[a-zA-Z0-9_\-+/]{22}==$/.test(trimmed)) return trimmed;

  const results = await searchJoox(trimmed, region);
  if (!results.length) throw new Error(`Tidak ada hasil untuk: "${trimmed}"`);
  const first: any = results[0];
  return first.id;
}

export async function getJooxMetadata(queryOrId: string, region = 'id') {
  const songId = await resolveSongId(queryOrId, region);
  const url = `${BASE_URL}/${region}/single/${encodeURIComponent(songId)}`;
  const res = await fetch(url, { headers: DEFAULT_HEADERS });
  if (!res.ok) throw new Error(`Metadata gagal, status: ${res.status}`);

  const html = await res.text();
  const nextData = extractNextData(html);
  const info = nextData.props?.pageProps?.singleInfo;
  if (!info) throw new Error(`Metadata tidak ditemukan untuk id: ${songId}`);

  return {
    id: info.id || songId,
    mid: info.songmid,
    title: info.title || info.msong,
    artist: info.msinger,
    artists: (info.artistList || []).map((a: any) => ({ id: a.id, name: a.name })),
    album: { id: info.malbumid, name: info.albumName || info.malbum },
    duration: info.minterval,
    publicTime: info.publicTime,
    cover: info.imgSrc,
    url: `${BASE_URL}/${region}/single/${encodeURIComponent(songId)}`,
  };
}

export async function getJooxLyrics(queryOrId: string, region = 'id') {
  const songId = await resolveSongId(queryOrId, region);
  const url = `${BASE_URL}/${region}/single/${encodeURIComponent(songId)}`;
  const res = await fetch(url, { headers: DEFAULT_HEADERS });
  if (!res.ok) throw new Error(`Lyrics gagal, status: ${res.status}`);

  const html = await res.text();
  const nextData = extractNextData(html);
  const rawBase64 = nextData.props?.pageProps?.singleLyric;
  if (!rawBase64) return null;

  const decoded = Buffer.from(rawBase64, 'base64').toString('utf-8');
  const parsed: { time: number; text: string }[] = [];
  for (const line of decoded.split(/\r?\n/)) {
    const match = line.match(/^\[(\d{2}):(\d{2}(?:\.\d+)?)\](.*)$/);
    if (match) {
      parsed.push({
        time: parseInt(match[1], 10) * 60 + parseFloat(match[2]),
        text: match[3].trim(),
      });
    }
  }
  return parsed;
}

const qOrBody = (req: any, key: string) => req.query[key] ?? req.body?.[key];

const mkRun = (fn: (q: string, region: string) => Promise<any>) => async ({ req }: any) => {
  const q = String(qOrBody(req, 'q') ?? req.query.query ?? req.body?.query ?? '').trim();
  const region = String(qOrBody(req, 'region') ?? 'id').trim() || 'id';
  if (!q) return { status: false, error: 'Parameter wajib: q (nama lagu / id joox)', code: 400 };
  try {
    const data = await fn(q, region);
    return { status: true, data, timestamp: new Date().toISOString() };
  } catch (error: any) {
    return { status: false, error: error.message || 'Internal Server Error', code: 500 };
  }
};

const desc = (endpoint: string, name: string, description: string, example: string, run: any) => ({
  metode: 'GET',
  endpoint,
  name,
  category: 'search',
  description,
  tags: ['Joox', 'Music'],
  example,
  params: [
    { name: 'q', required: true, description: 'Judul lagu / ID Joox' },
    { name: 'region', required: false, description: 'Kode negara (id / hk / my / th)' },
  ],
  run,
});

export default [
  desc('/api/s/joox', 'Joox Search', 'Cari lagu di Joox (id/hk/my/th).', '?q=laskar pelangi', mkRun(searchJoox)),
  desc('/api/s/joox-lyric', 'Joox Lyric', 'Lirik lagu Joox dengan timestamp per satuan baris.', '?q=laskar pelangi', mkRun(getJooxLyrics)),
];
