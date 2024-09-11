import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";
import { prisma } from "./prisma";

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      authorization: {
        params: {
          scope:
            "openid profile email User.Read Files.ReadWrite.All Sites.Read.All offline_access",
        },
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (
        account &&
        account.access_token &&
        account.refresh_token &&
        account.expires_at
      ) {
        await prisma.tokens.upsert({
          where: { id: user.id },
          update: {
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: new Date(account.expires_at * 1000),
          },
          create: {
            id: user.id,
            accessToken: account.access_token,
            refreshToken: account.refresh_token,
            expiresAt: new Date(account.expires_at * 1000),
          },
        });
      }
      return true;
    },
    async jwt({ token, account, trigger }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }

      if (trigger === "update" && token.expiresAt) {
        const expiresAt = token.expiresAt as number;
        if (Date.now() > expiresAt * 1000) {
          try {
            const storedTokens = await prisma.tokens.findUnique({
              where: { id: token.sub },
            });

            if (storedTokens && storedTokens.refreshToken) {
              const response = await fetch(
                `https://login.microsoftonline.com/${process.env.AZURE_AD_TENANT_ID}/oauth2/v2.0/token`,
                {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                  },
                  body: new URLSearchParams({
                    client_id: process.env.AZURE_AD_CLIENT_ID!,
                    client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
                    grant_type: "refresh_token",
                    refresh_token: storedTokens.refreshToken,
                  }),
                },
              );

              const refreshedTokens = await response.json();

              if (!response.ok) throw refreshedTokens;

              await prisma.tokens.update({
                where: { id: token.sub },
                data: {
                  accessToken: refreshedTokens.access_token,
                  refreshToken: refreshedTokens.refresh_token,
                  expiresAt: new Date(
                    Date.now() + refreshedTokens.expires_in * 1000,
                  ),
                },
              });

              return {
                ...token,
                accessToken: refreshedTokens.access_token,
                refreshToken: refreshedTokens.refresh_token,
                expiresAt: Math.floor(
                  Date.now() / 1000 + refreshedTokens.expires_in,
                ),
              };
            }
          } catch (error) {
            console.error("Error refreshing access token", error);
            return { ...token, error: "RefreshAccessTokenError" };
          }
        }
      }

      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.error = token.error as string | undefined;
      session.user.id = token.sub as string;
      return session;
    },
  },
  session: {
    strategy: "jwt",
    maxAge: 2 * 365 * 24 * 60 * 60, // 2 years
  },
  jwt: {
    maxAge: 2 * 365 * 24 * 60 * 60, // 2 years
  },
  pages: {
    signIn: "/auth/signin",
    signOut: "/auth/signout",
    error: "/auth/error",
  },
};
