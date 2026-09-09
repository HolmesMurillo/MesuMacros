create extension if not exists pgcrypto;

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  name text,
  age integer,
  sex text,
  height numeric,
  current_weight numeric,
  target_weight numeric,
  activity text default 'moderate',
  goal text default 'maintain',
  pace numeric,
  units text default 'metric',
  language text default 'en',
  theme text default 'light',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.nutrition_goals (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  calories numeric, protein numeric, carbs numeric, fat numeric, fiber numeric, water numeric, micronutrients jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id)
);
create table if not exists public.food_entries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  legacy_id text, name text not null, brand text, amount numeric not null check (amount >= 0), unit text not null, meal_type text not null,
  date_key date not null, time text, time_zone text not null, calories numeric, protein numeric, carbs numeric, fat numeric, nutrients jsonb not null default '{}'::jsonb,
  is_favorite boolean not null default false, source text, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id, legacy_id)
);
create table if not exists public.water_entries (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  legacy_id text, date_key date not null, amount numeric not null check (amount > 0), time_zone text not null, created_at timestamptz not null default now(), unique(user_id, legacy_id)
);
create table if not exists public.body_measurements (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  legacy_id text, date_key date not null, weight numeric, waist numeric, hip numeric, chest numeric, arm numeric, notes text, time_zone text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now(), unique(user_id, legacy_id)
);
create table if not exists public.custom_foods (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  name text not null, brand text, serving jsonb not null default '{}'::jsonb, nutrients jsonb not null default '{}'::jsonb, is_favorite boolean not null default false,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.favorite_foods (
  id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
  catalog_id text, custom_food_id uuid references public.custom_foods(id) on delete cascade, created_at timestamptz not null default now(), unique(user_id, catalog_id, custom_food_id)
);
create table if not exists public.migration_status (
  user_id uuid primary key references auth.users(id) on delete cascade, completed_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);

create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into public.profiles (user_id, name, language) values (
  new.id,
  new.raw_user_meta_data ->> 'full_name',
  case when new.raw_user_meta_data ->> 'language' in ('en', 'es') then new.raw_user_meta_data ->> 'language' else 'en' end
);
insert into public.nutrition_goals (user_id, calories, protein, carbs, fat, fiber, water) values (new.id, 2200, 140, 250, 75, 30, 2000); return new; end; $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
DO $$ declare table_name text; begin foreach table_name in array ARRAY['profiles','nutrition_goals','food_entries','body_measurements','custom_foods','migration_status'] loop execute format('drop trigger if exists set_updated_at on public.%I; create trigger set_updated_at before update on public.%I for each row execute procedure public.set_updated_at()', table_name, table_name); end loop; end $$;

alter table public.profiles enable row level security; alter table public.nutrition_goals enable row level security; alter table public.food_entries enable row level security; alter table public.water_entries enable row level security; alter table public.body_measurements enable row level security; alter table public.custom_foods enable row level security; alter table public.favorite_foods enable row level security; alter table public.migration_status enable row level security;

DO $$ declare table_name text; begin foreach table_name in array ARRAY['profiles','nutrition_goals','food_entries','water_entries','body_measurements','custom_foods','favorite_foods','migration_status'] loop execute format('drop policy if exists owner_select on public.%I; drop policy if exists owner_insert on public.%I; drop policy if exists owner_update on public.%I; drop policy if exists owner_delete on public.%I', table_name, table_name, table_name, table_name); execute format('create policy owner_select on public.%I for select using (auth.uid() = user_id)', table_name); execute format('create policy owner_insert on public.%I for insert with check (auth.uid() = user_id)', table_name); execute format('create policy owner_update on public.%I for update using (auth.uid() = user_id) with check (auth.uid() = user_id)', table_name); execute format('create policy owner_delete on public.%I for delete using (auth.uid() = user_id)', table_name); end loop; end $$;

grant usage on schema public to authenticated;
grant select, insert, update, delete on table
  public.profiles,
  public.nutrition_goals,
  public.food_entries,
  public.water_entries,
  public.body_measurements,
  public.custom_foods,
  public.favorite_foods,
  public.migration_status
to authenticated;
