import { NextAuthOptions } from "next-auth";
import AzureADProvider from "next-auth/providers/azure-ad";

export const authOptions: NextAuthOptions = {
  providers: [
    AzureADProvider({
      id: "azure-ad",
      name: "Azure AD",
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      tenantId: process.env.AZURE_AD_TENANT_ID,
      authorization: {
        params: {
          scope:
            "openid profile email User.Read Files.Read Files.Read.All Sites.Read.All offline_access",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, trigger }) {
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.expiresAt = account.expires_at;
      }

      // Check if the token is expired and refresh it
      if (trigger === "update" && token.expiresAt) {
        const expiresAt = token.expiresAt as number;
        if (Date.now() > expiresAt * 1000) {
          try {
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
                  refresh_token: token.refreshToken as string,
                }),
              },
            );

            const refreshedTokens = await response.json();

            if (!response.ok) throw refreshedTokens;

            return {
              ...token,
              accessToken: refreshedTokens.access_token,
              refreshToken: refreshedTokens.refresh_token ?? token.refreshToken,
              expiresAt: Math.floor(
                Date.now() / 1000 + refreshedTokens.expires_in,
              ),
            };
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
      return session;
    },
  },
  session: {
    maxAge: 365 * 24 * 60 * 60, // 1 year
  },
};
