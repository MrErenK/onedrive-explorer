import { NextResponse } from "next/server";
import { getDriveContents, getDriveItem, downloadFile } from "@/lib/graph";
import { getServerTokens } from "@/lib/getServerTokens";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

async function RefreshToken(refreshToken: string) {
  const response = await fetch(
    `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`,
    {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: process.env.AZURE_AD_CLIENT_ID!,
        client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
        grant_type: "refresh_token",
        refresh_token: refreshToken,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error("Failed to refresh token");
  }

  await prisma.tokens.updateMany({
    data: {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      expiresAt: new Date(Date.now() + data.expires_in * 1000),
    },
  });

  return {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };
}

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || !session.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") || "";
  const action = searchParams.get("action");
  const itemId = searchParams.get("itemId");
  try {
    let tokens = await getServerTokens();
    if (!tokens) {
      throw new Error("Failed to retrieve server tokens");
    }

    if (Date.now() > tokens.expiresAt.getTime() - 5000) {
      // Refresh if within 5 seconds of expiration
      tokens = await RefreshToken(tokens.refreshToken);
    }

    const { accessToken } = tokens;

    switch (action) {
      case "download":
        if (!path) {
          return NextResponse.json(
            { error: "Path is required for download" },
            { status: 400 },
          );
        }
        const downloadUrl = await downloadFile(accessToken, path);
        return NextResponse.redirect(downloadUrl);
      case "item":
        if (!itemId && !path) {
          return NextResponse.json(
            { error: "Item ID or path is required for item details" },
            { status: 400 },
          );
        }
        const item = itemId
          ? await getDriveItem(accessToken, itemId)
          : await getDriveItem(accessToken, path);
        return NextResponse.json(item);
      default:
        const contents = await getDriveContents(accessToken, path);
        return NextResponse.json({ files: contents });
    }
  } catch (error: any) {
    console.error("Error in OneDrive API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform OneDrive operation" },
      { status: error.statusCode || 500 },
    );
  }
}
