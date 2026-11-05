import axios from "axios";
import * as cheerio from "cheerio";

/**
 * Fallback scraping logic — dipindahkan dari proyek "Akito Downloader" (api api).
 * Dipakai oleh api/app.ts sebagai scraper cadangan ketika API utama (YTUltra / Cuki AIO) gagal.
 */

export const scrapeWowdownloader = async (url: string, tool: string) => {
  try {
    console.log(`[WowDownloader] Attempting ${tool} for ${url}`);

    const { data: html, headers: getHeaders } = await axios.get(`https://wowdownloader.com/tool/${tool}`, {
      headers: {
        'user-agent': 'Neo/1.0'
      },
      timeout: 10000
    });

    const csrfTokenMatch = html.match(/<meta name="csrf-token" content="([^"]+)">/);
    if (csrfTokenMatch) {
      const csrfToken = csrfTokenMatch[1];
      const cookieHeader = (getHeaders as any)['set-cookie']?.map((c: string) => c.split(';')[0]).join('; ');

      const { data } = await axios.post('https://wowdownloader.com/api/download', {
        url: url,
        tool: tool
      }, {
        headers: {
          'origin': 'https://wowdownloader.com',
          'referer': `https://wowdownloader.com/tool/${tool}`,
          'x-csrf-token': csrfToken,
          'cookie': cookieHeader,
          'content-type': 'application/json',
          'user-agent': 'Neo/1.0'
        },
        timeout: 15000
      });

      if (data && !data.error) {
        let videoUrl = "";
        let audioUrl = "";
        const imageUrls: string[] = [];
        let thumbnail = "";

        if (data.html) {
           const $ = cheerio.load(data.html);
           $('a').each((_i, el) => {
             const href = $(el).attr('href');
             if (href) {
               if (href.includes('.mp4') || $(el).text().toLowerCase().includes('video')) {
                 if (!videoUrl) videoUrl = href;
               } else if (href.includes('.jpg') || href.includes('.jpeg') || href.includes('.png') || href.includes('.webp') || $(el).text().toLowerCase().includes('image') || $(el).text().toLowerCase().includes('photo')) {
                 imageUrls.push(href);
               } else if ($(el).text().toLowerCase().includes('download')) {
                 // generic download button, check extension
                 if (href.includes('.mp4')) {
                     if (!videoUrl) videoUrl = href;
                 } else if (href.includes('.jpg') || href.includes('.png')) {
                     imageUrls.push(href);
                 } else {
                     // assume video if no extension
                     if (!videoUrl) videoUrl = href;
                 }
               }
               if (href.includes('.mp3') || $(el).text().toLowerCase().includes('audio')) {
                 if (!audioUrl) audioUrl = href;
               }
             }
           });
           $('img').each((_i, el) => {
             const src = $(el).attr('src');
             if (src && !thumbnail) thumbnail = src;
           });
        } else if (Array.isArray(data.items) && data.items.length > 0) {
           // WowDownloader YouTube format: { items: [{ url, title, thumbnail, quality }] }
           console.log(`[WowDownloader] Found items[] format with ${data.items.length} items`);
           for (const item of data.items) {
             if (item.url && !videoUrl) {
               videoUrl = item.url;
             }
             if (item.thumbnail && !thumbnail) {
               thumbnail = item.thumbnail;
             }
             if (!audioUrl && item.url && (item.quality?.toLowerCase().includes('audio') || item.url.includes('.mp3'))) {
               audioUrl = item.url;
             }
           }
           // Use title from first item if available
           if (data.items[0]?.title) {
             data.title = data.items[0].title;
           }
        } else if (typeof data === 'object') {
           videoUrl = data.video || data.url || data.download_url || data?.data?.url || data?.result?.url || "";
           audioUrl = data.audio || data?.data?.audio || data?.result?.audio || "";
           thumbnail = data.thumbnail || data.image || data?.data?.thumbnail || data?.result?.thumbnail || "";

           if (data?.data?.video) videoUrl = data.data.video;
           if (data?.result?.video) videoUrl = data.result.video;

           // Extract arrays if any
           const maybeMedias = data.medias || data.data?.medias || data.result?.medias || [];
           if (Array.isArray(maybeMedias)) {
               maybeMedias.forEach((m: any) => {
                   if (m.type === 'video' || m.url?.includes('.mp4')) {
                       if (!videoUrl) videoUrl = m.url;
                   } else if (m.type === 'image' || m.url?.includes('.jpg') || m.url?.includes('.png')) {
                       imageUrls.push(m.url);
                   } else if (m.type === 'audio' || m.url?.includes('.mp3')) {
                       if (!audioUrl) audioUrl = m.url;
                   }
               });
           }
        }

        if (videoUrl || audioUrl || imageUrls.length > 0) {
          return {
            title: data.title || data?.data?.title || data?.result?.title || "Extracted Media",
            thumbnail: thumbnail,
            video: videoUrl,
            audio: audioUrl,
            images: imageUrls,
            size: "Unknown"
          };
        }
      }
    }
  } catch (err: any) {
    console.log(`wowdownloader (${tool}) scrape failed:`, err.message);
  }
  return null;
};

