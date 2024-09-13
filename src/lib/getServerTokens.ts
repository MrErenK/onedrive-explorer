"use server";

import { prisma } from "./prisma";

export async function getServerTokens() {
  const tokens = await prisma.tokens.findFirst();

  if (!tokens) {
    return null;
  }

  return {
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    expiresAt: tokens.expiresAt,
  };
}

export async function isLogged() {
  try {
    const tokens = await getServerTokens();
    if (tokens) {
      return true;
    }
    return false;
  } catch (error) {
    return false;
  }
}
