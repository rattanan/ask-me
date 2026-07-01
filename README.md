# Live Question Wall

Live Question Wall is a real-time audience question system for seminars, lectures, workshops, and presentations. Admin users create lectures, share a QR code with the audience, moderate incoming questions, and project an approved-question wall as colorful sticky notes.

The application is designed to be simple, fast, secure, and easy to run without a database. Data is stored in JSON files on the server, while admin access is protected with Google Sign-In and tenant-based authorization.

## Key Features

- Google Sign-In for admin users with NextAuth.js/Auth.js
- Per-admin lecture ownership and tenant isolation
- Public QR-based audience question submission
- Admin-only lecture management dashboard
- Admin-only presentation wall
- Question moderation workflow: `pending`, `approved`, `hidden`, `pinned`
- Real-time wall updates using server-sent events with polling fallback
- JSON file persistence in `data/`
- Input validation, sanitization, and public submission rate limiting
- Clean, responsive, white-first UI built with Tailwind CSS

## Tech Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Tailwind CSS
- NextAuth.js/Auth.js
- Zustand
- Framer Motion
- Zod
- QR code generation
- JSON file storage

## Application Flow

1. An admin signs in with Google.
2. The admin creates a lecture.
3. The system generates a QR code pointing to `/question/{sessionId}`.
4. Audience members scan the QR code and submit questions without logging in.
5. Questions are stored as `pending`.
6. The admin approves, hides, deletes, or pins questions.
7. Approved and pinned questions appear on the admin-only wall at `/admin/lectures/{sessionId}/wall`.

## Security Model

Admin pages and admin APIs require Google authentication.

Protected areas:

- `/admin/*`
- `/api/admin/*`

Public areas:

- `/`
- `/question/{sessionId}`
- `/api/public/session/{sessionId}`
- `/api/public/questions/submit`

Tenant isolation is enforced server-side. Each lecture has an `ownerUserId`, and every admin API request verifies that the authenticated user owns the lecture before returning or mutating data.

Public APIs never expose:

- `ownerUserId`
- admin emails
- all questions
- moderation status for a session
- internal file paths
- hidden questions

## Project Structure

```text
app/
  admin/                  Authenticated admin routes
  api/admin/              Authenticated owner-scoped APIs
  api/auth/               NextAuth route handlers
  api/public/             Safe public APIs
  login/                  Google sign-in page
  question/[sessionId]/   Public audience question form

components/               Shared UI components
features/                 Feature-specific UI and state
lib/                      Auth, storage, validation, utilities
data/                     Server-side JSON storage
types/                    Type declarations
```

## Environment Variables

Create `.env.local` from `.env.example`:

```bash
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXTAUTH_SECRET=
NEXTAUTH_URL=http://localhost:3000
```

Generate a local `NEXTAUTH_SECRET`:

```bash
openssl rand -base64 32
```

## Google OAuth Setup

1. Open Google Cloud Console.
2. Create or select a Google Cloud project.
3. Configure the OAuth consent screen.
4. Create OAuth Client credentials for a Web application.
5. Add this authorized redirect URI for local development:

```text
http://localhost:3000/api/auth/callback/google
```

For LAN testing from another device, also add your private IP callback, for example:

```text
http://192.168.68.106:3000/api/auth/callback/google
```

6. Copy the generated client ID and client secret into `.env.local`.

For production, set `NEXTAUTH_URL` to the deployed application URL and add the matching Google OAuth callback URL:

```text
https://your-domain.com/api/auth/callback/google
```

## Getting Started

Install dependencies:

```bash
npm install
```

Run the development server:

```bash
npm run dev
```

Open the app:

```text
http://localhost:3000
```

For testing with audience devices on the same network, use the network URL shown by Next.js, for example:

```text
http://192.168.68.106:3000
```

## Routes

### Public

| Route | Purpose |
| --- | --- |
| `/` | Public landing page with active lecture QR code |
| `/question/{sessionId}` | Audience question submission form |
| `/api/public/session/{sessionId}` | Safe public lecture metadata |
| `/api/public/questions/submit` | Public question submission endpoint |

