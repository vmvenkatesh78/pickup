# pickup 🏐

The simplest way to organize and join pickup sports games. No login. No app download. Just create, share, and play.

> Built for the [DEV Weekend Challenge](https://dev.to/challenges/weekend-2026-02-28) — "Build for Your Community"

## The problem

Coordinating pickup sports happens through scattered WhatsApp groups where messages get buried, nobody confirms until game time, and plans fall apart at the last minute. There's no single place to see what's happening, who's in, and whether there's space.

## The solution

Create a game in 30 seconds, share the link on WhatsApp, and people join with just their name. Live player count, auto-close when full, and a browse page to discover games nearby.

## Features

- **Create a game** — pick a sport, set time/place/max players, get a shareable link
- **Join with zero friction** — no login, no signup, just your name
- **Real-time player list** — see who's in and how many spots are left, live
- **WhatsApp sharing** — one-tap share with a pre-filled invite message
- **Browse games** — discover upcoming games, filter by sport
- **Mobile-first** — designed for the phone in your pocket, not a desktop monitor

## Tech stack

- **React 19 + TypeScript** — UI framework
- **Vite** — build tool
- **Tailwind CSS v4** — styling
- **Supabase** — Postgres database + real-time subscriptions
- **Lucide React** — icons
- **Vercel** — deployment

## Getting started

### Prerequisites

- Node.js 18+
- A [Supabase](https://supabase.com) account (free tier works fine)

### Setup

```bash
# 1. Clone and install
git clone https://github.com/vmvenkatesh78/pickup.git
cd pickup
npm install

# 2. Create a Supabase project at supabase.com
#    Go to Project Settings > API to get your URL and anon key

# 3. Set up your environment
cp .env.example .env
# Edit .env with your Supabase URL and anon key

# 4. Run the database migration
#    Open Supabase Dashboard > SQL Editor
#    Paste the contents of supabase/schema.sql and run it

# 5. Enable real-time
#    Supabase Dashboard > Database > Replication
#    Toggle ON for the "players" table

# 6. Start the dev server
npm run dev
```

The app will be running at `http://localhost:5173`.

### Deploying to Vercel

```bash
# Push to GitHub, then:
# 1. Import the repo in Vercel
# 2. Add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY as env vars
# 3. Deploy — that's it
```

## Project structure

```
src/
├── pages/           # One component per route (Home, Create, Game, Browse)
├── components/      # Shared UI (Layout)
├── lib/             # Supabase client, API queries, utilities
└── types/           # TypeScript types (mirrors DB schema)

supabase/
└── schema.sql       # Database tables, indexes, RLS policies, real-time config
```

For detailed architecture decisions, see [ARCHITECTURE.md](./ARCHITECTURE.md).

## Scripts

| Command          | What it does                         |
|------------------|--------------------------------------|
| `npm run dev`    | Start Vite dev server with HMR       |
| `npm run build`  | Production build to `dist/`          |
| `npm run preview`| Preview the production build locally |
| `npm run lint`   | Run ESLint                           |

## License

MIT
