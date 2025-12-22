import { NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

function unauthorizedResponse() {
  // Hide the existence of the endpoint if token is missing/wrong.
  return NextResponse.json({ error: 'Not found' }, { status: 404 })
}

/**
 * DB connectivity healthcheck (protected by HEALTHCHECK_TOKEN header).
 *
 * - Set `HEALTHCHECK_TOKEN` on Cloud Run.
 * - Optionally set `DATABASE_URL_TEST` to test an alternate DB URL without changing the main `DATABASE_URL`.
 * - Call: GET /api/health/db  with header: x-healthcheck-token: <token>
 */
export async function GET(req: Request) {
  const expected = process.env.HEALTHCHECK_TOKEN
  const provided = req.headers.get('x-healthcheck-token')

  if (!expected || !provided || provided !== expected) {
    return unauthorizedResponse()
  }

  const usingEnv = process.env.DATABASE_URL_TEST ? 'DATABASE_URL_TEST' : 'DATABASE_URL'
  const url = process.env.DATABASE_URL_TEST || process.env.DATABASE_URL

  if (!url) {
    return NextResponse.json(
      { ok: false, error: 'Missing database url env var', usingEnv },
      { status: 500 }
    )
  }

  const start = Date.now()
  const prisma = new PrismaClient({
    datasources: {
      db: { url },
    },
  })

  try {
    await prisma.$connect()
    // Minimal query to validate connectivity.
    await prisma.$queryRawUnsafe('SELECT 1')
    const latencyMs = Date.now() - start
    return NextResponse.json({ ok: true, usingEnv, latencyMs })
  } catch (error: any) {
    const latencyMs = Date.now() - start
    return NextResponse.json(
      {
        ok: false,
        usingEnv,
        latencyMs,
        // Don't leak credentials; only return a generic message + Prisma error code if present.
        code: error?.code || null,
        message: error?.message ? String(error.message).slice(0, 300) : 'DB connection failed',
      },
      { status: 500 }
    )
  } finally {
    await prisma.$disconnect().catch(() => {})
  }
}


