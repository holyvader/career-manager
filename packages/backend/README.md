# Career Manager — backend

Elysia (Bun) API: better-auth (email/password auth, email verification, password reset), Prisma/Postgres, emailjs for outgoing mail.

## Development

Bring up Postgres + Mailpit (dev SMTP catcher):

```bash
docker compose -f ../../docker-compose.yml up -d db mailpit
```

Then, from this directory:

```bash
bun install
bun run prisma:migrate:deploy
bun run dev
```

The server listens on **http://localhost:3334**. Mailpit's web UI (for viewing sent emails in dev) is at http://localhost:8025.

The backend loads `.env` from the repository root. For local Mailpit, use:

```dotenv
SMTP_HOST=localhost
SMTP_PORT=1025
SMTP_USER=
SMTP_PASSWORD=
SMTP_TLS=false
SMTP_SSL=false
```

Restart the backend after changing these settings. Mailpit captures messages for
viewing in its web UI; it does not deliver them to external inboxes. Existing
process environment variables take precedence over `.env` values.

## Scripts

See `package.json` for the full list - `prisma:*` scripts wrap the Prisma CLI, `lint`/`format`/`check` wrap Biome.

## OpenAPI docs

Once running, interactive API docs are served at http://localhost:3334/openapi.

## Source organization

`src/domains` groups API code by `auth`, `users`, `job-offers`, and `tags`.
Each domain keeps its controller, service, repository, and request schemas together:

- Controllers define routes, validate HTTP input, and map service failures to responses.
- Services implement application rules, ownership checks, and event logging.
- Repository interfaces define persistence operations; `adapters/prismaRepository.ts`
  implements them and translates provider-specific failures such as duplicate tags.
- `application.ts` wires production adapters into service factories. Tests can supply
  in-memory implementations without importing the database or network clients.

Job-board HTTP/DNS access lives in `domains/job-offers/adapters/jobBoardContentSource.ts`
behind the `JobOfferContentSource` interface. HTML extraction remains in `importing`.
SMTP lives in `email/adapters/smtpMailSender.ts` behind `MailSender`; authentication
receives that adapter through its application wiring and retains Better Auth's
Prisma persistence adapter. Services receive logging through the `Logger` interface.
Repository contracts reuse generated model types only as compile-time data shapes;
Prisma queries and runtime errors stay inside the adapters.
Shared rate limiting and service failures live in `src/shared`; integration-test
helpers live in `src/testing`. `src/routes` only composes controllers, and
`edenApp.ts` assembles the API while preserving Eden's inferred client types.
Existing endpoint paths remain unchanged, including `/me/offers` and `/offers/import`.

Run `bun test` from this directory. Route tests require the local database with
migrations applied; start `db` and `mailpit` using the development commands above.
