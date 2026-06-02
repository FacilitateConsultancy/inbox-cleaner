import type { NextAuthConfig } from "next-auth";
import MicrosoftEntraID from "next-auth/providers/microsoft-entra-id";

// Microsoft's consumer accounts (Hotmail/Outlook.com) use the string
// "consumers" in the authorization/token URLs, but the iss claim in returned
// JWTs always contains the real consumer-tenant GUID below. We must use the
// GUID in the issuer URL so the OIDC issuer check passes.
// Work/school accounts: set AZURE_AD_TENANT_ID to your directory (tenant) GUID.
const CONSUMER_TENANT_GUID = "9188040d-6c67-4c5b-b112-36a304b66dad";
const rawTenant = process.env.AZURE_AD_TENANT_ID ?? "consumers";
const tenantId =
  rawTenant === "consumers" ? CONSUMER_TENANT_GUID : rawTenant;
const issuer = `https://login.microsoftonline.com/${tenantId}/v2.0`;

export const authConfig: NextAuthConfig = {
  providers: [
    MicrosoftEntraID({
      clientId: process.env.AZURE_AD_CLIENT_ID!,
      clientSecret: process.env.AZURE_AD_CLIENT_SECRET!,
      issuer,
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
