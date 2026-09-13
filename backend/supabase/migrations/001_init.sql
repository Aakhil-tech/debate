
create table if not exists public.users (
  id            uuid primary key,
  email         text not null unique,
  handle        text not null unique,
  credits       int  not null default 20,
  level         int  not null default 1,
  clean_wins    int  not null default 0,
  fumble_flags  int  not null default 0,
  meltdowns     int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger users_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create table if not exists public.cases (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.users(id) on delete cascade,
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

create index if not exists cases_user_id_idx on public.cases(user_id);
create index if not exists cases_created_at_idx on public.cases(created_at desc);

create table if not exists public.fumble_analyses (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.users(id) on delete cascade,
  threat_level     int  not null default 5,
  fumble_pct       int  not null default 100,
  survival_chance  int  not null default 0,
  draft_length     int  not null default 0,
  draft_text       text,
  created_at       timestamptz not null default now()
);

create index if not exists fumble_user_id_idx on public.fumble_analyses(user_id);

create table if not exists public.sparring_sessions (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references public.users(id) on delete cascade,
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
  before update on public.sparring_sessions
  for each row execute function public.set_updated_at();

create index if not exists sparring_user_id_idx on public.sparring_sessions(user_id);

alter table public.users            enable row level security;
alter table public.cases            enable row level security;
alter table public.fumble_analyses  enable row level security;
alter table public.sparring_sessions enable row level security;

create policy "users_self" on public.users
  using (auth.uid() = id);

create policy "cases_self" on public.cases
  using (auth.uid() = user_id);

create policy "fumble_self" on public.fumble_analyses
  using (auth.uid() = user_id);

create policy "sparring_self" on public.sparring_sessions
  using (auth.uid() = user_id);

