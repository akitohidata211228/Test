/*
  VidDrop All-In-One Downloader (Instagram, TikTok, Twitter/X, Facebook, YouTube, Threads).
  Skrep asli: JH a.k.a Dhika - Fiony Bot. Diadaptasi jadi endpoint API.
*/
import axios from 'axios';
import crypto from 'crypto';

const pick = (...vals: any[]) => {
  for (const v of vals) {
    if (v !== undefined && v !== null && v !== '') return v;
    if (v === 0 || v === false) return v;
  }
  return '';
};

const jantung: Record<string, string> = {
  Connection: 'keep-alive',
  'sec-ch-ua': '"Chromium";v="147", "Not.A/Brand";v="8"',
  'sec-ch-ua-mobile': '?1',
  'sec-ch-ua-platform': '"Android"',
  'User-Agent': 'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/147.0.0.0 Mobile Safari/537.36',
  Accept: '*/*',
  'Sec-Fetch-Site': 'cross-site',
  'Sec-Fetch-Mode': 'cors',
  'Sec-Fetch-Dest': 'empty',
  'Accept-Language': 'id-ID,id;q=0.9',
  Priority: 'u=1, i',
};

function encryptUrl(uStr: string) {
  const key = Buffer.from('qwertyuioplkjhgf', 'utf8');
  const data = Buffer.from(uStr, 'utf8');
  const padLen = 16 - (data.length % 16);
  const padded = Buffer.alloc(data.length + padLen, padLen);
  data.copy(padded);
  const cipher = crypto.createCipheriv('aes-128-ecb', key, null);
  cipher.setAutoPadding(false);
  return Buffer.concat([cipher.update(padded), cipher.final()]).toString('hex');
}

function detectPlatform(uStr: string) {
  try {
    const host = new URL(uStr).hostname.replace('www.', '').replace('m.', '');
    if (host.includes('instagram.com')) return 'Instagram';
    if (host.includes('tiktok.com')) return 'TikTok';
    if (host.includes('twitter.com') || host.includes('x.com')) return 'Twitter/X';
    if (host.includes('facebook.com') || host.includes('fb.watch')) return 'Facebook';
    if (host.includes('youtube.com') || host.includes('youtu.be')) return 'YouTube';
    if (host.includes('threads.net')) return 'Threads';
    return host;
  } catch {
    return 'Unknown';
  }
}

const normImg = (arr: any) => {
  if (!Array.isArray(arr)) return [];
  const res: any[] = [];
  for (const ix of arr) {
    if (typeof ix === 'string') res.push({ url: ix, thumbnail: null });
    else if (ix && typeof ix === 'object') {
      const u = pick(ix.image, ix.url, '');
      if (u !== '') res.push({ url: u, thumbnail: pick(ix.thumbnail, null) });
    }
  }
  return res;
};

const normVid = (arr: any) => {
  if (!Array.isArray(arr)) return [];
  const res: any[] = [];
  for (const vx of arr) {
    if (typeof vx === 'string') res.push({ url: vx, thumbnail: null });
    else if (vx && typeof vx === 'object') {
      const u = pick(vx.video, vx.url, '');
      if (u !== '') res.push({ url: u, thumbnail: pick(vx.thumbnail, null) });
    }
  }
  return res;
};

const normMed = (arr: any) => {
  if (!Array.isArray(arr)) return [];
  const res: any[] = [];
  for (const mx of arr) {
    if (typeof mx === 'string') res.push({ url: mx, thumbnail: null, type: null });
    else if (mx && typeof mx === 'object') {
      const u = pick(mx.url, mx.video, mx.image, '');
      if (u !== '') res.push({ url: u, thumbnail: pick(mx.thumbnail, null), type: pick(mx.type, null) });
    }
  }
  return res;
};

