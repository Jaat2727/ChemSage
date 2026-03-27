# Conventions

**Focus:** quality

## 1. Code Style
- **Linter**: ESLint (version 9) using the flat config `eslint.config.mjs`. It uses `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.
- **TypeScript**: Strict mode is enabled (`"strict": true` in `tsconfig.json`).
- **Formatting**: Typically handled by ESLint / Prettier combos, though Prettier isn't explicitly listed in `package.json`, ESLint rules manage core Next.js & TS stylistic conventions.

## 2. Naming & Patterns
- **React Components**: PascalCase is preferred for components (e.g., `AppShell.tsx`, `PageHeader.tsx`). Next.js special files use their required lowercase names (`page.tsx`, `layout.tsx`).
- **Styling**: Tailwind CSS utility classes are heavily utilized. 
- **Utilities**: General utility files use camelCase (e.g., `rollno.ts`, `supabase.ts`). UI utilities likely include `clsx` and `tailwind-merge` based on standard ecosystem patterns.

## 3. Error Handling
- Currently, logic relies on standard React Error Boundaries (or Next.js `error.tsx` conventions) though no specific global `error.tsx` was deeply analyzed in this pass. 
- Supabase edge functions and clients might handle their own try-catch logic with error logging.
