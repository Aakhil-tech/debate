
create extension if not exists pgcrypto;

create table if not exists users (
  id            uuid primary key default gen_random_uuid(),
  email         text not null unique,
  password_hash text not null,
  handle        text not null unique,
  credits       int  not null default 20,
  level         int  not null default 1,
  clean_wins    int  not null default 0,
  fumble_flags  int  not null default 0,
  meltdowns     int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on users
  for each row execute function set_updated_at();

create table if not exists cases (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references users(id) on delete cascade,
  title             text not null,
  node_count        int  not null default 0,
  subtext_score     int  not null default 0,
  frame_loss_pct    int  not null default 0,
  ego_deficit_pct   int  not null default 0,
  tactical_move     text,
  forensic_summary  text,
  image_path        text,
  analysis_json     jsonb,
  created_at        timestamptz not null default now()
);

create index if not exists cases_user_id_idx on cases(user_id);
create index if not exists cases_created_at_idx on cases(created_at desc);

create table if not exists fumble_analyses (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references users(id) on delete cascade,
  threat_level     int  not null default 5,
  fumble_pct       int  not null default 100,
  survival_chance  int  not null default 0,
  draft_length     int  not null default 0,
  draft_text       text,
  created_at       timestamptz not null default now()
);

create index if not exists fumble_user_id_idx on fumble_analyses(user_id);

create table if not exists sparring_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references users(id) on delete cascade,
  topic           text not null,
  persona         text not null default 'chaos',
  persona_name    text,
  aggressiveness  int  not null default 7,
  user_frame_pct  int  not null default 68,
  bot_frame_pct   int  not null default 32,
  round           int  not null default 1,
  status          text not null default 'active',
  messages        jsonb default '[]',
  verdict_json    jsonb,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger sparring_updated_at
  before update on sparring_sessions
  for each row execute function set_updated_at();

create index if not exists sparring_user_id_idx on sparring_sessions(user_id);
