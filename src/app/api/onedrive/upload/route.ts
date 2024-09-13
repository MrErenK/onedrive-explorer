import { NextResponse } from "next/server";
import { uploadFile } from "@/lib/graph";
import { prisma } from "@/lib/prisma";
import { getServerTokens } from "@/lib/getServerTokens";
import { refreshToken } from "../route";

export async function POST(request: Request) {
  let tokens = await getServerTokens();
  if (!tokens) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (Date.now() > tokens.expiresAt.getTime() - 5000) {
    tokens = await refreshToken(tokens.refreshToken);
  }
  const apiKey = request.headers.get("x-api-key");

  if (!apiKey) {
    return NextResponse.json(
      { error: "API key is required for upload" },
      { status: 400 },
    );
  }

  const key = await prisma.apiKey.findUnique({
    where: { key: apiKey },
    select: { key: true },
  });

  if (!key || key.key !== apiKey) {
    return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
  }

  try {
    const { accessToken } = tokens;
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const path = formData.get("path") as string;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    if (!path) {
      return NextResponse.json({ error: "No path provided" }, { status: 400 });
    }

    const buffer = await file.arrayBuffer();
    const filePath = path !== "/" ? `${path}${file.name}` : file.name;

    await uploadFile(accessToken, filePath, buffer);

    return NextResponse.json({
      message: "File uploaded successfully",
      fileName: file.name,
      fileSize: file.size,
      fileType: file.type,
      uploadPath: filePath,
    });
  } catch (error: any) {
    console.error("Error in file upload:", error);
    return NextResponse.json(
      { error: error.message || "Failed to upload file" },
      { status: error.statusCode || 500 },
    );
  }
}
