# McWilliams Media — Strategic Proposal & Onboarding Ecosystem

## Project Overview

A premium AI-driven proposal and client onboarding platform for McWilliams Media, a high-end digital agency. The system allows admins to create cinematic proposals with Gemini AI content generation, and clients to view and digitally sign those proposals through an immersive portal.

## Architecture

### Monorepo Structure

```
artifacts/
  api-server/       — Express API server (port 8080, proxied at /api)
  mcw-proposals/    — React+Vite frontend (port 23919, proxied at /)
lib/
  api-spec/         — OpenAPI spec + codegen config
  api-client-react/ — Generated React Query hooks (from codegen)
  api-zod/          — Generated Zod validation schemas (from codegen)
  db/               — Drizzle ORM schema + migrations (PostgreSQL)
  integrations-gemini-ai/ — Gemini AI client wrapper
```

### Tech Stack

- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion
- **Auth**: Clerk (Google Sign-in + email) — all `/admin/*` routes protected; client portals are public. Team accounts invited: matt@, tiffany@, elise@, rachelle@, info@ (all @mcwilliamsmedia.com)
- **Backend**: Express.js, TypeScript, Drizzle ORM
- **Database**: PostgreSQL (Replit-managed)
- **AI**: Google Gemini via Replit AI Integrations (`gemini-2.5-flash`)
- **API Contract**: OpenAPI 3.0 spec → codegen → Zod schemas + React Query hooks

## Key Features

1. **Landing Page** (`/`) — Cinematic dark hero with "Access Portal" CTA
2. **Admin Dashboard** (`/admin`) — Stats grid + searchable proposals table
3. **Proposal Builder** (`/admin/proposals/new`) — AI-assisted content generation via Gemini
4. **Proposal Editor** (`/admin/proposals/:id/edit`) — Edit existing proposals
5. **Client Portal** (`/proposal/:uuid`) — Immersive, unauthenticated cinematic experience
   - Markdown content rendering (react-markdown + remark-gfm)
   - Loom/YouTube and Calendly embed support
   - **Tiered Marketing Proposal** (`projectType: "tiered"`): interactive 3-tier plan selection; accept navigates directly to contract signing
   - **Ala Carte Marketing Proposal** (`projectType: "ala-carte"`): service picker; accept saves service IDs + navigates to contract signing
   - **One-step flow**: accepting any proposal immediately redirects to `/contract/:contractUuid` — proposal + contract = one seamless client journey
6. **Onboarding Pipeline** (`/admin/onboarding`) — Post-signature onboarding steps
7. **Proposals & Contracts** (`/admin/contracts`) — Combined proposal+contract management
   - Every new proposal auto-creates a linked draft contract (50% deposit default)
   - Contract stays in sync with proposal (client info, totals) while in draft status
   - Admin edits contract details via "Edit Contract Details →" on proposal edit page
   - Public 3-step signing flow (`/contract/:uuid`):
     - Step 1: Full Development Agreement text with fee breakdown + signature pad
     - Step 2: Referral details (how they met, who they worked with)
     - Step 3: Business address information
   - Schedule A (scope of work) per contract
   - Hosting options: None / Basic ($50/mo) / Platinum ($100/mo)

## API Endpoints

- `GET /api/healthz` — Health check
- `GET /api/proposals` — List proposals
- `POST /api/proposals` — Create proposal
- `GET /api/proposals/:uuid` — Get proposal by UUID (public)
- `PATCH /api/proposals/:uuid` — Update proposal
- `DELETE /api/proposals/:uuid` — Delete proposal
- `POST /api/proposals/generate` — AI content generation via Gemini
- `POST /api/proposals/:uuid/accept` — Accept/sign proposal (public)
- `POST /api/proposals/:uuid/view` — Record view event (public)
- `GET /api/admin/stats` — Dashboard stats
- `POST /api/gemini/chat` — Gemini chat endpoint
- `POST /api/gemini/image` — Gemini image analysis endpoint
- `GET /api/contracts` — List contracts (filter by status)
- `POST /api/contracts` — Create contract
- `GET /api/contracts/:uuid` — Get contract by UUID (public)
- `PATCH /api/contracts/:uuid` — Update contract
- `DELETE /api/contracts/:uuid` — Delete contract
- `POST /api/contracts/:uuid/send` — Mark contract as sent
- `POST /api/contracts/:uuid/sign` — Client signs contract (public)

## Database Schema

### `contracts` table
- `id` (serial PK), `uuid` (public-facing)
- `proposalId` (optional FK to proposal UUID), `clientName`, `businessName`, `clientEmail`
- `contractType` (website/marketing/print/tiered)
- `totalCost`, `depositAmount`, `remainingBalance` (numeric)
- `hostingOption` (none/basic/platinum)
- `status` (draft/sent/signed)
- `signatureData` (base64 PNG), `signedAt`
- `referralSource`, `teamMember` — collected during signing
- `companyAddress`, `companyAddressLine2`, `companyCity`, `companyState`, `companyZip`
- `scheduleA` (scope of work text)
- `createdAt`, `updatedAt`

### `proposals` table
- `id` (serial PK), `uuid` (public-facing), `clientName`, `clientEmail`
- `title`, `content` (markdown), `status` (draft/sent/viewed/accepted)
- `signatureDataUrl`, `signedAt`, `viewedAt`, `sentAt`
- `loomUrl`, `calendlyUrl`, `value` (numeric)
- `selectedTier` (pro/plus/platinum) — set when client accepts a tiered proposal
- `createdAt`, `updatedAt`

### `conversations` table
- `id`, `proposalId` (FK), `createdAt`

### `messages` table
- `id`, `conversationId` (FK), `role` (user/assistant), `content`, `createdAt`

## Environment Variables

- `DATABASE_URL` — PostgreSQL connection string (Replit-managed)
- `SESSION_SECRET` — Express session secret
- `CLERK_SECRET_KEY` — Clerk backend key
- `CLERK_PUBLISHABLE_KEY` — Clerk publishable key
- `VITE_CLERK_PUBLISHABLE_KEY` — Clerk key for frontend
- `AI_INTEGRATIONS_GEMINI_BASE_URL` — Gemini AI proxy base URL
- `AI_INTEGRATIONS_GEMINI_API_KEY` — Gemini AI proxy key

## Codegen

To regenerate API client code after editing `lib/api-spec/openapi.yaml`:

```bash
pnpm --filter @workspace/api-spec run codegen
```

## Development

Workflows are managed by Replit:
- **API Server**: `pnpm --filter @workspace/api-server run dev`
- **Web Frontend**: `pnpm --filter @workspace/mcw-proposals run dev`

## Notes

- The `@google/genai` package is intentionally NOT in the esbuild externals list — it bundles fine and is only installed in `lib/integrations-gemini-ai`
- Proposals use a `uuid` column as the public-facing identifier (not the serial `id`)
- Clerk proxy middleware handles auth header forwarding from frontend to API
