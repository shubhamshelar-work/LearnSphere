export default function VideoEmbed({ url, title = 'Lesson video' }) {
  const videoId = extractYouTubeId(url)

  if (!videoId) {
    return (
      <div className="flex aspect-video w-full items-center justify-center rounded-xl border border-primary-200 bg-primary-50 text-center">
        <div className="px-6 py-10">
          <p className="font-medium text-ink">Video unavailable</p>
          <p className="mt-1 text-sm text-muted">
            This lesson does not have a valid YouTube link yet.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-xl border border-primary-100 shadow-sm">
      <iframe
        className="aspect-video w-full"
        src={`https://www.youtube.com/embed/${videoId}`}
        title={title}
        frameBorder="0"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
      />
    </div>
  )
}

function extractYouTubeId(url) {
  if (!url || typeof url !== 'string') return null
  const patterns = [
    /youtube\.com\/watch\?v=([\w-]{11})/,
    /youtu\.be\/([\w-]{11})/,
    /youtube\.com\/embed\/([\w-]{11})/,
    /youtube\.com\/shorts\/([\w-]{11})/,
  ]
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match) return match[1]
  }
  return null
}
