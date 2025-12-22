'use client'

import { Fragment, useMemo, type ReactNode } from 'react'
import { getEmbedInfo } from '@/lib/media-embed'
import LinkEmbed from './LinkEmbed'

const URL_REGEX = /https?:\/\/[^\s<>()]+/gi

function normalizeUrl(raw: string) {
  return raw.replace(/[),.]+$/, '')
}

export default function AutoEmbedContent(props: {
  text?: string | null
  fallbackUrl?: string | null
  className?: string
  maxEmbeds?: number
  suppressEmbeds?: boolean
  onInteraction?: () => void
}) {
  const {
    text,
    fallbackUrl,
    className,
    maxEmbeds = 3,
    suppressEmbeds = false,
    onInteraction,
  } = props

  const content = (text || '').toString()

  const nodes = useMemo(() => {
    const out: ReactNode[] = []
    let lastIndex = 0
    let embedCount = 0

    const matches = Array.from(content.matchAll(URL_REGEX))
    if (!matches.length) {
      // No URL in text: render text as-is, plus optional fallback embed (e.g. legacy linkUrl-only posts).
      if (content) out.push(content)
      if (fallbackUrl && !suppressEmbeds) {
        out.push(
          <div key="__fallback_embed" className="mt-3">
            <LinkEmbed url={fallbackUrl} onInteraction={onInteraction} />
          </div>
        )
      }
      return out
    }

    for (let i = 0; i < matches.length; i++) {
      const m = matches[i]
      const raw = m[0] || ''
      const start = m.index ?? 0
      const end = start + raw.length

      if (start > lastIndex) {
        out.push(
          <Fragment key={`t-${i}`}>
            {content.slice(lastIndex, start)}
          </Fragment>
        )
      }

      const url = normalizeUrl(raw)
      const info = getEmbedInfo(url)

      const canEmbed =
        !suppressEmbeds &&
        embedCount < maxEmbeds &&
        (info.kind === 'youtube' || info.kind === 'image' || info.kind === 'video' || info.kind === 'preview')

      if (canEmbed) {
        embedCount += 1
        out.push(
          <div key={`e-${i}`} className="my-3">
            <LinkEmbed url={url} onInteraction={onInteraction} />
          </div>
        )
      } else {
        out.push(
          <a
            key={`a-${i}`}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-500 hover:underline break-all"
            onClick={(e) => {
              e.stopPropagation()
              onInteraction?.()
            }}
          >
            {url}
          </a>
        )
      }

      lastIndex = end
    }

    if (lastIndex < content.length) {
      out.push(<Fragment key="t-end">{content.slice(lastIndex)}</Fragment>)
    }

    // If text had URLs but none were embeddable, optionally show fallbackUrl (rare)
    if (embedCount === 0 && fallbackUrl && !suppressEmbeds) {
      out.push(
        <div key="__fallback_embed_2" className="mt-3">
          <LinkEmbed url={fallbackUrl} onInteraction={onInteraction} />
        </div>
      )
    }

    return out
  }, [content, fallbackUrl, maxEmbeds, suppressEmbeds, onInteraction])

  // If content exists, always render it. Embeds are inserted inline as block nodes.
  return (
    <div className={`${className || ''} whitespace-pre-wrap break-words`}>{nodes}</div>
  )
}


