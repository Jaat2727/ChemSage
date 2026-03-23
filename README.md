# ChemSAGE

ChemSAGE is an IIT Madras Chemistry Department student portal built with Next.js, Tailwind CSS, and Supabase.

## 1. Add your Supabase keys properly

Never commit your real keys. This repo ignores `.env.local`, so keep the real values only on your machine.

```bash
cp .env.local.example .env.local
```

Then open `.env.local` and paste:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

### Which key goes where?

- `NEXT_PUBLIC_SUPABASE_URL`: from **Supabase Dashboard → Settings → API → Project URL**.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: from **Supabase Dashboard → Settings → API → Project API keys → anon / public**.
- `SUPABASE_SERVICE_ROLE_KEY`: from **Supabase Dashboard → Settings → API → Project API keys → service_role**.

### Important rule

- `NEXT_PUBLIC_*` variables are safe for the browser.
- `SUPABASE_SERVICE_ROLE_KEY` must stay server-side only.
- In this project, destructive admin deletion is routed through the `delete-user` Edge Function instead of exposing the service-role key in the client.

## 2. Database setup

The full database and RLS setup lives in `supabase/schema.sql`.

### Apply it

1. Open your Supabase project.
2. Go to **SQL Editor**.
3. Open `supabase/schema.sql` from this repo.
4. Paste the whole file into the editor.
5. Run it once.

That script creates:

- `registered_rollnos`
- `profiles`
- `rooms`
- `room_members`
- `messages`
- `resources`
- `exam_papers`
- `schedule`
- the default `global` room
- helper functions for admin/active-user checks
- RLS policies for all required tables

## 3. Storage bucket setup

Create these buckets in **Supabase Dashboard → Storage**:

- `study-vault`
- `exam-archive`

For the current UI flow, these should be readable through public URLs after upload.

## 4. Edge Function setup

This project includes `supabase/functions/delete-user/index.ts` for admin rejection flows.

### Deploy it

If you use the Supabase CLI:

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy delete-user
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

The function uses:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY`

## 5. Make the first admin

When the first user signs up, their `profiles.role` defaults to `student`.
To promote the first admin, run this once in the SQL editor:

```sql
update public.profiles
set role = 'admin', status = 'active'
where roll_no = 'YOUR_ROLL_NO';
```

## 6. Register approved roll numbers before signup

If you want a student to become `active` immediately during signup, add their roll number to `registered_rollnos` first.

Example:

```sql
insert into public.registered_rollnos (roll_no, name, programme, batch_year)
values ('CY25B001', 'Student Name', 'BS', 2025)
on conflict (roll_no) do nothing;
```

If a signup roll number is **not** present there, ChemSAGE creates the auth user and profile with `status = 'pending'` until admin approval.

### Ready-to-run helper SQL

- `supabase/admin_queries.sql` contains admin-safe helper queries for first admin setup, approval checks, ban/unban, and verifying the global room.
- `supabase/seed_registered_rollnos_cy25b.sql` contains the imported CY25B roll-number seed derived from the student list you supplied. Run that file in Supabase SQL Editor if you want those students to become immediately eligible for active signup.

## 7. Start the app

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## 8. Useful Supabase workflow for this repo

### Signup flow
- Email must end with `@smail.iitm.ac.in`.
- Roll number is extracted from the email prefix.
- `parseRollNo()` maps `B/S/D` into `BS/MSc/PhD` and computes `batch_year`.
- If the roll number exists in `registered_rollnos`, the profile becomes `active`.
- Otherwise the profile becomes `pending`.

### Admin flow
- Admins can approve/reject pending users.
- Reject uses the `delete-user` Edge Function.
- Admins can upload vault/archive content and import roll numbers via CSV.

## 9. Files to check if something breaks

- `src/lib/supabase.ts` → client/auth/storage/functions wiring
- `src/lib/rollno.ts` → roll parsing and smail email validation
- `src/providers/AuthProvider.tsx` → session/profile loading
- `supabase/schema.sql` → tables and RLS
- `supabase/functions/delete-user/index.ts` → admin delete flow
