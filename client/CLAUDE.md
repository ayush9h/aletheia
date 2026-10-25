# CLAUDE.md

Behavioral guidelines for the Aletheia client (Next.js 15 App Router, React 19, Tailwind v4, shadcn/ui, next-auth v5). Merge with any repo-level instructions.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:
- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.
- Check where code belongs (see Project Structure) before creating a file.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.
- Reuse what exists: `@/components/ui/*` (dialog, button, dropdown-menu, select, tooltip, accordion) before adding a library or hand-rolled component.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:
- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.
- Don't edit `src/components/ui/*` (shadcn-generated) unless asked.

When your changes create orphans:
- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:
- "Add a component" → "It renders, `tsc` and lint pass"
- "Fix the bug" → "Reproduce it, fix it, confirm it's gone"
- "Refactor X" → "Typecheck and build pass before and after"

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Verify from `client/`:
- `npx tsc --noEmit -p .` - typecheck
- `npx next lint` - lint
- `npx next build` - for routing, server/client boundary, or bundle changes

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

## 5. Project Structure

**Feature-first. Routes stay thin.**

```
src/
├── app/          routes only: layouts, pages, api handlers, globals.css, fonts
├── auth.ts       next-auth config
├── components/   shared, feature-agnostic: ui/ (shadcn)
├── features/     <feature>/{components,hooks,types,config,constants,api,utils,reducers}
├── lib/          shared utils and API clients (lib/api/axios.ts, user-data.ts)
└── types/        types shared by multiple features (user-message, user-pref)
```

- Code used by one feature lives in that feature. Promote to `components/`, `lib/` or `types/` only when a second feature needs it.
- Features: auth, chat, sidebar, settings, analytics, connectors, voice.
- Imports use the `@/` alias, not deep relative paths.
- Naming: kebab-case files, `useX.ts` hooks, `*.types.ts` type files.

## 6. Rendering

**Server by default. Ship less JS.**

- Pages are server components. Auth gates run server-side with `auth()` + `redirect()`, not in client effects.
- Put `"use client"` on the smallest interactive leaf (e.g. `provider-buttons.tsx` inside the server `login.tsx`).
- Load dialogs and heavy libraries on demand: `next/dynamic` for dialogs, `await import()` for libraries like shiki.
- Keep config objects, markdown components, and Virtuoso `components`/renderers at module scope, not inline in render.
- Memoize handlers passed to memoized or virtualized children.

## 7. Styling

**Tailwind only. Use the tokens.**

- Brand color is `brand-*` (defined once in `app/globals.css` `@theme`). Never write `blue-*`.
- Neutrals are `stone-*`.
- Dark-mode dialogs follow Settings: header and footer `dark:bg-stone-950`, body `dark:bg-stone-900`, borders `dark:border-stone-700/50`.
- Filter tabs follow the connectors dialog: rounded-full pills, plain until hover, solid stone-900 (dark: stone-100) when active.
- Dropdown menus use the shared classes in `src/lib/menu.ts` (`MENU_CONTENT`, `MENU_ITEM`, …); destructive items use `variant="destructive"`.
- Fonts: `font-paragraph` for body text, `font-header` for the logo.

## 8. Comments

- One-line `//` comments only, and only where the "why" isn't obvious.
- No multi-line JSDoc blocks.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.