export const scrapeTikTok = async (url: string) => {
  return await scrapeWowdownloader(url, 'tiktok-video-downloader');
};

export const scrapeInstagram = async (url: string) => {
  // Percobaan pertama: wowdownloader.com
  try {
    console.log(`[Instagram Scraper] Attempting wowdownloader.com`);

    // Determine the tool based on URL
    let tool = 'instagram-video-downloader';
    if (url.includes('/reel/') || url.includes('/reels/')) {
      tool = 'instagram-reels-downloader';
    } else if (url.includes('/stories/')) {
      tool = 'instagram-story-downloader';
    }

    const { data: html, headers: getHeaders } = await axios.get(`https://wowdownloader.com/tool/${tool}`, {
      headers: {
        'user-agent': 'Neo/1.0'
      },
      timeout: 10000
    });

    const csrfTokenMatch = html.match(/<meta name="csrf-token" content="([^"]+)">/);
    if (csrfTokenMatch) {
      const csrfToken = csrfTokenMatch[1];
      const cookieHeader = (getHeaders as any)['set-cookie']?.map((c: string) => c.split(';')[0]).join('; ');

      const { data } = await axios.post('https://wowdownloader.com/api/download', {
        url: url,
        tool: tool
      }, {
        headers: {
          'origin': 'https://wowdownloader.com',
          'referer': `https://wowdownloader.com/tool/${tool}`,
          'x-csrf-token': csrfToken,
          'cookie': cookieHeader,
          'content-type': 'application/json',
          'user-agent': 'Neo/1.0'
        },
        timeout: 15000
      });

      if (data && !data.error) {
        let videoUrl = "";
        const imageUrls: string[] = [];
        let thumbnail = "";

        if (data.html) {
           const $ = cheerio.load(data.html);
           $('a').each((_i, el) => {
             const href = $(el).attr('href');
             if (href) {
               if (href.includes('.mp4') || $(el).text().toLowerCase().includes('video')) {
                 if (!videoUrl) videoUrl = href;
               } else if (href.includes('.jpg') || href.includes('.jpeg') || href.includes('.png') || href.includes('.webp') || $(el).text().toLowerCase().includes('image') || $(el).text().toLowerCase().includes('photo')) {
                 imageUrls.push(href);
               } else if ($(el).text().toLowerCase().includes('download')) {
                 if (href.includes('.mp4')) {
                     if (!videoUrl) videoUrl = href;
                 } else if (href.includes('.jpg') || href.includes('.png')) {
                     imageUrls.push(href);
                 } else {
                     if (!videoUrl) videoUrl = href;
                 }
               }
             }
           });
           $('img').each((_i, el) => {
             const src = $(el).attr('src');
             if (src && !thumbnail) thumbnail = src;
           });
        } else if (typeof data === 'object') {
           videoUrl = data.video || data.url || data.download_url || data?.data?.url || data?.result?.url || "";
           thumbnail = data.thumbnail || data.image || data?.data?.thumbnail || data?.result?.thumbnail || "";

           if (data?.data?.video) videoUrl = data.data.video;
           if (data?.result?.video) videoUrl = data.result.video;
        }

        if (videoUrl || imageUrls.length > 0) {
          return {
            title: data.title || "Instagram Media",
            thumbnail: thumbnail,
            video: videoUrl,
            images: imageUrls,
            size: "Unknown"
          };
        }
      }
    }
  } catch (err: any) {
  }

  // Percobaan kedua: save-free.app
  const apiUrl = "https://save-free.app/wp-json/visolix/api/download";

  const headers = {
    'Content-Type': 'application/json',
    'Accept': '*/*',
    'X-Visolix-Nonce': '56ffa63506',
    'Origin': 'https://save-free.app',
    'Referer': `https://save-free.app/instagram-video-download/?url=${url}`,
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36',
    'Cookie': 'pll_language=en; slimstat_tracking_code=72245.fdf62a2e83be05bace0c19ef7e5c801f'
  };

  const payload = {
    captcha_response: null,
    format: "",
    url: url
  };

  try {
    const response = await axios.post(apiUrl, payload, { headers, timeout: 10000 });

    if (response.data.status && response.data.data) {
      const $ = cheerio.load(response.data.data);

      const medias: { url: string, type: string }[] = [];
      $('a.visolix-download-media').each((i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().toLowerCase();
        if (href) {
          const type = href.includes('.mp4') || text.includes('video') ? 'video' : 'image';
          medias.push({ url: href, type });
        }
      });

      const previewImg = $('img[alt="Preview image"]').first().attr('src');

      if (medias.length > 0) {
        return {
          title: "Instagram Media",
          thumbnail: previewImg,
          video: medias.find(m => m.type === 'video')?.url || null,
          images: medias.filter(m => m.type === 'image').map(m => m.url),
          size: "Unknown"
        };
      }
    }
  } catch (err: any) {
    console.log("save-free.app scrape failed:", err.message);
  }

  // Fallback: snapdownloader.app
  try {
    console.log(`[Instagram Scraper] Attempting fallback to snapdownloader.app`);
    const payloadUrlEncoded = `q=${encodeURIComponent(url)}&t=media&lang=en`;
    const res = await axios.post("https://snapdownloader.app/api/ajaxSearch", payloadUrlEncoded, {
      headers: {
        "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/149.0.0.0 Safari/537.36",
        "Referer": "https://snapdownloader.app/",
        "Origin": "https://snapdownloader.app",
        "Accept": "*/*"
      },
      timeout: 10000
    });

    const data = res.data;
    if (data && data.status === 'ok' && data.data) {
      const $ = cheerio.load(data.data);
      const videoUrls: string[] = [];
      const imageUrls: string[] = [];

      $('a.download-items__btn').each((_i, el) => {
        const href = $(el).attr('href');
        const text = $(el).text().toLowerCase();
        if (href) {
          if (href.includes('.mp4') || text.includes('video')) {
            videoUrls.push(href);
          } else {
            imageUrls.push(href);
          }
        }
      });

      const thumbnail = $('.download-items__thumb img').attr('src');

      if (videoUrls.length > 0 || imageUrls.length > 0) {
        return {
          title: "Instagram Media (SnapDownloader)",
          thumbnail: thumbnail || (imageUrls.length > 0 ? imageUrls[0] : ""),
          video: videoUrls.length > 0 ? videoUrls[0] : "",
          images: imageUrls,
          size: "Unknown"
        };
      }
    }
  } catch (err: any) {
    console.log("snapdownloader.app scrape failed:", err.message);
  }

  return null;
};

