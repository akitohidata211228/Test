async function scrapeRednote(url: string) {
  const { data } = await axios.get(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/132.0.0.0 Safari/537.36",
    },
    timeout: 30000,
  })

  const title =
    (data.match(/<title>(.*?)<\/title>/i) || [])[1]?.trim() || "Rednote"

  const authorName =
    (data.match(/<meta\s+name="og:title"\s+content="(.*?)"/i) || [])[1]
      ?.split(" - ")[0]
      ?.trim() || "Unknown"

  const videoUrl =
    (data.match(/<meta\s+name="og:video"\s+content="(.*?)"/i) || [])[1] || null

  const thumbnail =
    (data.match(/<meta\s+name="og:image"\s+content="(.*?)"/i) || [])[1] || null

  const noteId =
    (data.match(/<meta\s+name="og:url"\s+content="(.*?)"/i) || [])[1]
      ?.split("/")
      .pop() || null

  const likes =
    (data.match(/<meta\s+name="og:xhs:note_like"\s+content="(.*?)"/i) || [])[1]

  const comments =
    (data.match(/<meta\s+name="og:xhs:note_comment"\s+content="(.*?)"/i) || [])[1]

  const collects =
    (data.match(/<meta\s+name="og:xhs:note_collect"\s+content="(.*?)"/i) || [])[1]

  const images: string[] = []
  const imgMatches =
    data.match(/<meta\s+name="og:image"\s+content="(.*?)"/gi) || []

  imgMatches.forEach((m: string) => {
    const img = (m.match(/content="(.*?)"/i) || [])[1]
    if (img && !images.includes(img)) images.push(img)
  })

  return {
    platform: "rednote",
    id: noteId,
    title,
    author: {
      name: authorName,
      avatar: thumbnail,
    },
    thumbnail,
    media: {
      type: videoUrl ? "video" : "image",
      downloads: videoUrl
        ? [
            {
              quality: "Original",
              url: videoUrl,
            },
          ]
        : [],
      images: images.length ? images : undefined,
    },
    stats: {
      likes,
      comments,
      collects,
    },
  }
}