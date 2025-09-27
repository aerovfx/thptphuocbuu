import { NextRequest, NextResponse } from "next/server"
import { hash } from "bcryptjs"
import { db } from "@/lib/db"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, role } = await request.json()

    console.log("Registration attempt:", { name, email, role })

    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      )
    }

    // Hash password
    console.log("Hashing password...")
    const hashedPassword = await hash(password, 12)
    console.log("Password hashed successfully")

    // Create user
    console.log("Creating user...")
    const user = await db.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: role || "STUDENT"
      }
    })
    console.log("User created:", user.id)

    return NextResponse.json(
      { message: "User created successfully", userId: user.id },
      { status: 201 }
    )
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error.message },
      { status: 500 }
    )
  }
}
