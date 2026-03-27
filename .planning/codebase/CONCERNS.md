# Concerns

**Focus:** concerns

## 1. Tech Debt
- **Lack of Automated Tests**: The codebase does not currently have any automated unit or end-to-end tests. This presents a risk when refactoring or extending features, particularly the domain-specific authentication rules.

## 2. Hardcoded Domain Constraints
- **smail.iitm.ac.in Restriction**: The system's authentication and roll-number extraction logic is tightly bound to IIT Madras student email domains. If the platform needs to scale to other universities, this logic needs decoupling.

## 3. Security
- **Edge Function Secrets**: As noted in `README.md`, destructive admin operations like user deletion correctly use the backend Edge Function (`supabase/functions/delete-user`). However, care must continue to be taken to ensure the `service_role` key is never exposed on the Next.js client side.

## 4. Known Bugs / FIXMEs
- A quick sweep of the `src/` directory did not reveal any explicit `TODO`, `FIXME`, or `HACK` comments left by developers, which suggests the codebase is either very clean or tracking issues externally.
