import { NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const tokens = await prisma.tokens.findFirst();
  const isLoggedIn = !!tokens;
  return new NextResponse(JSON.stringify({ isLoggedIn }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

export async function POST() {
  // Check if the user is authenticated
  const session = await getServerSession(authOptions);

  if (!session) {
    return new NextResponse(JSON.stringify({ message: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    // Delete tokens only for the current user
    await prisma.tokens.deleteMany({
      where: {
        id: session.user.id,
      },
    });
    return new NextResponse(
      JSON.stringify({ message: "Logged out successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error during logout:", error);
    return new NextResponse(
      JSON.stringify({ message: "An error occurred during logout" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
