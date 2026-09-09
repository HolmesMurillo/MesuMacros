-- Ejecuta este archivo una vez en Supabase > SQL Editor.
-- RLS continúa aislando los datos de cada usuario.

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

alter table public.profiles enable row level security;
alter table public.nutrition_goals enable row level security;
alter table public.food_entries enable row level security;
alter table public.water_entries enable row level security;
alter table public.body_measurements enable row level security;
alter table public.custom_foods enable row level security;
alter table public.favorite_foods enable row level security;
alter table public.migration_status enable row level security;

do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'profiles', 'nutrition_goals', 'food_entries', 'water_entries',
    'body_measurements', 'custom_foods', 'favorite_foods', 'migration_status'
  ] loop
    execute format('drop policy if exists owner_select on public.%I', table_name);
    execute format('drop policy if exists owner_insert on public.%I', table_name);
    execute format('drop policy if exists owner_update on public.%I', table_name);
    execute format('drop policy if exists owner_delete on public.%I', table_name);
    execute format('create policy owner_select on public.%I for select to authenticated using ((select auth.uid()) = user_id)', table_name);
    execute format('create policy owner_insert on public.%I for insert to authenticated with check ((select auth.uid()) = user_id)', table_name);
    execute format('create policy owner_update on public.%I for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id)', table_name);
    execute format('create policy owner_delete on public.%I for delete to authenticated using ((select auth.uid()) = user_id)', table_name);
  end loop;
end $$;
