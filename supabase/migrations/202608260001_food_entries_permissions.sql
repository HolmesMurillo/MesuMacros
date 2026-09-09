grant usage on schema public to authenticated;
grant select, insert, update, delete on table public.food_entries to authenticated;

alter table public.food_entries enable row level security;

drop policy if exists food_entries_select_own on public.food_entries;
drop policy if exists food_entries_insert_own on public.food_entries;
drop policy if exists food_entries_update_own on public.food_entries;
drop policy if exists food_entries_delete_own on public.food_entries;

create policy food_entries_select_own on public.food_entries
  for select to authenticated
  using ((select auth.uid()) = user_id);
create policy food_entries_insert_own on public.food_entries
  for insert to authenticated
  with check ((select auth.uid()) = user_id);
create policy food_entries_update_own on public.food_entries
  for update to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
create policy food_entries_delete_own on public.food_entries
  for delete to authenticated
  using ((select auth.uid()) = user_id);
