# ChemSAGE ⚗️

> **Student portal for the IIT Madras Chemistry Department** — built with Next.js 16, Tailwind CSS, and Supabase.

A real-time collaborative workspace featuring direct messaging, study groups, resource sharing, exam paper archives, class scheduling, and task management — all wrapped in a brutalist, terminal-inspired UI.

---

## ✨ Features

| Feature | Description |
|---|---|
| **Auth & Approval** | Signup restricted to `@smail.iitm.ac.in` emails. Roll numbers auto-parsed. Accounts can be auto-approved or require admin review. |
| **Dashboard** | Quick-access cards with live stats for all portal sections. |
| **Network Hub** | Community chat (global room) + one-to-one direct messages with real-time delivery via Supabase Realtime. |
| **Study Circles** | Create and join topic-based group chats with member lists, location info, and contact details. |
| **Resource Vault** | Upload/download study materials (PDF, DOCX, images, ZIP) with category & tag filtering. |
| **Exam Archive** | Browse and share past exam papers filtered by subject, year, semester, and exam type. |
| **Class Planner** | Personal weekly schedule builder with day/time/room entries. |
| **Task Board** | Kanban-style task tracker with due dates and priority levels. |
| **Admin Panel** | Approve/reject/ban users, import roll numbers via CSV, and manage the community. |
| **Notifications** | Real-time notification bell with Supabase Realtime `postgres_changes` subscriptions. |

---

## 🛠 Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org) (App Router, Turbopack)
- **Styling**: [Tailwind CSS v4](https://tailwindcss.com) with CSS variable-driven brutalist design system
- **Backend**: [Supabase](https://supabase.com) (Auth, PostgreSQL, Realtime, Storage, Edge Functions)
- **Auth**: `@supabase/ssr` for server/client cookie-based sessions
- **Fonts**: Inter + Space Mono (Google Fonts)
- **Icons**: [Lucide React](https://lucide.dev)
- **Math**: KaTeX + react-markdown for LaTeX rendering in chat

---

## 🎨 Design System

The UI follows a **brutalist, terminal-inspired aesthetic** inspired by Buildspace:

- **Background**: `#050505` (near-black)
- **Accent**: `#D4FF00` (neon yellow-green)
- **Surface**: `#111111` (dark panels)
- **Border**: `#333333` (sharp, visible borders)
- **Typography**: Space Mono (monospace) for headings/labels, Inter for body text
- **No rounded corners** — everything is sharp and flat
- **No glassmorphism** — high-contrast, no blur effects

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/ChemSage.git
cd ChemSage
npm install
```

### 2. Set Up Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Supabase credentials:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=YOUR_SUPABASE_SERVICE_ROLE_KEY
```

> **Where to find these:**
> - `NEXT_PUBLIC_SUPABASE_URL`: Supabase Dashboard → Settings → API → Project URL
> - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase Dashboard → Settings → API → anon / public key
> - `SUPABASE_SERVICE_ROLE_KEY`: Supabase Dashboard → Settings → API → service_role key
>
> ⚠️ `SUPABASE_SERVICE_ROLE_KEY` must **never** be exposed to the browser. It's only used server-side in API routes.

### 3. Set Up the Database

1. Open your Supabase project → **SQL Editor**
2. Paste the contents of `supabase/schema.sql`
3. Run it once

This creates all tables (`profiles`, `rooms`, `messages`, `resources`, `exam_papers`, `schedule`, etc.), RLS policies, helper functions, and the default `global` chat room.

### 4. Set Up Storage Buckets

Create these buckets in **Supabase Dashboard → Storage**:

- `study-vault` — for uploaded study resources
- `exam-archive` — for past exam papers

### 5. Deploy the Edge Function

```bash
supabase login
supabase link --project-ref YOUR_PROJECT_REF
supabase functions deploy delete-user
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVICE_ROLE_KEY
```

### 6. Create the First Admin

After the first user signs up, promote them via SQL:

```sql
UPDATE public.profiles
SET role = 'admin', status = 'active'
WHERE roll_no = 'YOUR_ROLL_NO';
```

### 7. Run the App

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (auth)/           # Login, Signup, Forgot Password
│   │   ├── login/
│   │   ├── signup/
│   │   └── forgot-password/
│   ├── (app)/            # Authenticated app pages
│   │   ├── page.tsx      # Dashboard
│   │   ├── vault/        # Resource Vault
│   │   ├── archive/      # Exam Archive
│   │   ├── hub/          # Network Hub (DMs + Global chat)
│   │   ├── groups/       # Study Circles
│   │   ├── tasks/        # Task Board
│   │   ├── schedule/     # Class Planner
│   │   └── admin/        # Admin Panel
│   ├── api/auth/signup/  # Server-side signup API route
│   └── globals.css       # Design system (CSS variables)
├── components/
│   ├── AppShell.tsx       # Main layout shell
│   ├── Sidebar.tsx        # Desktop navigation
│   ├── MobileTabBar.tsx   # Mobile bottom navigation
│   ├── PageHeader.tsx     # Reusable page header
│   ├── auth/RouteGate.tsx # Auth route protection
│   ├── notifications/    # Notification bell + realtime
│   └── ui/               # Shared UI components (Feedback, MessageDisplay)
├── lib/
│   ├── supabase.ts       # Supabase client singleton
│   ├── types.ts          # TypeScript interfaces
│   ├── rollno.ts         # Roll number parsing & email validation
│   └── utils.ts          # Utility functions
├── providers/
│   └── AuthProvider.tsx  # Auth context (session + profile)
└── middleware.ts         # Server-side auth guard
```

---

## 🔑 Auth & Signup Flow

1. Email must end with `@smail.iitm.ac.in`
2. Roll number is extracted from the email prefix (e.g., `cy25b001@smail.iitm.ac.in` → `CY25B001`)
3. `parseRollNo()` maps `B/S/D` → `BS/MSc/PhD` and computes `batch_year`
4. If the roll number exists in `registered_rollnos`, profile becomes **active** immediately
5. Otherwise profile becomes **pending** until admin approval

---

## 🔧 Troubleshooting

| Issue | Fix |
|---|---|
| App shows placeholder/no data | Check `.env.local` has real Supabase credentials |
| Login redirects back to login | Verify middleware.ts and Supabase cookie handling |
| Realtime not working | Ensure `messages` and `notifications` tables have Realtime enabled in Supabase Dashboard |
| Upload fails | Check that `study-vault` / `exam-archive` storage buckets exist |
| Build warnings about middleware | Safe to ignore — Next.js 16 deprecation notice, middleware still works |

---

## 📄 License

MIT
