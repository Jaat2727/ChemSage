# Structure

**Focus:** arch

## 1. Directory Layout
```text
/
├── public/                 # Static assets
├── src/
│   ├── app/                # Next.js App Router pages and layouts
│   │   ├── (app)/          # Main application pages (authenticated)
│   │   ├── (auth)/         # Authentication pages (login, signup)
│   │   ├── api/            # Next.js API Routes
│   │   ├── layout.tsx      # Root layout
│   │   └── globals.css     # Global styles
│   ├── components/         # Reusable React components
│   │   ├── auth/           # Auth-specific components (e.g. RouteGate.tsx)
│   │   ├── ui/             # General UI components (buttons, inputs)
│   │   ├── AppShell.tsx
│   │   ├── MobileTabBar.tsx
│   │   ├── PageHeader.tsx
│   │   ├── Sidebar.tsx
│   │   └── navItems.ts     # Navigation config
│   ├── lib/                # Utility functions and core configuration
│   │   ├── rollno.ts       # IIT Madras roll number parsing
│   │   ├── supabase.ts     # Supabase client instantiation
│   │   ├── types.ts        # Global TypeScript interfaces
│   │   └── utils.ts        # General utilities (e.g. Tailwind merge)
│   └── providers/          # React Context Providers
│       └── AuthProvider.tsx# Session & Profile context provider
└── supabase/               # Supabase configuration
    ├── functions/          # Edge Functions (e.g. delete-user)
    └── schema.sql          # Database schema and RLS policies
```

## 2. Key Locations
- **Database Schema**: `supabase/schema.sql`
- **Main Client Config**: `src/lib/supabase.ts`
- **Layout Shell**: `src/components/AppShell.tsx`, `Sidebar.tsx`, `MobileTabBar.tsx`
- **Authentication Routes**: `src/app/(auth)/*`

## 3. Naming Conventions
- **Components/Pages**: PascalCase for files exporting React components (`AuthProvider.tsx`, `Sidebar.tsx`), kebab-case or general standard for Next.js specific files (`page.tsx`, `layout.tsx`).
- **Utilities**: camelCase for files exporting utility functions (`rollno.ts`, `supabase.ts`).
- **Route Groups**: Parentheses encapsulation (`(auth)`, `(app)`) to organize routes without affecting URL segments.
