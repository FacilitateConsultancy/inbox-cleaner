import type { NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";
import Google from "next-auth/providers/google";

const CONSUMER_TENANT_GUID = "9188040d-6c67-4c5b-b112-36a304b66dad";
const rawTenant = process.env.AZURE_AD_TENANT_ID ?? "consumers";
const isCommon = rawTenant === "common";
const tenantId = rawTenant === "consumers" ? CONSUMER_TENANT_GUID : rawTenant;
const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;

async function refreshMicrosoftToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: number } | null> {
  const tid = isCommon ? "common" : tenantId;
  try {
    const res = await fetch(`https://login.microsoftonline.com/${tid}/oauth2/v2.0/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     process.env.AZURE_AD_CLIENT_ID!,
        client_secret: process.env.AZURE_AD_CLIENT_SECRET!,
        grant_type:    "refresh_token",
        refresh_token: refreshToken,
        scope:         "openid profile email offline_access Mail.Read Mail.ReadWrite",
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      accessToken: data.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
    };
  } catch {
    return null;
  }
}

async function refreshGoogleToken(refreshToken: string): Promise<{ accessToken: string; expiresAt: number } | null> {
  try {
    const res = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id:     process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        grant_type:    "refresh_token",
        refresh_token: refreshToken,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return {
      accessToken: data.access_token,
      expiresAt: Math.floor(Date.now() / 1000) + (data.expires_in ?? 3600),
    };
  } catch {
    return null;
  }
}

export const authConfig: NextAuthConfig = {
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      ...(isCommon ? {} : { issuer }),
      authorization: {
        params: {
          scope: "openid profile email offline_access Mail.Read Mail.ReadWrite",
        },
      },
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorization: {
        params: {
          scope: "openid profile email https://mail.google.com/",
          access_type: "offline",
          prompt: "consent",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      // On first sign-in, store tokens and expiry
      if (account) {
        return {
          ...token,
          accessToken:  account.access_token,
          refreshToken: account.refresh_token,
          expiresAt:    account.expires_at ?? Math.floor(Date.now() / 1000) + 3600,
          provider:     account.provider,
        };
      }

      // Token still valid — return as-is
      const expiresAt = token.expiresAt as number ?? 0;
      if (Date.now() / 1000 < expiresAt - 60) return token;

      // Token expired — attempt refresh
      const refreshToken = token.refreshToken as string | undefined;
      if (!refreshToken) return { ...token, error: "RefreshTokenMissing" };

      const provider = token.provider as string;
      const refreshed = provider === "google"
        ? await refreshGoogleToken(refreshToken)
        : await refreshMicrosoftToken(refreshToken);

      if (!refreshed) return { ...token, error: "RefreshTokenExpired" };

      return {
        ...token,
        accessToken: refreshed.accessToken,
        expiresAt:   refreshed.expiresAt,
        error:       undefined,
      };
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      session.provider    = token.provider    as string | undefined;
      // Surface token errors so the client can prompt re-login
      if (token.error) session.error = token.error as string;
      return session;
    },
  },
  pages: { signIn: "/" },
};
