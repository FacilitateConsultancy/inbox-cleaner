import type { NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

// "consumers" → personal Hotmail/Outlook.com accounts only (uses real GUID for issuer check)
// "common"    → personal + work/school accounts (issuer varies per tenant, so we skip strict check)
// any GUID    → single specific tenant
const CONSUMER_TENANT_GUID = "9188040d-6c67-4c5b-b112-36a304b66dad";
const rawTenant = process.env.AZURE_AD_TENANT_ID ?? "consumers";

const isCommon = rawTenant === "common";
const tenantId = rawTenant === "consumers" ? CONSUMER_TENANT_GUID : rawTenant;
const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;

export const authConfig: NextAuthConfig = {
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      // With "common", skip issuer check — each org returns its own tenant GUID
      ...(isCommon ? {} : { issuer }),
      authorization: {
        params: {
          scope:
            "openid profile email offline_access Mail.Read Mail.ReadWrite",
        },
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account }) {
      if (account) {
        token.accessToken = account.access_token;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      return session;
    },
  },
  pages: {
    signIn: "/",
  },
};
