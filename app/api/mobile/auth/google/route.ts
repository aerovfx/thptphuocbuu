import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import jwt from 'jsonwebtoken'
import { OAuth2Client } from 'google-auth-library'

const JWT_SECRET = process.env.NEXTAUTH_SECRET || 'fallback-secret-key'
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID

// CORS headers for mobile app
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
}

// Handle OPTIONS request
export async function OPTIONS() {
  return NextResponse.json({}, { status: 200, headers: corsHeaders })
}

interface GoogleAuthRequest {
  idToken: string
  email: string
  displayName?: string
  photoUrl?: string
}

export async function POST(request: NextRequest) {
  try {
    const body: GoogleAuthRequest = await request.json()
    const { idToken, email, displayName, photoUrl } = body

    console.log('[Mobile Google Auth] Request received for:', email)

    if (!idToken || !email) {
      return NextResponse.json(
        { error: 'ID token và email là bắt buộc' },
        { status: 400, headers: corsHeaders }
      )
    }

    // Verify Google ID token
    if (!GOOGLE_CLIENT_ID) {
      console.error('[Mobile Google Auth] GOOGLE_CLIENT_ID not configured')
      return NextResponse.json(
        { error: 'Google OAuth chưa được cấu hình' },
        { status: 500, headers: corsHeaders }
      )
    }

    const client = new OAuth2Client(GOOGLE_CLIENT_ID)

    let payload
    try {
      const ticket = await client.verifyIdToken({
        idToken: idToken,
        audience: GOOGLE_CLIENT_ID,
      })
      payload = ticket.getPayload()

      if (!payload || payload.email !== email) {
        console.error('[Mobile Google Auth] Token verification failed: email mismatch')
        return NextResponse.json(
          { error: 'Token không hợp lệ' },
          { status: 401, headers: corsHeaders }
        )
      }

      console.log('[Mobile Google Auth] Token verified successfully for:', payload.email)
    } catch (verifyError: any) {
      console.error('[Mobile Google Auth] Token verification error:', verifyError.message)
      return NextResponse.json(
        { error: 'Xác thực Google thất bại' },
        { status: 401, headers: corsHeaders }
      )
    }

    // Check if user exists
    let user = await prisma.user.findUnique({
      where: { email: email },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
        avatar: true,
        status: true,
        emailVerified: true,
      },
    })

    if (user) {
      // Existing user
      console.log('[Mobile Google Auth] Existing user found:', user.email)

      // Block login for SUSPENDED users
      if (user.status && user.status !== 'ACTIVE') {
        console.warn(`[Mobile Google Auth] Login blocked for suspended user: ${user.email}`)
        return NextResponse.json(
          { error: 'Tài khoản đã bị tạm dừng' },
          { status: 403, headers: corsHeaders }
        )
      }

      // Update avatar if changed
      if (photoUrl && photoUrl !== user.avatar) {
        await prisma.user.update({
          where: { id: user.id },
          data: { avatar: photoUrl },
        })
        user.avatar = photoUrl
      }

      // Mark email as verified if not already
      if (!user.emailVerified) {
        await prisma.user.update({
          where: { id: user.id },
          data: { emailVerified: new Date() },
        })
      }
    } else {
      // New user - create account
      console.log('[Mobile Google Auth] Creating new user for:', email)

      // Email domain whitelist
      const ALLOWED_EMAIL_DOMAINS = [
        'thptphuocbuu.edu.vn',
        'gmail.com',
      ]

      const emailDomain = email.split('@')[1]
      if (!ALLOWED_EMAIL_DOMAINS.includes(emailDomain)) {
        console.warn(`[Mobile Google Auth] Registration blocked for domain: ${emailDomain}`)
        return NextResponse.json(
          { error: 'Email không được phép đăng ký' },
          { status: 403, headers: corsHeaders }
        )
      }

      // Parse name
      const nameParts = (displayName || payload?.name || 'User').split(' ')
      const firstName = nameParts[0] || 'User'
      const lastName = nameParts.slice(1).join(' ') || 'User'

      user = await prisma.user.create({
        data: {
          email: email,
          firstName: firstName,
          lastName: lastName,
          avatar: photoUrl || payload?.picture || null,
          emailVerified: new Date(),
          role: 'STUDENT', // Default role
          status: 'ACTIVE',
        },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          avatar: true,
          status: true,
          emailVerified: true,
        },
      })

      console.log('[Mobile Google Auth] New user created:', user.email)
    }

    // Generate JWT token for mobile app
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role
      },
      JWT_SECRET,
      { expiresIn: '30d' }
    )

    console.log('[Mobile Google Auth] Login successful for:', user.email)

    return NextResponse.json(
      {
        success: true,
        token,
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          fullName: `${user.firstName} ${user.lastName}`,
          role: user.role,
          avatar: user.avatar,
        },
      },
      { headers: corsHeaders }
    )
  } catch (error: any) {
    console.error('[Mobile Google Auth] Error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi đăng nhập Google' },
      { status: 500, headers: corsHeaders }
    )
  }
}
