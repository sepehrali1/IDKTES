# SSBLOX

SSBLOX is a Persian RTL community library for **educational Luau snippets made for Roblox Studio projects**. The current application uses a React/Vite frontend and an Express API backed by a local JSON file.

## Requirements

- Node.js 20.19 or newer
- npm
- A host that can run a persistent Node.js process and provide persistent disk storage

## Local setup

1. Copy `.env.example` to `.env`, or append its required API variables to your existing `.env` without deleting any settings you still use.
2. Generate two different random secrets (for example with `node -e "console.log(require('node:crypto').randomBytes(48).toString('base64url'))"`) and replace `JWT_SECRET` and `OWNER_BOOTSTRAP_KEY`. Each must be long and unpredictable; never commit `.env`.
3. If you want to keep accounts from your previous local version, back up its `server/data/db.json` first and restore it to the same path after extracting this source. The download intentionally excludes database files and `.env` because they can contain private account data and credentials.
4. Run `npm install`.
5. Run `npm run dev`.
6. Open the Vite address printed in the terminal.
7. If the restored database does not already contain an owner, create the first owner by registering once and entering the `OWNER_BOOTSTRAP_KEY` in the optional owner-setup field. Normal registrations must leave that field empty.
8. After the owner is created, remove or rotate `OWNER_BOOTSTRAP_KEY` on the server.

## Scripts

- `npm run dev` starts the frontend and API.
- `npm run build` checks the frontend TypeScript and creates the Vite production build.
- `npm run typecheck` checks frontend, API and Vite configuration types.
- `npm run lint` runs ESLint.
- `npm run start` starts the API and, when `dist/` exists, serves the built frontend on the same origin.

## Important deployment notes

- The active app uses the Express API and `server/data/db.json`. The Supabase variables from older experiments are not used by the active authentication or content routes. For a single-origin deployment, run `npm run build` and then `npm run start`; the Express server serves both the API and the generated frontend. A static-only deployment will not run this API.
- The JSON database is suitable only for a small single-process project. For a public production service, migrate the database layer to PostgreSQL/Supabase or another managed database, use shared rate-limit storage, backups and monitoring, and keep the database on persistent storage.
- Set `SSBLOX_DB_PATH` to a persistent disk path on the host. Do not use ephemeral serverless storage for user accounts or content.
- The API uses bearer tokens kept in browser storage for compatibility with the existing frontend. This is still exposed to successful same-origin XSS; a production deployment should migrate to secure `HttpOnly`, `Secure`, `SameSite` cookies and CSRF protection.
- Put the API behind HTTPS and a reverse proxy. Set `TRUST_PROXY=1` only when the app is actually behind a trusted proxy.
- Keep `.env`, `server/data/db.json` and database backups private. They may contain authentication secrets or personal account data.

## Community content rules

Only share code intended for legitimate development in your own Roblox Studio experiences. Do not upload exploits, cheats, anti-cheat bypasses, credential theft, malicious code or content designed to harm other users or services. New posts from ordinary users remain pending until a moderator approves them.
