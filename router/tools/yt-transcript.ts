/*
  YouTube Transcript - via spinnerportugues.com API.
  Terima video id atau full link, hasil teks transcript.
*/
const API_URL = 'https://spinnerportugues.com/apis/api_youtube_transcript.php';

async function transcript(url: string) {
  const targetUrl = url.includes('://') ? url.trim() : `https://www.youtube.com/watch?v=${url.trim()}`;
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'okhttp/4.12.0',
    },
    body: JSON.stringify({ url: targetUrl }),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data: any = await res.json();
  if (data.status !== 'success' || !data.transcription) {
    throw new Error(data.transcription || 'Transcript tidak tersedia');
  }
  return {
    videoId: data.video_id,
    transcript: String(data.transcription).trim(),
  };
}

const DESC = {
  name: 'YouTube Transcript',
  category: 'tools',
  description: 'Ambil transkrip (subtitle berbahasa yang disarankan) dari video YouTube.',
  tags: ['Tools', 'YouTube', 'Transcript'],
  example: '?url=dQw4w9WgXcQ',
  params: [{ name: 'url', required: true, description: 'Video ID atau link YouTube lengkap' }],
  run: async ({ req }: any) => {
    const url = String(req.query.url ?? req.body?.url ?? '').trim();
    if (!url) return { status: false, error: 'Parameter wajib: url', code: 400 };
    if (!/^[\w-]{6,}(\?|&|$)|youtu\.be|youtube\.com/.test(url)) {
      return { status: false, error: 'Format URL YouTube tidak valid', code: 400 };
    }

    try {
      const result = await transcript(url);
      return { status: true, data: result, timestamp: new Date().toISOString() };
    } catch (error: any) {
      return { status: false, error: error.message || 'Internal Server Error', code: 500 };
    }
  },
};

export default [
  { ...DESC, metode: 'GET', endpoint: '/api/tools/yt-transcript' },
  { ...DESC, metode: 'POST', endpoint: '/api/tools/yt-transcript' },
];
