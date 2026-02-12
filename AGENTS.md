# OpenInvite Agent Notes

This file guides agentic coding in this repository.

## Commands

Use pnpm.

- Dev server: `pnpm dev`
- Build: `pnpm build`
- Start prod server: `pnpm start`
- Lint: `pnpm lint`

Database / Drizzle:

- Generate migration: `pnpm db:generate`
- Push schema: `pnpm db:push`
- Studio: `pnpm db:studio`

Tests:

- No test framework is configured in this repo.
- There is no single-test command yet. If tests are added, document the runner
  and single-test syntax here.

## Env

Required for Turso / Drizzle:

- `TURSO_DATABASE_URL` (libsql URL)
- `TURSO_AUTH_TOKEN` (database auth token)

Notes:

- `drizzle.config.ts` loads `.env.local` and `.env` from repo root.
- Drizzle uses `dialect: "turso"`.

## Project Structure

- `src/app`: Next.js App Router routes, layouts, and pages.
- `src/db`: Drizzle schema and client.
- `src/lib`: auth + session helpers.
- `drizzle/`: SQL migrations.

## Code Style

General:

- TypeScript strict mode is enabled (`tsconfig.json`).
- Use double quotes for strings.
- Use semicolons.
- Prefer `const` over `let` unless reassigned.
- Keep code ASCII unless file already uses Unicode.

Imports:

- Prefer absolute imports via `@/*` (see `tsconfig.json` paths).
- Group imports: external libs first, then internal (`@/`), then relative.
- Keep import order stable and avoid unused imports.

Formatting:

- No dedicated formatter config; follow existing file style.
- Tailwind classes are inline; keep them readable and avoid excessive nesting.

Naming:

- Components: `PascalCase`.
- Hooks: `useSomething`.
- Files: `kebab-case` for folders, `PascalCase.tsx` for components when needed.
- Database tables: `snake_case` column names in Drizzle schema.

Types:

- Prefer explicit types for public function params/returns in shared libs.
- Use union types for enums (e.g., status), and constrain at the DB layer when
  possible.

Error handling:

- API routes return `NextResponse.json` with an `error` string and status code.
- Use 400 for validation, 401 for auth failures, 409 for conflicts.
- Avoid leaking sensitive details in error responses.

## Frontend Conventions

- Next.js App Router (React Server Components by default).
- Add "use client" at the top of client components.
- Use `next/navigation` for client routing (`useRouter`).
- Prefer `redirect()` for server-side redirects.

UI:

- Tailwind v4 utilities are used; design is bold and high-contrast.
- Reuse palette variables in `globals.css`.
- Keep layouts responsive: check mobile breakpoints.
- No emojis in UI; use SVG icons only.

## Backend / API

Runtime:

- Auth routes use `export const runtime = "nodejs"` (argon2 requires Node).

Auth:

- Password hashing uses argon2id (`src/lib/auth.ts`).
- Sessions stored in `sessions` table with a cookie token.
- Cookie name: `openinvite_session`.

Session helpers:

- `createSession`, `setSessionCookie`, `clearSessionCookie` in `src/lib/session.ts`.
- `getSessionUserByToken` for server components (e.g. dashboard).

## Database / Drizzle

- Schema lives in `src/db/schema.ts`.
- Client in `src/db/client.ts` uses `@libsql/client`.
- Migrations are generated into `drizzle/`.

Current tables:

- `users` (id, email, password_hash, display_name, created_at)
- `sessions` (id, user_id, token, created_at, expires_at)

## Security Notes

- Do not commit `.env` or secrets.
- Rotate tokens if exposed.
- Ensure cookies are `httpOnly` and `secure` in production.

## Missing Rules

- No `.cursor` or Copilot instructions found.
- No tests configured.
