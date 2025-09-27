import { getServerSession } from "next-auth/next";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { authOptions } from "@/lib/auth";

export async function POST(
  req: Request,
) {
  try {
    const session = await getServerSession(authOptions);
    const { title } = await req.json();

    if (!session?.user?.id || session.user.role !== "TEACHER") {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const course = await db.course.create({
      data: {
        userId: session.user.id,
        title,
      }
    });

    return NextResponse.json(course);
  } catch (error) {
    console.log("[COURSES]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}