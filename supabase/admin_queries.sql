-- ChemSAGE admin helper queries

-- 1) Promote your first account to admin.
update public.profiles
set role = 'admin', status = 'active'
where roll_no = 'CY25B013';

-- 2) See all pending accounts.
select id, roll_no, name, programme, batch_year, status, role, created_at
from public.profiles
where status = 'pending'
order by created_at desc;

-- 3) Approve a pending account.
update public.profiles
set status = 'active'
where roll_no = 'CY25B013';

-- 4) Ban / unban an account.
update public.profiles set status = 'banned' where roll_no = 'CY25B013';
update public.profiles set status = 'active' where roll_no = 'CY25B013';

-- 5) Confirm that the global room exists.
insert into public.rooms (id, name, description, created_by, is_public)
values ('global', 'Global Hub', 'Portal-wide discussion room for all active students.', null, true)
on conflict (id) do nothing;

-- 6) Check the imported roll numbers.
select roll_no, name, programme, batch_year
from public.registered_rollnos
order by roll_no;