async function viddrop(targetUrl: string) {
  const platform = detectPlatform(targetUrl);
  const isX = platform === 'Twitter/X';

  if (isX) {
    const headX: Record<string, string> = { ...jantung };
    headX['Host'] = 'x.getrequest.dev';
    headX['Origin'] = 'https://x.getrequest.dev';
    headX['Referer'] = 'https://x.getrequest.dev/';
    headX['Accept'] = 'application/json, text/plain, */*';

    const xUrl = `https://x.getrequest.dev/api/tweet/info?url=${encodeURIComponent(targetUrl)}`;
    let resX: any = null;
    let statX = 0;
    for (let at = 0; at < 3; at++) {
      const fetchX = await axios.get(xUrl, { headers: headX, validateStatus: () => true });
      statX = fetchX.status;
      resX = fetchX.data;
      if (statX === 200) break;
      if (at < 2) await new Promise((r) => setTimeout(r, 2000));
    }

    if (statX >= 400 || !resX) throw new Error(`HTTP Error ${statX} di X-API`);
    if (resX.success !== true) throw new Error(`API Error: ${pick(resX.message, 'Unknown Error di API X')}`);

    const tweet = Array.isArray(resX.data) && resX.data.length > 0 ? resX.data[0] : null;
    if (!tweet) throw new Error('Data tweet kosong');

    const author = tweet.author ? tweet.author : {};
    const stats = tweet.stats ? tweet.stats : {};
    const vids: any[] = [];
    const imgs: any[] = [];

    for (const m of tweet.media || []) {
      const mType = pick(m.type, '');
      if (mType === 'video' || mType === 'animated_gif') {
        const mp4Var = (m.variants || []).filter((v: any) => v.content_type === 'video/mp4');
        mp4Var.sort((a: any, b: any) => pick(b.bitrate, 0) - pick(a.bitrate, 0));
        vids.push({
          url: mp4Var.length > 0 ? pick(mp4Var[0].url, null) : null,
          thumbnail: pick(m.thumbnail, null),
          duration: pick(m.duration_formatted, null),
          dimensions: pick(m.dimensions, null),
          qualities: mp4Var.map((v: any) => ({ quality: pick(v.quality, ''), bitrate: pick(v.bitrate, 0), url: pick(v.url, '') })),
        });
      } else if (mType === 'photo') {
        imgs.push({ url: pick(m.thumbnail, null), thumbnail: pick(m.thumbnail, null), dimensions: pick(m.dimensions, null) });
      }
    }

    return {
      platform,
      url: targetUrl,
      tweet_id: pick(tweet.id, ''),
      text: pick(tweet.text, pick(tweet.display_text, '')),
      created_at: pick(tweet.created_at, ''),
      author: {
        name: pick(author.name, ''),
        username: pick(author.screen_name, ''),
        avatar: pick(author.avatar_url, ''),
        is_blue: author.is_blue_verified === true,
      },
      stats: {
        replies: pick(stats.replies, 0),
        retweets: pick(stats.retweets, 0),
        likes: pick(stats.likes, 0),
        bookmarks: pick(stats.bookmarks, 0),
        views: pick(stats.views, 0),
      },
      total_videos: vids.length,
      total_images: imgs.length,
      videos: vids,
      images: imgs,
    };
  }

  const encrypted = encryptUrl(targetUrl);
  const headVD: Record<string, string> = { ...jantung };
  headVD['Host'] = 'api.getrequest.dev';
  headVD['Origin'] = 'https://videodropper.app';
  headVD['Referer'] = 'https://videodropper.app/';
  headVD['url'] = encrypted;

  let resVD: any = null;
  let statVD = 0;
  for (let at = 0; at < 3; at++) {
    const fetchVD = await axios.get('https://api.getrequest.dev/allinone', { headers: headVD, validateStatus: () => true });
    statVD = fetchVD.status;
    resVD = fetchVD.data;
    if (statVD === 200) break;
    if (at < 2) await new Promise((r) => setTimeout(r, 2000));
  }

  if (statVD >= 400 || !resVD) throw new Error(`HTTP Error ${statVD} di VD-API`);

  const vids = normVid(resVD.video ? resVD.video : []);
  const imgs = normImg(resVD.image ? resVD.image : []);
  const meds = normMed(resVD.media ? resVD.media : []);
  const totalM = vids.length + imgs.length + meds.length;

  return {
    platform,
    url: targetUrl,
    encrypted_url: encrypted,
    is_post: resVD.p === true || resVD.p === 1,
    is_carousel: totalM > 1,
    total_videos: vids.length,
    total_images: imgs.length,
    total_media: meds.length,
    total_items: totalM,
    videos: vids,
    images: imgs,
    media: meds,
    original: resVD.original !== undefined && resVD.original !== null ? resVD.original : null,
  };
}

const DESC = {
  name: 'VidDrop All-In-One',
  category: 'download',
  description:
    'Downloader multi-platform (Instagram, TikTok, Twitter/X, Facebook, YouTube, Threads) via engine VidDrop. Balikin link video/gambar + kualitas.',
  tags: ['Downloader', 'Instagram', 'TikTok', 'Twitter', 'Facebook', 'YouTube', 'Threads'],
  example: '?url=https://www.instagram.com/p/DeuG11SoB0e/',
  params: [{ name: 'url', required: true, description: 'Link post/reel/video dari platform didukung' }],
  run: async ({ req }: any) => {
    const url = String(req.query.url ?? req.body?.url ?? '').trim();
    if (!url) return { status: false, error: 'Parameter wajib: url', code: 400 };
    if (!/^https?:\/\//i.test(url)) return { status: false, error: 'URL tidak valid', code: 400 };

    try {
      const data = await viddrop(url);
      return { status: true, data, timestamp: new Date().toISOString() };
    } catch (error: any) {
      return { status: false, error: error.message || 'Unknown Error', code: 500 };
    }
  },
};

export default [
  { ...DESC, metode: 'GET', endpoint: '/api/download/viddrop' },
  { ...DESC, metode: 'POST', endpoint: '/api/download/viddrop' },
];
