# Live Question Wall

A live audience Q&A app built with Next.js 16, React 19, TypeScript and Tailwind CSS. Presenters sign in with Google, create lectures, share QR codes, moderate questions, and project a sticky-note wall.

## MySQL + Docker

All runtime users, lectures and questions are stored in MySQL 8.4 using `mysql2`. Docker Compose provides MySQL with a persistent named volume and an optional app container. The app no longer reads or writes JSON storage.

1. Copy `.env.example` to `.env` if you do not already have an environment file.
2. Set Google OAuth credentials, `NEXTAUTH_SECRET`, `MYSQL_PASSWORD` and `MYSQL_ROOT_PASSWORD`. Generate secrets with `openssl rand -hex 32`.
3. Start the database and optionally import existing JSON:

```bash
npm install
docker compose up -d mysql
npm run db:migrate-json
npm run dev
```

The migration imports all three files in `data/` in one transaction, keeps their IDs and relationships, and preserves the original files. It requires empty destination tables and rolls back on failure. Skip migration for a fresh installation. It does not download data from Google Cloud Storage; export any separately deployed data into these JSON files first.

For the full Docker stack:

```bash
docker compose up -d --build
```

Open http://localhost:3000. Google OAuth callback: `http://localhost:3000/api/auth/callback/google`. For a public deployment, configure `NEXTAUTH_URL` and the corresponding Google callback for that domain.

The schema in `docker/mysql/001-schema.sql` initializes on the first start of a fresh MySQL volume. The app container connects to `mysql:3306`; local development connects to `127.0.0.1:3306`. Compose reads `.env`, while Next.js also supports `.env.local` (which takes precedence locally). Keep shared settings in `.env` to avoid mismatched credentials.

`docker compose down` preserves the database volume. `docker compose down -v` deletes it. Back up MySQL before replacing volumes. Existing Cloud Run deployments need network access to a durable MySQL service; this local Compose change does not deploy to the public website automatically.

## AI insights by lecture

On `/admin`, every lecture has a **Generate AI Insight** button. Clicking it opens a dialog and analyzes all questions belonging to that lecture, including pending, approved, hidden and pinned questions. Authorization checks the lecture owner before retrieving data or calling AI. A per-lecture MySQL lock prevents concurrent generation, including across app instances.

The results include:

- Top 10 question submitter names, descending by question count. Names are normalized and combined case-insensitively; anonymous questions are shown separately. These are self-reported names, not verified user identities.
- Top 10 primary question categories, ordered by exact assigned-question counts. Each question must be classified exactly once. Percentages use all questions in the lecture, including categories outside the top 10.
- A Thai summary, interesting findings, recommended follow-up actions, and clickable supporting questions.
- Hover/click animations, animated chart bars, loading/error/empty states, keyboard-accessible dialog and reduced-motion support.

Configure the existing OpenAI-compatible service on the server:

```dotenv
OPENAI_API_URL=https://api.openai.com/v1
OPENAI_API_KEY=
OPENAI_MODEL=gpt-4o-mini
```

`OPENAI_API_URL` accepts a base URL ending in `/v1` or the full `/chat/completions` endpoint. The service must support Chat Completions JSON mode (`response_format: { type: "json_object" }`). Responses are validated with Zod, including complete category coverage and valid evidence IDs. No fabricated report is shown when the provider fails or returns invalid data.

Only question IDs and text are sent to the configured provider, not participant names or account details. Questions are processed in batches of 60 without sampling; multiple batch reports are consolidated. The request has a 280-second timeout. Large lectures can exceed the provider's context limit or timeout; failure is reported rather than displaying partial coverage. Results are held in the open dialog, and can be generated again; they are not persisted. The lecture's question list refreshes in the dialog so changed inputs can be marked as stale.

## Structure

- `app/`: public pages, owner-protected admin pages and APIs.
- `features/admin/`: lecture cards, moderation and AI analytics dialog.
- `features/questions/`, `features/wall/`: submission and presentation wall.
- `lib/db.ts`, `lib/storage.ts`: connection pool, transactions and owner-scoped queries.
- `lib/insights.ts`: AI batching, validation and report assembly.
- `docker/mysql/`: database schema.
- `scripts/migrate-json.ts`: atomic import of legacy data.

## Verification

```bash
npm run lint
npm run build
npm test
MYSQL_INTEGRATION=1 node --import tsx --test tests/mysql.test.ts
node --import tsx scripts/check-ai.ts
# With npm run dev running locally and Chrome installed:
node --import tsx scripts/check-ui.ts
```

The MySQL integration test creates and removes its own temporary records. The AI smoke test sends four synthetic questions to your configured AI service. The wall continues to use server-sent events plus polling. Public submissions retain validation, sanitization and a process-local ten-second rate limit per IP and lecture.

## ntop deployment (PM2 + Nginx)

In `/opt/apps/ask-me`, configure `.env` with `MYSQL_PORT=3308` and
`NEXTAUTH_URL=https://ask-me.rattanan.dev`. Keep secrets out of Git.

```bash
git pull --ff-only origin main
npm ci
docker compose up -d mysql
# First migration only, with empty destination tables:
npm run db:migrate-json
npm run build
pm2 startOrReload ecosystem.config.cjs --update-env
pm2 save
sudo bash deploy/setup-https.sh
```

The app listens on loopback port 3012. Nginx allows long AI requests and disables buffering for wall events. The HTTPS setup preserves an existing site configuration on repeat runs. Add `https://ask-me.rattanan.dev/api/auth/callback/google` to the Google OAuth client's authorized redirect URIs.
