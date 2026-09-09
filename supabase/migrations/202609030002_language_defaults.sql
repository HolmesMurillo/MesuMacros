-- Hace que las cuentas nuevas comiencen en inglés sin cambiar la preferencia
-- de usuarios existentes. Ejecuta este archivo una sola vez en SQL Editor.

alter table public.profiles alter column language set default 'en';

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (user_id, name, language)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    case
      when new.raw_user_meta_data ->> 'language' in ('en', 'es')
        then new.raw_user_meta_data ->> 'language'
      else 'en'
    end
  );

  insert into public.nutrition_goals
    (user_id, calories, protein, carbs, fat, fiber, water)
  values (new.id, 2200, 140, 250, 75, 30, 2000);

  return new;
end;
$$;
