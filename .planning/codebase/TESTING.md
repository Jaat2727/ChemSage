# Testing

**Focus:** quality

## 1. Framework
- **Current Status**: No automated testing framework (e.g., Jest, Vitest, Cypress, Playwright) is currently installed or configured in the project's `package.json` or directory structure.

## 2. Structure & Coverage
- Without an established framework, there are no `__tests__` directories or `*.test.tsx` / `*.spec.ts` files in the source tree. 
- All testing at this stage is presumably manual.

## 3. Recommendations
- Implement **Vitest** + **React Testing Library** for component and utility testing (e.g., very useful for testing `src/lib/rollno.ts`).
- Implement **Playwright** or **Cypress** for End-to-End (E2E) testing of the Authentication flow (since the logic depends heavily on `@smail.iitm.ac.in` domain specifics).
