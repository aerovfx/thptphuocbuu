import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    // Test database connection
    const userCount = await db.user.count();
    
    return NextResponse.json({ 
      message: "Database connection successful!",
      userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ 
      message: "Database connection failed!",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
