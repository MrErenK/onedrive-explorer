import { NextResponse } from "next/server";
import { refreshToken } from "@/lib/refreshToken";
import { getServerTokens } from "@/lib/getServerTokens";

export async function GET() {
  try {
    // Fetch the current refresh token from the database
    const currentTokens = await getServerTokens();

    if (!currentTokens) {
      return NextResponse.json(
        { error: "No tokens found in database" },
        { status: 404 },
      );
    }

    // Refresh the token
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
