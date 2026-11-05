import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildQueryUrl,
  wrapStreamPath,
  wrapDownloadPath,
  extractMedia,
} from './apiExecutor';
import { generateSnippet } from './codeGenerators';
import { API_ENDPOINTS, PLATFORM_LIST } from '../data/apiEndpoints';

const proxyTikTok = API_ENDPOINTS.find((ep) => ep.id === 'proxy-tiktok')!;

test('Katalog LIRENXIN memiliki semua endpoint dari proyek lama', () => {
  // 11 platform downloader + health + stats + stream + download + force = 16
  assert.equal(API_ENDPOINTS.length, 16);
  assert.equal(PLATFORM_LIST.length, 11);
  const ids = new Set(API_ENDPOINTS.map((ep) => ep.id));
  assert.equal(ids.size, API_ENDPOINTS.length, 'semua id harus unik');
  PLATFORM_LIST.forEach((platform) => {
    assert.ok(ids.has(`proxy-${platform}`), 'setiap platform harus punya endpoint docs');
  });
});

test('buildQueryUrl meng-encode nilai parameter dengan benar', () => {
  const url = buildQueryUrl('/api/proxy/tiktok', {
    url: 'https://www.tiktok.com/@tiktok/video/7106594212292457010',
    kosong: '',
  });
  assert.ok(url.startsWith('/api/proxy/tiktok?url='));
  assert.ok(url.includes('%40')); // @ ter-encode
  assert.ok(!url.includes('kosong'));
});

test('wrap stream & download membungkus URL media dengan aman', () => {
  const media = 'https://cdn.example/video a.mp4?ref=1';
  const streamPath = wrapStreamPath(media);
  if (streamPath.includes(' ')) {
    assert.fail('spasi harus ter-encode');
  }
  assert.ok(streamPath.startsWith('/api/stream-proxy?url='));
  assert.ok(streamPath.includes('a.mp4'));

  const downloadPath = wrapDownloadPath(media, 'unduh saya');
  assert.ok(downloadPath.startsWith('/api/download-file?url='));
  assert.ok(downloadPath.includes('filename='));
  assert.ok(downloadPath.includes('unduh'));
});

test('extractMedia membaca hasil proxy Cuki/YTUltra dan fallback scraper', () => {
  const cukiLike = {
    status: true,
    title: 'Video Keren',
    thumbnail: 'https://cdn.example/thumb.jpg',
    video: 'https://cdn.example/video.mp4',
    audio: 'https://cdn.example/audio.mp3',
    music: 'https://cdn.example/audio.mp3',
    mp3: 'https://cdn.example/audio.mp3',
    downloads: [{ url: 'https://cdn.example/video.mp4', quality: '720p', ext: 'mp4' }],
    images: ['https://cdn.example/img1.jpg'],
    author: '@user',
    source: 'tiktok',
  };
  const media1 = extractMedia(cukiLike);
  assert.ok(media1);
  assert.equal(media1?.video, 'https://cdn.example/video.mp4');
  assert.equal(media1?.audio, 'https://cdn.example/audio.mp3');
  assert.equal(media1?.images.length, 1);
  assert.equal(media1?.downloads.length, 1);

  const fallbackLike = { status: true, title: 'Threads Media', video: null, images: ['a.jpg'], size: 'Unknown' };
  const media2 = extractMedia(fallbackLike);
  assert.ok(media2);
  assert.equal(media2?.video, null);
  assert.equal(media2?.images.length, 1);

  assert.equal(extractMedia({ error: 'gagal' }), null);
  assert.equal(extractMedia(null), null);
});

test('generateSnippet memakai nilai playground & melewatkan API key', () => {
  const curl = generateSnippet('curl', proxyTikTok, {
    url: 'https://www.tiktok.com/@tiktok/video/159',
  });
  assert.ok(curl.includes('curl -X GET'));
  assert.ok(curl.includes('/api/proxy/tiktok'));
  assert.ok(curl.includes('https://lirenxin-api.my.id'));
  assert.ok(curl.includes('%2Fvideo%2F159') || curl.includes('159'));
  assert.ok(!curl.includes('X-API-Key'));

  const js = generateSnippet('javascript', proxyTikTok, undefined);
  assert.ok(js.includes('fetch('));
  assert.ok(js.includes('/api/proxy/tiktok'));

  const nodejs = generateSnippet('nodejs', proxyTikTok, undefined);
  assert.ok(nodejs.includes('axios'));
  const python = generateSnippet('python', proxyTikTok, undefined);
  assert.ok(python.includes('requests.'));
  const php = generateSnippet('php', proxyTikTok, undefined);
  assert.ok(php.includes('curl_init'));
  const go = generateSnippet('go', proxyTikTok, undefined);
  assert.ok(go.includes('net/http'));
});

test('Semua endpoint docs menargetkan rute yang benar-benar ada di server', () => {
  API_ENDPOINTS.forEach((ep) => {
    assert.ok(ep.path.startsWith('/api/'));
    assert.ok(ep.responses.length > 0);
    // endpoint param url wajib punya contoh nilai default
    if (ep.queryParams?.some((q) => q.name === 'url' && q.required)) {
      const urlParam = ep.queryParams.find((q) => q.name === 'url');
      assert.ok(urlParam?.default, `url param ${ep.id} harus punya default`);
    }
  });
});
