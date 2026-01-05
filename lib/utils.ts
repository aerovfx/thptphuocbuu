import { formatDistanceToNow } from 'date-fns'
import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

// Fallback to English if Vietnamese locale is not available
let viLocale: any = null
try {
  viLocale = require('date-fns/locale/vi')
} catch {
  // Fallback to English
}

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: Date | string): string {
  try {
    return formatDistanceToNow(new Date(date), {
      addSuffix: true,
      locale: viLocale || undefined,
    })
  } catch {
    return formatDistanceToNow(new Date(date), { addSuffix: true })
  }
}

export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '')
}

