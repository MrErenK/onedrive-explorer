import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { randomBytes } from "crypto";

// Helper function to generate a random API key
function generateApiKey(): string {
  return `hlcyn_${randomBytes(16).toString("hex")}`;
}

// Helper function to check authorization
function isAuthorized(request: NextRequest): boolean {
  const authHeader = request.headers.get("authorization");
  return authHeader === process.env.ADMIN_API_KEY;
}

export async function POST(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const newKey = generateApiKey();
    const apiKey = await prisma.apiKey.create({
      data: { key: newKey },
    });

    return NextResponse.json(
      { id: apiKey.id, key: apiKey.key },
      { status: 201 },
    );
  } catch (error) {
    console.error("Error creating API key:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get("id");

  if (!id) {
    return NextResponse.json({ error: "Missing API key ID" }, { status: 400 });
  }

  try {
    await prisma.apiKey.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "API key deleted successfully" },
      { status: 200 },
    );
  } catch (error) {
    console.error("Error deleting API key:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
