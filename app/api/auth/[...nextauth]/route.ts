import NextAuth from 'next-auth'
import { authOptions } from '@/lib/auth'
import { NextResponse } from 'next/server'

const handler = NextAuth(authOptions)

// Wrap handlers to ensure JSON error responses
const GET = async (req: Request, context: any) => {
  try {
    return await handler(req, context)
  } catch (error: any) {
    console.error('[NextAuth] GET error:', error)
    return NextResponse.json(
      { 
        error: 'Authentication error',
        message: error?.message || 'An error occurred during authentication'
      },
      { status: 500 }
    )
  }
}

const POST = async (req: Request, context: any) => {
  try {
    return await handler(req, context)
  } catch (error: any) {
    console.error('[NextAuth] POST error:', error)
    return NextResponse.json(
      { 
        error: 'Authentication error',
        message: error?.message || 'An error occurred during authentication'
      },
      { status: 500 }
    )
  }
}

export { GET, POST }

