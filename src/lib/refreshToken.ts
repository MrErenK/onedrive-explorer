import { prisma } from "./prisma";

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}

interface Tokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: Date;
}

export async function refreshToken(refreshToken: string): Promise<Tokens> {
  console.log("Refreshing token...");
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

  const data: TokenResponse = await response.json();

  if (!response.ok) {
    console.error("Failed to refresh token.");
    throw new Error("Failed to refresh token");
  }

  const newTokens: Tokens = {
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    expiresAt: new Date(Date.now() + data.expires_in * 1000),
  };

  await prisma.tokens.updateMany({
    where: {},
    data: newTokens,
  });

  console.log("Token refreshed, new expiration:", newTokens.expiresAt);

  return newTokens;
}
