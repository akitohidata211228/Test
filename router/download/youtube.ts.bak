import axios from "axios";

type Format = "mp3" | "mp4";

export async function youtubeDownloader(
  url: string,
  format: Format = "mp4"
) {
  // contoh endpoint scrape (sesuaikan dengan source lu)
  const scrape = await axios.get("https://SCRAPER_API_URL", {
    params: { url }
  });

  const data = scrape.data;

  // struktur contoh hasil scrape
  const videoUrl = data?.video?.mp4 || data?.video;
  const audioUrl = data?.audio?.mp3 || data?.audio;

  // === LOGIC UTAMA ===
  if (format === "mp3") {
    if (audioUrl) {
      return {
        status: true,
        type: "audio",
        format: "mp3",
        title: data.title,
        url: audioUrl
      };
    }

    // fallback kalau user minta mp3 tapi gak ada
    return {
      status: true,
      type: "video",
      format: "mp4",
      title: data.title,
      url: videoUrl,
      note: "Audio tidak tersedia, fallback ke MP4"
    };
  }

  // default MP4
  if (videoUrl) {
    return {
      status: true,
      type: "video",
      format: "mp4",
      title: data.title,
      url: videoUrl
    };
  }

  throw new Error("Media tidak ditemukan");
}