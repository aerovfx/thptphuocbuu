'use client'

import { getEmbedInfo } from '@/lib/media-embed'
import { useMemo, useState } from 'react'

export default function LinkEmbed(props: { url: string; onInteraction?: () => void }) {
  const info = getEmbedInfo(props.url)
  const [isPlaying, setIsPlaying] = useState(false)

  if (!props.url) return null

  if (info.kind === 'youtube') {
    const thumbUrl = useMemo(() => {
      // hqdefault always exists; maxresdefault sometimes 404s
      return `https://i.ytimg.com/vi/${info.videoId}/hqdefault.jpg`
    }, [info.videoId])

    const iframeSrc = useMemo(() => {
      // Plays inline + starts on user gesture (x.com style)
      const u = new URL(info.embedUrl)
      u.searchParams.set('autoplay', '1')
      u.searchParams.set('playsinline', '1')
      u.searchParams.set('rel', '0')
      u.searchParams.set('modestbranding', '1')
      return u.toString()
    }, [info.embedUrl])

    return (
      <div
        className="w-full rounded-2xl overflow-hidden border border-bluelock-blue/30 dark:border-gray-800 bg-black"
        onClick={(e) => {
          // Prevent opening Post modal when interacting with the player
          e.stopPropagation()
          props.onInteraction?.()
          if (!isPlaying) setIsPlaying(true)
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            e.stopPropagation()
            props.onInteraction?.()
            if (!isPlaying) setIsPlaying(true)
          }
        }}
      >
        {/* Use padding-top aspect ratio to avoid relying on Tailwind aspect-ratio plugin */}
        <div className="relative w-full" style={{ paddingTop: '56.25%' }}>
          {isPlaying ? (
            <iframe
              src={iframeSrc}
              title="YouTube video player"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
              referrerPolicy="strict-origin-when-cross-origin"
            />
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={thumbUrl}
                alt="YouTube preview"
                className="absolute inset-0 w-full h-full object-cover opacity-95"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-black/10" />

              <div className="absolute inset-0 flex items-center justify-center">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-black/60 backdrop-blur border border-white/20">
                  <div
                    className="ml-1"
                    style={{
                      width: 0,
                      height: 0,
                      borderTop: '10px solid transparent',
                      borderBottom: '10px solid transparent',
                      borderLeft: '16px solid rgba(255,255,255,0.95)',
                    }}
                  />
                </div>
              </div>

              <div className="absolute bottom-3 left-3 right-3 flex items-center justify-between gap-2">
                <div className="text-xs text-white/90 font-poppins truncate">
                  YouTube
                </div>
                <a
                  href={info.canonicalUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-white/80 hover:text-white underline underline-offset-2"
                  onClick={(e) => {
                    // allow opening YouTube without triggering play
                    e.stopPropagation()
                    props.onInteraction?.()
                  }}
                >
                  Mở
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  if (info.kind === 'image') {
    return (
      <div
        className="w-full rounded-2xl overflow-hidden border border-bluelock-blue/30 dark:border-gray-800 bg-bluelock-light-2 dark:bg-gray-900"
        onClick={(e) => {
          // Let parent open modal for images
          // (do not stopPropagation)
        }}
      >
        <img src={info.url} alt="Link preview" className="w-full max-h-96 object-contain" />
      </div>
    )
  }

  if (info.kind === 'video') {
    return (
      <div
        className="w-full rounded-2xl overflow-hidden border border-bluelock-blue/30 dark:border-gray-800 bg-black"
        onClick={(e) => {
          // Prevent opening Post modal when interacting with the video player
          e.stopPropagation()
          props.onInteraction?.()
        }}
      >
        <video src={info.url} controls className="w-full max-h-96 object-contain" />
      </div>
    )
  }

  if (info.kind === 'preview') {
    const platformLabel =
      info.platform === 'twitter'
        ? 'X'
        : info.platform === 'tiktok'
        ? 'TikTok'
        : info.platform === 'facebook'
        ? 'Facebook'
        : 'Instagram'

    const platformIcon =
      info.platform === 'twitter'
        ? '𝕏'
        : info.platform === 'tiktok'
        ? '♪'
        : info.platform === 'facebook'
        ? 'f'
        : '⌁'

    return (
      <a
        href={info.canonicalUrl}
        target="_blank"
        rel="noreferrer"
        className="block rounded-2xl border border-bluelock-blue/30 dark:border-gray-800 bg-bluelock-light-2 dark:bg-gray-900 px-4 py-3 hover:bg-bluelock-light-3 dark:hover:bg-gray-800 transition-colors"
        onClick={(e) => {
          e.stopPropagation()
          props.onInteraction?.()
        }}
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-black/10 dark:bg-white/10 flex items-center justify-center font-semibold">
            {platformIcon}
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-sm font-semibold font-poppins text-bluelock-dark dark:text-white">
              Xem video trên {platformLabel}
            </div>
            <div className="text-xs text-bluelock-dark/60 dark:text-gray-400 break-all">
              {info.canonicalUrl}
            </div>
          </div>
          <div className="text-sm text-blue-500 font-poppins">→</div>
        </div>
      </a>
    )
  }

  // Generic link fallback
  return (
    <a
      href={props.url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-2xl border border-bluelock-blue/30 dark:border-gray-800 bg-gray-900 px-4 py-3 hover:bg-gray-800 transition-colors"
      onClick={(e) => {
        e.stopPropagation()
        props.onInteraction?.()
      }}
    >
      <div className="text-sm text-blue-400 font-poppins break-all">{props.url}</div>
    </a>
  )
}


