# Inbox Cleaner

A Next.js 16 app that connects to your Outlook / Hotmail inbox via **Microsoft Graph API**, groups emails by sender, and lets you bulk-delete entire sender threads with a confirmation step before anything is touched.

---

## Quick start

```bash
# 1. Install dependencies (already done if you followed setup)
npm install

# 2. Copy the env template
cp .env.local.example .env.local

# 3. Fill in the Azure credentials (see below), then generate a secret:
openssl rand -base64 32   # paste as AUTH_SECRET in .env.local

# 4. Run
npm run dev
# → http://localhost:3000
```

---

## Azure App Registration (step by step)

### 1. Create the app

1. Open [portal.azure.com](https://portal.azure.com) and sign in.
2. Search for **"App registrations"** → **New registration**.
3. Fill in:
   - **Name:** `Inbox Cleaner`
   - **Supported account types:** *Personal Microsoft accounts only*
   - **Redirect URI:** `Web` → `http://localhost:3000/api/auth/callback/microsoft-entra-id`
4. Click **Register**.

### 2. Copy your Client ID

On the app overview page, copy **Application (client) ID** → paste as `AZURE_AD_CLIENT_ID`.  
Leave `AZURE_AD_TENANT_ID=consumers` for personal Outlook/Hotmail accounts.

### 3. Create a client secret

1. Left sidebar → **Certificates & secrets** → **Client secrets** → **New client secret**.
2. Set any description and expiry (24 months recommended).
3. **Immediately copy the Value** (shown only once) → paste as `AZURE_AD_CLIENT_SECRET`.

### 4. Add API permissions

1. Left sidebar → **API permissions** → **Add a permission** → **Microsoft Graph** → **Delegated permissions**.
2. Add:
   - `Mail.Read`
   - `Mail.ReadWrite` ← required for deletion
   - `offline_access` ← for token refresh
3. Click **Add permissions**. Consent is prompted at first sign-in.

---

## Environment variables

| Variable | Description |
|---|---|
| `AZURE_AD_CLIENT_ID` | App registration → Application (client) ID |
| `AZURE_AD_CLIENT_SECRET` | Client secret value |
| `AZURE_AD_TENANT_ID` | `consumers` for personal accounts, or your tenant GUID |
| `AUTH_SECRET` | Random secret (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | Base URL, e.g. `http://localhost:3000` |

---

## How it works

| Step | What happens |
|---|---|
| **Scan** | Fetches up to 2,000 inbox messages via Graph API (paginated, 100/page) |
| **Group** | Groups by sender email address, sorted by message count |
| **Review** | Toggle each sender as **Keep** or **Remove** (or bulk-decide all undecided) |
| **Confirm** | Full list of senders + email counts shown before anything is deleted |
| **Delete** | Batch DELETE requests to Graph API (20 per batch) |

---

## Tech stack

- **Next.js 16** — App Router, React Server Components
- **TypeScript** + **Tailwind CSS v4**
- **NextAuth.js v5** — OAuth with Microsoft Entra ID provider
- **Microsoft Graph API** — paginated inbox fetch + `$batch` delete
