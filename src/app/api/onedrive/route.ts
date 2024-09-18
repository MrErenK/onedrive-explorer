import { NextResponse } from "next/server";
import { getDriveContents, getDriveItem, downloadFile } from "@/lib/graph";
import { getServerTokens } from "@/lib/getServerTokens";
import { prisma } from "@/lib/prisma";
import { refreshToken } from "@/lib/refreshToken";

// Create a simple in-memory cache
const cache = new Map<string, { data: any; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

async function getCachedOrFetch(key: string, fetchFn: () => Promise<any>) {
  if (cache.has(key)) {
    const cacheEntry = cache.get(key);
    if (cacheEntry && Date.now() - cacheEntry.timestamp < CACHE_TTL) {
      return cacheEntry.data;
    }
  }
  const data = await fetchFn();
  cache.set(key, { data, timestamp: Date.now() });
  return data;
}

export async function GET(request: Request) {
  let tokens = await getServerTokens();
  if (!tokens) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (Date.now() > tokens.expiresAt.getTime() - 5000) {
    tokens = await refreshToken(tokens.refreshToken);
  }

  const { searchParams } = new URL(request.url);
  const path = searchParams.get("path") || "";
  const action = searchParams.get("action");
  const itemId = searchParams.get("itemId");

  try {
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
        const itemKey = `item:${itemId || path}`;
        try {
          const item = await getCachedOrFetch(itemKey, () =>
            itemId
              ? getDriveItem(accessToken, itemId)
              : getDriveItem(accessToken, path),
          );
          return NextResponse.json(item);
        } catch (itemError: any) {
          console.error("Error fetching item details:", itemError);
          return NextResponse.json(
            { error: "Failed to load file details" },
            { status: itemError.statusCode || 404 },
          );
        }

      default:
        const contentsKey = `contents:${path}`;
        const contents = await getCachedOrFetch(contentsKey, () =>
          getDriveContents(accessToken, path),
        );
        const totalFileSize = contents.reduce(
          (sum: number, file: { size?: number }) => sum + (file.size ?? 0),
          0,
        );
        const totalFileCount = contents.length;
        return NextResponse.json({
          files: contents,
          totalFileSize,
          totalFileCount,
        });
    }
  } catch (error: any) {
    console.error("Error in OneDrive API:", error);
    return NextResponse.json(
      { error: error.message || "Failed to perform OneDrive operation" },
      { status: error.statusCode || 500 },
    );
  }
}
