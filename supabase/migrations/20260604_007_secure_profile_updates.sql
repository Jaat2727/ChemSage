-- Remove insecure self-insert policy since profiles are created securely via server route
drop policy if exists "profiles insert self" on public.profiles;

-- Create trigger function to protect sensitive columns during updates
create or replace function public.protect_profile_columns()
returns trigger
language plpgsql
security definer
as $$
begin
  -- Only allow admins to change sensitive columns
  if not public.is_admin() then
    if new.role is distinct from old.role then
      new.role := old.role;
    end if;
    if new.status is distinct from old.status then
      new.status := old.status;
    end if;
    if new.roll_no is distinct from old.roll_no then
      new.roll_no := old.roll_no;
    end if;
    if new.batch_year is distinct from old.batch_year then
      new.batch_year := old.batch_year;
    end if;
    if new.programme is distinct from old.programme then
      new.programme := old.programme;
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists protect_profile_columns_trigger on public.profiles;
create trigger protect_profile_columns_trigger
before update on public.profiles
for each row
execute function public.protect_profile_columns();
