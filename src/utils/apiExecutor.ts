import { LiveExecutionResult } from '../types/api';

/**
 * LIRENXIN Live API Executor
 * Tidak ada lagi mock — setiap panggilan dari Interactive API Tester
 * benar-benar mengirim request ke server nyata (api/app.ts) yang
 * di-serve pada origin yang sama dengan web ini.
 */

export const DEFAULT_EXEC_TIMEOUT_MS = 120_000;

/**
 * Bangun query string dari state playground (aman-encode).
 */
export function buildQueryUrl(path: string, queryParams: Record<string, string>): string {
  const result = new URLSearchParams();
  Object.entries(queryParams).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== '') {
      result.append(key, String(value));
    }
  });
  const qs = result.toString();
  return qs ? `${path}?${qs}` : path;
}

/**
 * Streaming proxy & unduh wrapper (dengan Referer & Range otomatis dari server).
 */
export function wrapStreamPath(mediaUrl: string): string {
  return `/api/stream-proxy?url=${encodeURIComponent(mediaUrl)}`;
}

export function wrapDownloadPath(mediaUrl: string, filename?: string): string {
  const base = `/api/download-file?url=${encodeURIComponent(mediaUrl)}`;
  return filename ? `${base}&filename=${encodeURIComponent(filename)}` : base;
}

/**
 * Ekstrak info media dari respons proxy (Cuki AIO / YTUltra / fallback scraper).
 */
export function extractMedia(data: any) {
  if (!data || typeof data !== 'object') return null;
  const video = data.video || null;
  const audio = data.audio || data.music || data.mp3 || null;
  const thumbnail = data.thumbnail || null;
  const images: string[] = Array.isArray(data.images)
    ? data.images.filter((x: any) => typeof x === 'string')
    : [];
  const downloads: { url: string; quality?: string; ext?: string }[] = Array.isArray(data.downloads)
    ? data.downloads
    : [];
  const title = typeof data.title === 'string' ? data.title : '';
  const author = typeof data.author === 'string' ? data.author : '';
  const source = typeof data.source === 'string' ? data.source : '';

  const hasAnything = Boolean(video || audio || images.length || downloads.length || thumbnail);
  if (!hasAnything) return null;
  return { video, audio, thumbnail, images, downloads, title, author, source };
}

/**
 * Jalankan request HTTP NYATA ke REST API.
 */
export async function executeLiveApiCall(
  method: string,
  path: string,
  queryParams: Record<string, string>,
  body: Record<string, any> = {}
): Promise<LiveExecutionResult> {
  const startTime = performance.now();
  const targetPath = buildQueryUrl(path, queryParams);

  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), DEFAULT_EXEC_TIMEOUT_MS);

    const response = await fetch(targetPath, {
      method,
      headers: {
        Accept: 'application/json, */*',
        ...(method !== 'GET' ? { 'Content-Type': 'application/json' } : {}),
      },
      ...(method !== 'GET' ? { body: JSON.stringify(body) } : {}),
      signal: controller.signal,
    });

    clearTimeout(timer);

    // Kumpulkan header respons
    const headers: Record<string, string> = {};
    response.headers.forEach((value, key) => {
      headers[key] = value;
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (isJson) {
      let data: any;
      const text = await response.text();
      try {
        data = JSON.parse(text);
      } catch {
        data = text;
      }

      const sizeBytes = Number(response.headers.get('content-length')) || new Blob([text]).size;
      const timeMs = Math.round(performance.now() - startTime);

      return {
        statusCode: response.status,
        statusText: response.statusText || (response.ok ? 'OK' : 'Error'),
        timeMs,
        sizeBytes: sizeBytes || text.length,
        headers,
        data,
      };
    }

    // Respons berbiner (video / audio / attachment)
    const blob = await response.blob();
    const timeMs = Math.round(performance.now() - startTime);
    const sizeBytes =
      Number(response.headers.get('content-length')) || blob.size;

    const disposition = response.headers.get('content-disposition') || '';
    const binaryDesc = contentType.startsWith('video')
      ? 'MEDIA VIDEO (binary stream)'
      : contentType.startsWith('audio')
        ? 'MEDIA AUDIO (binary stream)'
        : disposition.includes('attachment')
          ? 'FILE ATTACHMENT (siap disimpan ke perangkat)'
          : 'BINARY STREAM';

    return {
      statusCode: response.status,
      statusText: response.statusText || 'OK',
      timeMs,
      sizeBytes,
      headers,
      data: {
        _note: `Respons ${binaryDesc} — berhasil diterima.`,
        _contentType: contentType,
        _size: `${(sizeBytes / 1024).toFixed(1)} KB`,
        _disposition: disposition || '(none)',
      },
    };
  } catch (err: any) {
    const timeMs = Math.round(performance.now() - startTime);
    const aborted = err?.name === 'AbortError';

    return {
      statusCode: 0,
      statusText: aborted ? 'Gateway Timeout (Abort)' : 'Network Error',
      timeMs,
      sizeBytes: 0,
      headers: {},
      error: aborted ? 'Request timeout: ekstraksi media memakan waktu terlalu lama.' : undefined,
      data: {
        status: 'error',
        code: 0,
        message: aborted
          ? 'Request timeout setelah 120 detik. Server masih mengunduh/ekstrak media — silakan coba lagi.'
          : `Gagal terhubung ke server API: ${err?.message || 'unknown error'}. Pastikan server berjalan (npm run dev / npm start).`,
        target: targetPath,
      },
    };
  }
}