export const scrapeThreadsmateNonce = async (): Promise<string | null> => {
  try {
    const { data } = await axios.get("https://threadsmate.com/", {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      timeout: 10000
    });

    const nonceMatch = data.match(/"nonce"\s*:\s*"([a-f0-9]{10})"/i) || data.match(/nonce\s*=\s*'([a-f0-9]{10})'/i) || data.match(/"X-Visolix-Nonce"\s*:\s*"([a-f0-9]{10})"/i);
    if (nonceMatch) return nonceMatch[1];

    const $ = cheerio.load(data);
    let foundNonce: string | null = null;
    $('script').each((_i, el) => {
      const content = $(el).html() || "";
      if (content.includes("nonce")) {
        const m = content.match(/"nonce"\s*:\s*"([a-f0-9]{10})"/i);
        if (m) foundNonce = m[1];
      }
    });
    return foundNonce;
  } catch (err: any) {
    return null;
  }
};

export const scrapeWowYouTube = async (url: string) => {
  return await scrapeWowdownloader(url, 'youtube-video-downloader');
};

export const scrapeThreads = async (url: string) => {
  let finalUrl = url.includes("threads.com") ? url.replace("threads.com", "threads.net") : url;

  // 1. Coba ThreadsDL.app API (primary - mengembalikan URL video CDN langsung)
  try {
    console.log(`[Threads Scraper] Attempting threadsdl.app for ${finalUrl}`);
    const { data } = await axios.post("https://www.threadsdl.app/api/threads",
      { url: finalUrl },
      {
        headers: {
          'Content-Type': 'application/json',
          'Accept': '*/*',
          'Origin': 'https://www.threadsdl.app',
          'Referer': 'https://www.threadsdl.app/id/',
          'User-Agent': 'Mozilla/5.0 (Linux; Android 15; Pixel 9) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/150.0.0.0 Mobile Safari/537.36'
        },
        timeout: 15000
      }
    );

    if (data && data.medias && Array.isArray(data.medias) && data.medias.length > 0) {
      let videoUrl = "";
      const imageUrls: string[] = [];
      let thumbnail = "";
      const title = data.username ? `@${data.username} - Threads` : "Threads Media";

      for (const media of data.medias) {
        // mediaType 2 = video, 1 = image
        if (media.cover && !thumbnail) {
          thumbnail = media.cover;
        }

        // Ekstrak video
        if (Array.isArray(media.videos) && media.videos.length > 0) {
          for (const v of media.videos) {
            if (v.url && !videoUrl) {
              videoUrl = v.url;
              break;
            }
          }
        }

        // Ekstrak gambar
        if (Array.isArray(media.images) && media.images.length > 0) {
          for (const img of media.images) {
            const imgUrl = typeof img === 'string' ? img : (img?.url || "");
            if (imgUrl && !imageUrls.includes(imgUrl)) {
              imageUrls.push(imgUrl);
            }
          }
        }
      }

      if (videoUrl || imageUrls.length > 0) {
        console.log(`[Threads Scraper] threadsdl.app success - video: ${videoUrl ? 'YES' : 'NO'}, images: ${imageUrls.length}`);
        return {
          title,
          thumbnail: thumbnail || (imageUrls.length > 0 ? imageUrls[0] : ""),
          video: videoUrl,
          images: imageUrls,
          size: "Unknown"
        };
      }
    }
  } catch (e: any) {
    console.log(`[Threads Scraper] threadsdl.app failed:`, e.message);
  }

  // 2. Fallback: Coba Vreden API
  try {
    console.log(`[Threads Scraper] Attempting Vreden API fallback`);
    const { data } = await axios.get(`https://api.vreden.web.id/api/threads?url=${finalUrl}`, { timeout: 10000 });
    if (data && data.status && data.result) {
       let videoUrl = "";
       let imageUrls: string[] = [];

       if (typeof data.result === 'string') {
          videoUrl = data.result;
       } else if (data.result.url) {
          videoUrl = data.result.url;
       } else if (data.result.video) {
          videoUrl = data.result.video;
       } else if (data.result.media) {
           const m = data.result.media;
           if (Array.isArray(m)) {
               m.forEach((x: any) => {
                   if (!x.url) return;
                   const isVideo = x.url.includes('.mp4') ||
                                   x.type === 'video' ||
                                   ((x.url.includes('fbcdn') || x.url.includes('cdninstagram') || x.url.includes('scontent')) &&
                                    (x.url.includes('video') || x.url.includes('/v/') || x.url.includes('bytestart') || x.url.includes('efg=')));
                   if (isVideo && !videoUrl) videoUrl = x.url;
                   else if (!isVideo) imageUrls.push(x.url);
               });
           } else {
               videoUrl = m.url || m;
           }
       }
       if (videoUrl || imageUrls.length > 0) {
           return {
               title: "Threads Media",
               thumbnail: imageUrls.length > 0 ? imageUrls[0] : "",
               video: videoUrl,
               images: imageUrls,
               size: "Unknown"
           };
       }
    }
  } catch (e: any) {
    // silent
  }

  // 3. Fallback: Coba Threadsmate
  const nonce = await scrapeThreadsmateNonce() || "56ffa63506";
  const apiUrl = "https://threadsmate.com/wp-json/visolix/api/download";

  try {
    const response = await axios.post(apiUrl, { captcha_response: null, format: "", url: finalUrl }, {
        headers: {
            'Content-Type': 'application/json',
            'X-Visolix-Nonce': nonce,
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'
        },
        timeout: 15000
    });

    if (response.data.status && response.data.data) {
      const $ = cheerio.load(response.data.data);
      let videoUrl = "";
      const images: string[] = [];
      let thumbnail = "";

      const isLikelyVideoUrl = (href: string): boolean => {
        if (!href || !href.startsWith("http")) return false;
        if (href.includes('.mp4')) return true;
        if ((href.includes('fbcdn') || href.includes('cdninstagram') || href.includes('scontent')) &&
            (href.includes('video') || href.includes('/v/') || href.includes('bytestart') || href.includes('efg='))) return true;
        return false;
      };

      $('video source, video').each((_i, el) => {
          const src = $(el).attr('src');
          if (src && !videoUrl && src.startsWith("http")) videoUrl = src;
      });

      $('a, button').each((_i, el) => {
        const href = $(el).attr('href') || "";
        const text = $(el).text().toLowerCase();
        if (!href || !href.startsWith("http")) return;

        if (isLikelyVideoUrl(href) || text.includes('video') || text.includes('mp4') || text.includes('download video')) {
           if (!videoUrl) videoUrl = href;
        } else if (text.includes('download') && !text.includes('image') && !text.includes('photo')) {
           if (!videoUrl && !href.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i)) {
             videoUrl = href;
           }
        }

        if (href.match(/\.(jpg|jpeg|png|webp|gif)(\?|$)/i) || text.includes('image') || text.includes('photo')) {
           if (!images.includes(href)) images.push(href);
        }
      });

      $('img').each((_i, el) => {
        const src = $(el).attr('src') || "";
        if (src && !thumbnail && src.startsWith("http")) thumbnail = src;
      });

      if (videoUrl || images.length > 0) {
        return {
          title: "Threads Media",
          thumbnail: thumbnail || (images.length > 0 ? images[0] : ""),
          video: videoUrl,
          images: images,
          size: "Unknown"
        };
      }
    }
  } catch (err: any) {
    // silent
  }

  return null;
};
