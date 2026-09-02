# Career Manager — frontend

Next.js (App Router) app. Talks to the `packages/backend` Elysia API via Eden Treaty (`@elysiajs/eden`) - there is no local API route handling auth; all of it lives in the backend.

## Development

The backend (`packages/backend`) must be running first - see its README. Then, from this directory:

```bash
bun install
bun run dev
```

Open http://localhost:3333 with your browser. By default the app talks to the backend at `http://localhost:3334`; override with `NEXT_PUBLIC_BACKEND_URL` if needed.

## Scripts

`build`/`start` for a production build, `lint`/`format` wrap Biome.
