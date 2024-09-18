import { NextResponse } from "next/server";
import { refreshToken } from "@/lib/refreshToken";
import { getServerTokens } from "@/lib/getServerTokens";

export async function GET() {
  try {
    // Fetch the current tokens from the database
    const currentTokens = await getServerTokens();

    if (!currentTokens) {
      return NextResponse.json(
        { error: "No tokens found in database" },
        { status: 404 },
      );
    }

    // Check if token expiration is near (e.g., within 5 minutes)
    const expirationThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds
    const currentTime = Date.now();
    const tokenExpirationTime = new Date(currentTokens.expiresAt).getTime();

    if (tokenExpirationTime - currentTime > expirationThreshold) {
      // Token is not near expiration, no need to refresh
      return NextResponse.json({
        message: "Token is still valid",
        expiresAt: currentTokens.expiresAt,
      });
    }

    // Refresh the token if expiration is near
    const newTokens = await refreshToken(currentTokens.refreshToken);

    return NextResponse.json({
      message: "Token refreshed successfully",
      expiresAt: newTokens.expiresAt,
    });
  } catch (error) {
    console.error("Error refreshing token:", error);
    return NextResponse.json(
      { error: "Failed to refresh token" },
      { status: 500 },
    );
  }
}
