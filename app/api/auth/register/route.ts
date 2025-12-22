import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'
import { randomBytes } from 'crypto'
import { sendVerificationEmail } from '@/lib/email'

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  dateOfBirth: z.string().optional().transform((val) => val ? new Date(val) : undefined),
  role: z.enum(['STUDENT', 'TEACHER', 'PARENT', 'ADMIN']),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    
    // Pre-process and normalize data BEFORE validation to ensure validation checks the actual stored values
    const preprocessedBody = {
      ...body,
      email: typeof body.email === 'string' ? body.email.trim().toLowerCase() : body.email,
      password: typeof body.password === 'string' ? body.password.trim() : body.password,
      firstName: typeof body.firstName === 'string' ? body.firstName.trim() : body.firstName,
      lastName: typeof body.lastName === 'string' ? body.lastName.trim() : body.lastName,
    }
    
    const validatedData = registerSchema.parse(preprocessedBody)

    // Use normalized values (already trimmed in preprocessing)
    const normalizedEmail = validatedData.email
    const normalizedPassword = validatedData.password

    const existingUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    })

    if (existingUser) {
      return NextResponse.json(
        { error: 'Email đã được sử dụng' },
        { status: 400 }
      )
    }

    const hashedPassword = await bcrypt.hash(normalizedPassword, 10)

    // Generate email verification token
    const verificationToken = randomBytes(32).toString('hex')
    const verificationTokenExpires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail, // Use normalized email
        password: hashedPassword,
        firstName: validatedData.firstName, // Already trimmed in preprocessing
        lastName: validatedData.lastName, // Already trimmed in preprocessing
        dateOfBirth: validatedData.dateOfBirth,
        role: validatedData.role,
        // Store verification token (we'll use resetPasswordToken field temporarily)
        // TODO: Add dedicated emailVerificationToken field to schema
        resetPasswordToken: verificationToken,
        resetPasswordExpires: verificationTokenExpires,
      },
    })

    // Send verification email
    try {
      await sendVerificationEmail(user.email, verificationToken)
    } catch (emailError) {
      console.error('Failed to send verification email:', emailError)
      // Continue anyway - email will be logged in development
    }

    return NextResponse.json(
      { 
        message: 'Đăng ký thành công. Vui lòng kiểm tra email để xác nhận tài khoản.',
        userId: user.id 
      },
      { status: 201 }
    )
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Dữ liệu không hợp lệ', details: error.errors },
        { status: 400 }
      )
    }

    console.error('Registration error:', error)
    return NextResponse.json(
      { error: 'Đã xảy ra lỗi khi đăng ký' },
      { status: 500 }
    )
  }
}

