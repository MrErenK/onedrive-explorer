import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tokens = await prisma.tokens.findFirst();
  const isLoggedIn = !!tokens;
  return NextResponse.json({ isLoggedIn });
}

export async function POST() {
  // Check if the user is authenticated
  const session = await getServerSession(authOptions);

  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  try {
    // Delete tokens only for the current user
    await prisma.tokens.deleteMany({
      where: {
        id: session.user.id,
      },
    });
    return NextResponse.json(
      { message: "Logged out successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error during logout:", error);
    return NextResponse.json(
      { message: "An error occurred during logout" },
      { status: 500 },
    );
  }
}
