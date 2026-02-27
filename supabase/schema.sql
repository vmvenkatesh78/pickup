-- pickup — Database schema
-- Run this in your Supabase project's SQL Editor (supabase.com > SQL Editor)
--
-- Two tables: games and players. That's it.
-- No auth tables — we deliberately skip login for zero-friction UX.
-- RLS is wide open (all reads/writes allowed) since there's no auth.

create extension if not exists "uuid-ossp";

-- ============================================
-- Games
-- ============================================
-- Each row = one pickup game someone has organized.
-- The share_code is what appears in URLs (/game/abc123)
-- instead of a raw UUID, because nobody wants to paste a
-- 36-char string into WhatsApp.

create table games (
  id uuid primary key default uuid_generate_v4(),
  sport text not null check (sport in ('cricket', 'basketball', 'badminton', 'football', 'other')),
  location_name text not null,
  location_url text,                -- optional Google Maps link
  date_time timestamptz not null,
  max_players integer not null check (max_players >= 2 and max_players <= 100),
  skill_level text not null default 'casual' check (skill_level in ('casual', 'intermediate', 'competitive')),
  notes text,                       -- freeform, e.g. "bring your own bat"
  organizer_name text not null,
  status text not null default 'open' check (status in ('open', 'full', 'cancelled', 'completed')),
  share_code text unique not null,
  created_at timestamptz default now()
);

-- ============================================
-- Players
-- ============================================
-- Each row = one person who joined a game.
-- Cascading delete means if a game gets removed, its players go too.
-- is_waitlist is here for a future feature but defaults to false for now.

create table players (
  id uuid primary key default uuid_generate_v4(),
  game_id uuid not null references games(id) on delete cascade,
  name text not null,
  phone text,                       -- optional, some people want to coordinate day-of
  joined_at timestamptz default now(),
  is_waitlist boolean default false
);

-- ============================================
-- Indexes
-- ============================================
-- share_code lookups happen on every game page load.
-- The composite index on (status, date_time) powers the browse page query.

create index idx_games_share_code on games(share_code);
create index idx_games_status_date on games(status, date_time);
create index idx_players_game_id on players(game_id);

-- ============================================
-- Row Level Security
-- ============================================
-- No auth = everything is public. We enable RLS (Supabase requires it)
-- but set permissive policies across the board.
-- In a production version you'd scope writes behind OTP verification.

alter table games enable row level security;
alter table players enable row level security;

create policy "Games are viewable by everyone"
  on games for select using (true);

create policy "Anyone can create games"
  on games for insert with check (true);

create policy "Anyone can update games"
  on games for update using (true);

create policy "Players are viewable by everyone"
  on players for select using (true);

create policy "Anyone can join games"
  on players for insert with check (true);

create policy "Anyone can leave games"
  on players for delete using (true);

-- ============================================
-- Real-time
-- ============================================
-- We only need real-time on the players table — when someone joins
-- or leaves, the game page should update instantly for everyone viewing it.

alter publication supabase_realtime add table players;
