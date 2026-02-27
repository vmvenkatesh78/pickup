# Architecture

A quick guide to how pickup is built and why things are the way they are.

## What this is

A web app for organizing pickup sports games. Someone creates a game, gets a shareable link, sends it via WhatsApp, and people join with just their name. No accounts, no app download.

Built for the [DEV Weekend Challenge](https://dev.to/challenges/weekend-2026-02-28) (Feb 27 – Mar 2, 2026). The constraint is 3 days — scope decisions reflect that.

## Tech stack

| Layer      | Choice            | Why                                                      |
|------------|-------------------|----------------------------------------------------------|
| Framework  | React + TypeScript| Daily driver — fast execution with type safety           |
| Build      | Vite              | Instant HMR, fast builds, zero config headaches          |
| Styling    | Tailwind CSS v4   | Utility-first, mobile-first by default, no CSS files     |
| Backend/DB | Supabase          | Postgres + REST API + real-time in one service, free tier |
| Hosting    | Vercel            | One-click deploy from GitHub, free tier                  |
| Icons      | Lucide React      | Lightweight, tree-shakeable, good sport icon coverage    |

### Why Supabase over a custom backend?

Writing a Node/Express API + setting up Postgres + deploying it separately eats at least half a day. Supabase gives us a Postgres database, auto-generated REST API, and real-time WebSocket subscriptions out of the box. We still write raw SQL for the schema and TypeScript types by hand — it's pragmatic, not no-code.

## Project structure

```
src/
├── pages/              # One file per route
│   ├── HomePage.tsx       # Landing page — hero, CTAs, how it works
│   ├── CreateGamePage.tsx # Game creation form
│   ├── GamePage.tsx       # The shared game page (most important screen)
│   └── BrowsePage.tsx     # Discover upcoming games
├── components/         # Shared UI components
│   └── Layout.tsx         # Sticky header, nav, footer — wraps all pages
├── lib/                # Non-UI logic
│   ├── supabase.ts        # Supabase client init
│   ├── api.ts             # All database queries (CRUD + real-time)
│   └── utils.ts           # Share codes, date formatting, share helpers
└── types/              # TypeScript types
    └── index.ts           # Game, Player, Sport — mirrors the DB schema

supabase/
└── schema.sql          # Full database migration — run in Supabase SQL Editor
```

## Key design decisions

### No authentication

This is deliberate, not lazy. The target user is someone who taps a WhatsApp link and needs to join in under 10 seconds. Any login wall kills that. The cost of spam (someone joining with a fake name) is low; the cost of friction is high.

In a production version you'd add optional OTP verification — but for a weekend challenge, frictionless is the right call.

### Share codes instead of UUIDs in URLs

Game URLs look like `/game/k7m3px` not `/game/550e8400-e29b-...`. Short codes are easier to share verbally, look cleaner in WhatsApp previews, and don't scare non-technical users. We generate 6-character alphanumeric codes with ambiguous characters stripped out (no 0/O/1/l/I).

### Real-time via Supabase subscriptions

When someone joins a game, everyone viewing that page sees the player list update instantly — no polling, no refresh. We subscribe to Postgres changes on the `players` table filtered by `game_id`. On any change event we re-fetch the full player list (simple and correct for lists of ~10-22 people).

### Mobile-first

People open these links from WhatsApp on their phones. Every screen is designed for 375px width first, then scales up. All tap targets are thumb-sized. No hover-only interactions.

### Session-based player tracking

We store the player's ID in `sessionStorage` scoped to the game's share code. This lets them see "You're in!" and gives them a "Leave" button — without needing any auth. If they close the tab and come back, they won't see the leave button, but that's fine for a v1.

## Database

Two tables: `games` and `players`. See `supabase/schema.sql` for the full schema with constraints, indexes, and RLS policies.

```
games                        players
──────────────────           ──────────────────
id (uuid, PK)               id (uuid, PK)
sport (enum)                 game_id (FK → games)
location_name                name
location_url (optional)      phone (optional)
date_time                    joined_at
max_players                  is_waitlist
skill_level (enum)
notes (optional)
organizer_name
status (enum)
share_code (unique)
created_at
```

RLS is enabled but fully permissive (no auth = public read/write). Real-time is enabled on the `players` table only.

## What I'd improve with more time

- **OTP verification** — optional phone verification to prevent spam joins
- **Waitlist** — auto-promote when someone leaves a full game
- **Recurring games** — "Every Saturday 7am at Marina Beach"
- **Push notifications** — remind players an hour before game time
- **Organizer controls** — ability to remove players or cancel the game
- **Dark mode** — because every app needs one eventually
- **Player counts on browse cards** — currently shows max_players but not current count (would need a join query or denormalized column)
