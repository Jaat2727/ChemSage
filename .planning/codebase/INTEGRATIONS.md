# Integrations

**Focus:** tech

## 1. Supabase (Core Backend-as-a-Service)

Supabase forms the entire backend infrastructure for ChemSAGE.

### Authentication
- Uses Supabase Auth.
- Implements custom logic: `email` must end with `@smail.iitm.ac.in`.
- Role-based access control (`student` vs `admin`).
- Accounts default to `pending` status unless pre-registered in the `registered_rollnos` table.

### Database (Postgres)
- Table `profiles`, `registered_rollnos`, `rooms`, `room_members`, `messages`, `resources`, `exam_papers`, `schedule`.
- Heavily uses Row-Level Security (RLS) policies.

### Storage
- Buckets:
  - `study-vault`: Used for storing study materials/resources.
  - `exam-archive`: Used for storing past exam papers.

### Edge Functions
- `delete-user`: Located at `supabase/functions/delete-user/index.ts`. Used by admins to securely reject/delete users without exposing the `service_role` key on the client side.

## 2. IIT Madras Identity
- **smail.iitm.ac.in**: The system verifies users based on the IIT Madras student email domains.
- Roll number extraction and inference logic (e.g., mapping `B`/`S`/`D` prefixes to `BS`/`MSc`/`PhD` programs).
