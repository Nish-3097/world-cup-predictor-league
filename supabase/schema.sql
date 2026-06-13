create extension if not exists "pgcrypto";

do $$
begin
  if not exists (select 1 from pg_type where typname = 'result_pick') then
    create type result_pick as enum ('HOME', 'DRAW', 'AWAY');
  end if;
end $$;

create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  pin text not null unique,
  name text unique,
  created_at timestamptz not null default now(),
  constraint player_name_not_blank check (name is null or length(trim(name)) > 0)
);

create table if not exists public.fixtures (
  id uuid primary key default gen_random_uuid(),
  home_team text not null,
  away_team text not null,
  stage text not null,
  kickoff_at timestamptz not null,
  actual_result result_pick,
  created_at timestamptz not null default now()
);

create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  player_id uuid not null references public.players(id) on delete cascade,
  fixture_id uuid not null references public.fixtures(id) on delete cascade,
  prediction result_pick not null,
  points integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (player_id, fixture_id)
);

create or replace function public.set_prediction_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create or replace function public.enforce_prediction_rules()
returns trigger as $$
declare
  fixture_record public.fixtures%rowtype;
begin
  select * into fixture_record
  from public.fixtures
  where id = new.fixture_id;

  if fixture_record.id is null then
    raise exception 'Fixture does not exist.';
  end if;

  if lower(fixture_record.stage) not like '%group%' then
    raise exception 'Predictions are only open for group-stage fixtures.';
  end if;

  if fixture_record.kickoff_at <= now() and (tg_op = 'INSERT' or old.prediction is distinct from new.prediction) then
    raise exception 'Prediction changes are locked after kickoff.';
  end if;

  return new;
end;
$$ language plpgsql;

drop trigger if exists predictions_set_updated_at on public.predictions;
create trigger predictions_set_updated_at
before update on public.predictions
for each row
execute function public.set_prediction_updated_at();

drop trigger if exists predictions_enforce_rules on public.predictions;
create trigger predictions_enforce_rules
before insert or update of prediction, fixture_id on public.predictions
for each row
execute function public.enforce_prediction_rules();

create index if not exists fixtures_kickoff_at_idx on public.fixtures(kickoff_at);
create index if not exists predictions_player_id_idx on public.predictions(player_id);
create index if not exists predictions_fixture_id_idx on public.predictions(fixture_id);

alter table public.players enable row level security;
alter table public.fixtures enable row level security;
alter table public.predictions enable row level security;

drop policy if exists "Players are readable" on public.players;
create policy "Players are readable"
on public.players for select
to anon
using (true);

drop policy if exists "Players can claim unclaimed PINs" on public.players;
create policy "Players can claim unclaimed PINs"
on public.players for update
to anon
using (name is null)
with check (name is not null);

drop policy if exists "Fixtures are readable" on public.fixtures;
create policy "Fixtures are readable"
on public.fixtures for select
to anon
using (true);

drop policy if exists "Fixtures are admin writable in V1" on public.fixtures;
create policy "Fixtures are admin writable in V1"
on public.fixtures for all
to anon
using (true)
with check (true);

drop policy if exists "Predictions are readable" on public.predictions;
create policy "Predictions are readable"
on public.predictions for select
to anon
using (true);

drop policy if exists "Predictions are writable in V1" on public.predictions;
create policy "Predictions are writable in V1"
on public.predictions for all
to anon
using (true)
with check (true);
