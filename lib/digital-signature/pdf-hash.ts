/**
 * PDF Hash Utility
 * 
 * Tính hash SHA256 của file PDF để gửi đến VNPT SmartCA
 */

import crypto from 'crypto'
import { readFile } from 'fs/promises'
import { join } from 'path'

/**
 * Calculate SHA256 hash of PDF file
 */
export async function calculatePDFHash(filePath: string): Promise<string> {
  try {
    const fileBuffer = await readFile(filePath)
    const hash = crypto.createHash('sha256')
    hash.update(fileBuffer)
    return hash.digest('hex')
  } catch (error: any) {
    console.error('Error calculating PDF hash:', error)
    throw new Error('Không thể tính hash của file PDF')
  }
}

/**
 * Calculate SHA256 hash from buffer
 */
export function calculateHashFromBuffer(buffer: Buffer): string {
  const hash = crypto.createHash('sha256')
  hash.update(buffer)
  return hash.digest('hex')
}

