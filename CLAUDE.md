# Daman Insurance Management Platform - AI Assistant Context (CLAUDE.md)

This file contains metadata, architecture overview, build/test commands, and references to help Antigravity and other AI coding assistants instantly understand the project.

---

## 🛠️ Tech Stack & Architecture

- **Framework:** Next.js (App Router v16+) with path-based internationalization (`[locale]`).
- **Styling:** Tailwind CSS v4 (class-based themes) defined in `app/globals.css`.
- **Database:** Neon PostgreSQL serverless database.
- **Authentication:** Custom JWT-based session mechanism (`lib/auth-utils.ts`) with custom PBKDF2 password hashing (matching a dual-user model where profiles are synchronized between `auth.users` metadata and the `public.profiles` table).

---

## 🔑 Environment Variables & Secrets

All secrets are located in your local `.env.local` file (which is git-ignored and not committed). Ensure these variables are set in your local environment and in Vercel:

- `DATABASE_URL`: The Neon PostgreSQL connection string (contains DB credentials).
- `JWT_SECRET`: Secret key for signing JWT session tokens.
- `NEXT_PUBLIC_SUPABASE_URL`: Mock URL for client configuration compatibility.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Mock anonymous key.
- `SUPABASE_SERVICE_ROLE_KEY`: Mock service role key.

---

## 👥 Seeded Test Credentials

These test credentials exist in the PostgreSQL database for local development and testing:

| Role | Email | Password | Details |
| :--- | :--- | :--- | :--- |
| **Super Admin** | `superadmin@daman.dz` | `SuperAdmin123!` | Manages users, status toggling, dashboard |
| **Company Admin (SAA)** | `admin.saa@daman.dz` | `Company123!` | SAA insurer administrator |
| **Company Admin (CAAT)** | `admin.caat@daman.dz` | `Company123!` | CAAT insurer administrator |
| **Company Agent (SAA)** | `agent.saa@daman.dz` | `Agent123!` | Underwrites policies for SAA |
| **Client 1** | `client1@daman.dz` | `Client123!` | Policyholder |
| **Client 2** | `client2@daman.dz` | `Client123!` | Policyholder |
| **Client (Generic)** | `client@daman.dz` | `Test1234!` | General client account |
| **Company Admin (Generic)**| `company@daman.dz` | `Test1234!` | Generic administration account |
| **Assessor** | `assessor@daman.dz` | `Test1234!` | Claims validation professional |
| **Broker** | `broker@daman.dz` | `Test1234!` | Independent broker agent |
| **Broker (Test)** | `new-broker-test@daman.dz` | `Test1234!` | Validation and testing broker |

---

## 🎨 Theme Palette (Greens & Sages)

Tailwind CSS v4 custom variables configure the light, dark, and night modes.
The primary palette tokens are:
- Dark Forest Sage: `#778873`
- Soft Sage Green: `#A1BC98`
- Warm Cream: `#DCCFC0`
- Light Alabaster Beige: `#FDF6ED`

*Note:* React hydration mismatches on client theme switches are bypassed via `suppressHydrationWarning` on the `<body>` element inside `app/[locale]/layout.tsx`.

---

## 🚀 Key Commands

### Development
```bash
npm run dev
```

### Seeding database
```bash
node lib/seed-users.js
node lib/seed-test-accounts.js
```

### Build & Linting
```bash
npm run build
npm run lint
```