### Admin Only

| Route | Purpose |
| --- | --- |
| `/login` | Google sign-in page |
| `/admin` | Admin lecture dashboard |
| `/admin/lectures` | Redirects to admin dashboard |
| `/admin/lectures/new` | Redirects to admin dashboard create form |
| `/admin/lectures/{sessionId}` | Redirects to lecture questions |
| `/admin/lectures/{sessionId}/questions` | Question moderation dashboard |
| `/admin/lectures/{sessionId}/wall` | Presentation wall |
| `/api/admin/*` | Authenticated owner-scoped admin APIs |

## JSON Storage

Data is stored on the server in:

```text
data/users.json
data/sessions.json
data/questions.json
```

These files must stay outside `public/`.

### User

```json
{
  "id": "internal-user-id",
  "googleId": "google-account-id",
  "email": "admin@example.com",
  "name": "Admin Name",
  "image": "https://...",
  "createdAt": "2026-07-01T00:00:00.000Z"
}
```

### Session

```json
{
  "id": "abc123",
  "ownerUserId": "internal-user-id",
  "title": "AI for Everyone",
  "description": "Audience Q&A",
  "presenter": "Presenter Name",
  "date": "2026-07-01",
  "active": true,
  "allowQuestions": true,
  "createdAt": "2026-07-01T00:00:00.000Z",
  "updatedAt": "2026-07-01T00:00:00.000Z"
}
```

### Question

```json
{
  "id": "q123",
  "sessionId": "abc123",
  "name": "Boat",
  "question": "What is RAG?",
  "emoji": "🤔",
  "color": "yellow",
  "status": "pending",
  "createdAt": "2026-07-01T00:00:00.000Z"
}
```

## Quality Checks

Run linting:

```bash
npm run lint
```

Run a production build:

```bash
npm run build
```

## Deployment Notes

- Configure all environment variables in the hosting platform.
- Set `NEXTAUTH_URL` to the production URL.
- Add the production Google OAuth callback URL in Google Cloud Console.
- Ensure the deployed runtime can persist files in `data/`.
- For serverless platforms with ephemeral filesystems, replace JSON file storage with a durable server-side storage adapter before production use.

## Google Cloud Run Demo Deployment

This project is configured for quick Google Cloud Run deployment with a Next.js standalone Docker image.

Cloud Run OAuth callback URL:

```text
https://YOUR_CLOUD_RUN_URL/api/auth/callback/google
```

Add that callback URL to the Google OAuth Client in Google Cloud Console before testing sign-in.

### Authenticate and Configure Project

```bash
gcloud auth login
gcloud config set project YOUR_PROJECT_ID
gcloud services enable run.googleapis.com cloudbuild.googleapis.com
```

### First Deploy

Deploy the service from source:

```bash
gcloud run deploy ask-me \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated \
  --min-instances 1 \
  --max-instances 1
```

Cloud Run should return a service URL. Use that URL as `NEXTAUTH_URL`.

### Set Runtime Environment Variables

```bash
gcloud run services update ask-me \
  --region asia-southeast1 \
  --set-env-vars NEXTAUTH_URL=https://YOUR_CLOUD_RUN_URL,NEXTAUTH_SECRET=YOUR_SECRET,GOOGLE_CLIENT_ID=YOUR_GOOGLE_CLIENT_ID,GOOGLE_CLIENT_SECRET=YOUR_GOOGLE_CLIENT_SECRET
```

After updating environment variables, test:

```text
https://YOUR_CLOUD_RUN_URL
```

## Demo Storage Warning

This Cloud Run setup intentionally uses local JSON files inside the container for demo/prototype use only.

Important limitations:

- Local JSON storage on Cloud Run is temporary.
- Data may be lost when the container restarts.
- Data may be lost when the service is redeployed.
- Data may become inconsistent if the service scales beyond one instance.
- The recommended demo setting is `--max-instances 1` to reduce inconsistency risk.

For production, migrate storage to durable infrastructure such as Google Cloud Storage, Firestore, Cloud SQL, Memorystore/Redis, or another managed database.

## License

Private project.
