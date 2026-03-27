# Architecture

**Focus:** arch

## 1. System Pattern
ChemSAGE uses a modern **React Server Components (RSC) + Single Page Application (SPA)** hybrid pattern facilitated by **Next.js App Router**. Data is primarily fetched client-side or during server rendering through the Supabase client. 

## 2. Layers & Data Flow
- **Presentation Layer**: React Server and Client Components in `src/app/` and `src/components/`.
- **State Management**: React Context (`AuthProvider`) is used globally for user sessions and profiles. Local component state is handled via React hooks.
- **Data Access Layer**: `src/lib/supabase.ts` acts as the primary data access layer interfacing with Supabase via `@supabase/supabase-js`.
- **Database/Backend Layer**: Handled entirely by Supabase (Postgres tables like `profiles`, `rooms`, `messages`, Storage Buckets, and Edge Functions).

**Typical Data Flow:**
1. User interact with UI in `src/app/(app)/*`.
2. Component reads session from `AuthProvider`.
3. Calls are made directly to Supabase via `supabase` client imported from `src/lib/supabase.ts`.
4. RLS policies on Supabase ensure security.
5. On admin actions, specific processes invoke Edge Functions (e.g., `delete-user`).

## 3. Key Abstractions
- **Route Groups**: The app uses Next.js Route Groups `(auth)` and `(app)` to separate layouts and route protection logic without affecting the URL path.
- **Provider Pattern**: Global providers in `src/providers/` wrap the application to provide context (e.g., AuthProvider).
- **Utility Modules**: `src/lib/rollno.ts` abstracts IIT Madras specific logic like parsing departments and batch years from roll numbers. `src/lib/utils.ts` likely abstracts UI styling merges (tailwind-merge / clsx).

## 4. Entry Points
- `src/app/layout.tsx` - The Root Layout, providing fonts and global providers to the entire app.
- `src/app/globals.css` - Global styling, Tailwind directives.
- `src/providers/AuthProvider.tsx` - Bootstraps the user session and profile globally when the app loads.
