-- EXTENSIONS (optional)
-- create extension if not exists "uuid-ossp";

-- PROFILES (users)
create table if not exists profiles (
  id uuid primary key,
  full_name text,
  role text default 'USER', -- USER, ADMIN, OPERATOR, REFEREE, CAPTAIN
  created_at timestamptz default now()
);

-- TOURNAMENTS / SEASONS
create table if not exists tournaments (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  format text not null, -- 11x11, 8x8, 6x6, 5x5
  rules jsonb default '{}'::jsonb,
  status text default 'DRAFT', -- DRAFT, ACTIVE, FINISHED
  created_at timestamptz default now()
);

create table if not exists seasons (
  id uuid primary key default gen_random_uuid(),
  tournament_id uuid references tournaments(id) on delete cascade,
  title text not null,
  start_date date,
  end_date date,
  created_at timestamptz default now()
);

-- TEAMS / PLAYERS
create table if not exists teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  logo_url text,
  created_at timestamptz default now()
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  team_id uuid references teams(id) on delete set null,
  full_name text not null,
  photo_url text,
  position text,
  created_at timestamptz default now()
);

-- SEASON PARTICIPATION (teams in a season)
create table if not exists season_teams (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  team_id uuid references teams(id) on delete cascade,
  unique (season_id, team_id)
);

-- MATCHES
create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  matchday int,
  kickoff_at timestamptz,
  venue text,
  home_team_id uuid references teams(id),
  away_team_id uuid references teams(id),
  home_score int default 0,
  away_score int default 0,
  status text default 'SCHEDULED', -- SCHEDULED, LIVE, FINISHED
  created_at timestamptz default now()
);

-- MATCH EVENTS (goals/cards/subs/fouls etc.)
create table if not exists match_events (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  team_id uuid references teams(id),
  player_id uuid references players(id),
  assist_player_id uuid references players(id),
  type text not null, -- GOAL, YELLOW, RED, FOUL, SUB, PENALTY_GOAL, OWN_GOAL etc.
  minute int,
  extra_minute int default 0,
  note text,
  created_by uuid,
  created_at timestamptz default now()
);

-- MATCH LINEUPS (minimal, for GK clean sheets)
create table if not exists match_lineups (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  team_id uuid references teams(id) on delete cascade,
  goalkeeper_player_id uuid references players(id),
  unique (match_id, team_id)
);

-- RATINGS (1-10)
create table if not exists player_ratings (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  player_id uuid references players(id) on delete cascade,
  user_id uuid,
  rating int check (rating >= 1 and rating <= 10),
  created_at timestamptz default now(),
  unique (match_id, player_id, user_id)
);

-- SUBSCRIPTIONS (follow)
create table if not exists subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid,
  entity_type text not null, -- TOURNAMENT, TEAM, PLAYER
  entity_id uuid not null,
  created_at timestamptz default now(),
  unique (user_id, entity_type, entity_id)
);

-- MEDIA: highlight links
create table if not exists match_media (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  type text default 'HIGHLIGHT', -- HIGHLIGHT, FULL_MATCH
  title text,
  url text not null,
  created_by uuid,
  created_at timestamptz default now()
);

-- PHOTOS: gallery (store url/path)
create table if not exists match_photos (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  url text not null,
  caption text,
  uploaded_by uuid,
  created_at timestamptz default now()
);

-- FINANCE: fees / invoices / payments
create table if not exists fees (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  title text not null,
  amount numeric(12,2) not null,
  due_date date,
  created_at timestamptz default now()
);

create table if not exists team_invoices (
  id uuid primary key default gen_random_uuid(),
  season_id uuid references seasons(id) on delete cascade,
  team_id uuid references teams(id) on delete cascade,
  title text not null,
  amount numeric(12,2) not null,
  due_date date,
  status text default 'UNPAID', -- UNPAID, PARTIAL, PAID, OVERDUE
  created_at timestamptz default now()
);

create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  invoice_id uuid references team_invoices(id) on delete cascade,
  amount numeric(12,2) not null,
  method text default 'CASH', -- CASH, CARD, TRANSFER, CLICK, PAYME
  paid_at timestamptz default now(),
  comment text
);

-- TELEGRAM OUTBOX (log)
create table if not exists telegram_outbox (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null,
  status text default 'PENDING', -- PENDING, SENT, FAILED
  error text,
  created_at timestamptz default now()
);
