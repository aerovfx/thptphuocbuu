export type EmbedInfo =
  | { kind: 'youtube'; videoId: string; embedUrl: string; canonicalUrl: string }
  | { kind: 'image'; url: string }
  | { kind: 'video'; url: string }
  | { kind: 'preview'; platform: 'facebook' | 'tiktok' | 'instagram' | 'twitter'; url: string; canonicalUrl: string }
  | { kind: 'link'; url: string }

const URL_REGEX = /https?:\/\/[^\s<>()]+/gi

export function extractFirstUrl(text: string): string | null {
  if (!text) return null
  const m = text.match(URL_REGEX)
  if (!m || !m.length) return null
  // Strip trailing punctuation commonly attached in text
  return m[0].replace(/[),.]+$/, '')
}

function isProbablyImage(url: string) {
  return /\.(png|jpg|jpeg|gif|webp|bmp|svg)(\?.*)?$/i.test(url)
}

function isProbablyVideo(url: string) {
  return /\.(mp4|webm|ogg|mov|m4v)(\?.*)?$/i.test(url)
}

export function getEmbedInfo(rawUrl: string): EmbedInfo {
  const url = (rawUrl || '').trim()
  if (!url) return { kind: 'link', url: '' }

  // Direct image/video file links
  if (isProbablyImage(url)) return { kind: 'image', url }
  if (isProbablyVideo(url)) return { kind: 'video', url }

  // YouTube
  try {
    const u = new URL(url)
    const host = u.hostname.replace(/^www\./, '')

    let videoId: string | null = null

    if (host === 'youtu.be') {
      // https://youtu.be/<id>?t=...
      const path = u.pathname.replace(/^\/+/, '')
      videoId = path ? path.split('/')[0] : null
    } else if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      // https://youtube.com/watch?v=<id>
      const v = u.searchParams.get('v')
      if (v) videoId = v

      // https://youtube.com/shorts/<id>
      if (!videoId && u.pathname.startsWith('/shorts/')) {
        videoId = u.pathname.split('/')[2] || null
      }

      // https://youtube.com/embed/<id>
      if (!videoId && u.pathname.startsWith('/embed/')) {
        videoId = u.pathname.split('/')[2] || null
      }
    }

    if (videoId) {
      // normalize id
      videoId = videoId.replace(/[^a-zA-Z0-9_-]/g, '')
      const embedUrl = `https://www.youtube-nocookie.com/embed/${videoId}`
      const canonicalUrl = `https://www.youtube.com/watch?v=${videoId}`
      return { kind: 'youtube', videoId, embedUrl, canonicalUrl }
    }

    // Other platforms: render as lightweight preview card (privacy/perf friendly)
    // Facebook
    if (host === 'facebook.com' || host === 'm.facebook.com' || host === 'fb.watch') {
      const path = u.pathname || ''
      const isReel = /\/reel\/\d+/.test(path)
      const isWatch = u.searchParams.has('v')
      const isFbWatch = host === 'fb.watch' && path.replace(/^\/+/, '').length > 0
      if (isReel || isWatch || isFbWatch) {
        return { kind: 'preview', platform: 'facebook', url, canonicalUrl: url }
      }
    }

    // TikTok
    if (host === 'tiktok.com' || host === 'www.tiktok.com' || host === 'vm.tiktok.com') {
      const isVideo = /\/video\/\d+/.test(u.pathname || '')
      const isShort = host === 'vm.tiktok.com'
      if (isVideo || isShort) {
        return { kind: 'preview', platform: 'tiktok', url, canonicalUrl: url }
      }
    }

    // Instagram
    if (host === 'instagram.com' || host === 'www.instagram.com') {
      const isPost = /\/(reel|p)\/[a-zA-Z0-9_-]+/.test(u.pathname || '')
      if (isPost) {
        return { kind: 'preview', platform: 'instagram', url, canonicalUrl: url }
      }
    }

    // Twitter / X
    if (host === 'twitter.com' || host === 'x.com') {
      const isStatus = /\/status\/\d+/.test(u.pathname || '')
      if (isStatus) {
        return { kind: 'preview', platform: 'twitter', url, canonicalUrl: url }
      }
    }
  } catch {
    // ignore URL parse errors
  }

  return { kind: 'link', url }
}


