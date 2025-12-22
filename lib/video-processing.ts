import { execFile } from 'child_process'
import { promisify } from 'util'
import { promises as fs } from 'fs'
import os from 'os'
import path from 'path'
import { randomUUID } from 'crypto'

const execFileAsync = promisify(execFile)

async function ffprobeDurationSeconds(inputPath: string): Promise<number | null> {
  try {
    const { stdout } = await execFileAsync('ffprobe', [
      '-v',
      'error',
      '-show_entries',
      'format=duration',
      '-of',
      'default=noprint_wrappers=1:nokey=1',
      inputPath,
    ])
    const v = parseFloat(String(stdout).trim())
    return Number.isFinite(v) ? v : null
  } catch {
    return null
  }
}

async function runFfmpeg(args: string[], timeoutMs: number) {
  return execFileAsync('ffmpeg', args, { timeout: timeoutMs, maxBuffer: 10 * 1024 * 1024 })
}

export interface TrimResult {
  buffer: Buffer
  mimeType: 'video/mp4'
  wasTrimmed: boolean
  inputDurationSec: number | null
  outputDurationSec: number | null
}

/**
 * Trim a video buffer to maxSeconds (keeps first segment).
 * Outputs MP4 for consistent playback across browsers.
 *
 * Requires ffmpeg + ffprobe available in runtime.
 */
export async function trimVideoToMaxSeconds(params: {
  inputBuffer: Buffer
  maxSeconds: number
}): Promise<TrimResult> {
  const { inputBuffer, maxSeconds } = params

  const tmpDir = os.tmpdir()
  const id = randomUUID()
  const inPath = path.join(tmpDir, `pb-in-${id}`)
  const outPath = path.join(tmpDir, `pb-out-${id}.mp4`)

  try {
    await fs.writeFile(inPath, inputBuffer)

    const inputDurationSec = await ffprobeDurationSeconds(inPath)

    // If duration is known and already within limit, avoid re-encoding.
    if (inputDurationSec !== null && inputDurationSec <= maxSeconds + 0.01) {
      return {
        buffer: inputBuffer,
        mimeType: 'video/mp4',
        wasTrimmed: false,
        inputDurationSec,
        outputDurationSec: inputDurationSec,
      }
    }

    // First try fast trim without re-encoding (may fail depending on container/codec)
    try {
      await runFfmpeg(
        [
          '-y',
          '-i',
          inPath,
          '-t',
          String(maxSeconds),
          '-c',
          'copy',
          outPath,
        ],
        60_000
      )
    } catch {
      // Fallback: re-encode to MP4 (more compatible)
      await runFfmpeg(
        [
          '-y',
          '-i',
          inPath,
          '-t',
          String(maxSeconds),
          '-movflags',
          '+faststart',
          '-c:v',
          'libx264',
          '-preset',
          'veryfast',
          '-crf',
          '28',
          '-pix_fmt',
          'yuv420p',
          '-c:a',
          'aac',
          '-b:a',
          '96k',
          outPath,
        ],
        90_000
      )
    }

    const outBuf = await fs.readFile(outPath)
    const outputDurationSec = await ffprobeDurationSeconds(outPath)

    return {
      buffer: outBuf,
      mimeType: 'video/mp4',
      wasTrimmed: true,
      inputDurationSec,
      outputDurationSec,
    }
  } finally {
    // Best-effort cleanup
    await fs.unlink(inPath).catch(() => {})
    await fs.unlink(outPath).catch(() => {})
  }
}


