# Conventions

## Zod is the only domain source

- Every **domain / external / persisted** contract lives in Zod (`*.schema.ts`).
- Derived types live in `*.types.ts` and use `z.infer`, `z.input`, `z.output`.
- Do not maintain parallel interfaces, enum unions, or hand-written column/filter definitions for Zod-backed data.
- Zod metadata (`.meta({ title, table, ... })`) is the only place to override table presentation. Metadata may not contain functions or React components.
- Zod is **not** used for React component props, hook return values, or TanStack generics unless runtime validation is genuinely required.
- Prefer one validation boundary. Do not re-validate data that has already passed the schema interpreter or the URL codec.
- Feature domain models follow `*.schema.ts` + `*.types.ts` + `*.constants.ts` (for example `students.schema.ts`). Types are derived from the schema with `z.output` / `z.infer`.

## React

- Minimize `useEffect`. Never use it for data fetching, derived state, URL sync, or copying props into local state.
- Use TanStack Query for async state, TanStack Router for URL state, TanStack Table for table computations.
- TanStack Router is the single owner of URL search state inside the table too. Do not implement a parallel browser History store, `popstate` listener, or `useSyncExternalStore` URL synchronization layer. If the project outgrows TanStack Router, change router — not route-handling style.
- Prefer render-time calculations over `useMemo` / `useCallback` unless profiling shows a real need or reference stability is required for a dependency.
- Prefer controlled components.
- Follow the Rules of Hooks.

## Component folders

Prefer colocating a React component with only the files it actually needs:

```
components/
  component-name/
    component-name.tsx
    component-name.types.ts   # nontrivial prop / view-model contracts
    use-component-name.ts     # React-specific presentation / state logic
    component-name.test.tsx
    component-name.module.scss
    index.ts                  # re-exports the public surface of the folder
```

All of those files are **optional**. Do not create empty hooks, placeholder types, or barrels that only re-export one trivial symbol for the sake of the pattern.

### When to extract a hook

Extract a `use-*.ts` when the component has a cluster of React-aware presentation state (labels, derived aria text, event handlers bound to a TanStack instance) that obscures the JSX.

Do **not** extract:

- Trivial one-line calculations.
- Pure functions that do not call hooks — keep them as ordinary functions (same file or a sibling helper).
- Logic solely to satisfy a line-count or complexity metric.

Avoid hook chains that make the call graph hard to follow. Prefer one focused hook per component folder.

### When to use `*.types.ts`

Use a dedicated types file for nontrivial component contracts, shared view-models, or prop interfaces referenced from both the component and its hook/tests.

Skip a types file when the only export is a one-line alias that is clearer inline.

## TypeScript

- Strict mode with `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `useUnknownInCatchVariables`, `verbatimModuleSyntax`, `isolatedModules`.
- No `any`, unsafe casts, or unnecessary non-null assertions.
- `unknown` for anything untrusted (HTTP responses, external input). Validate with Zod before using.
- Discriminated unions + exhaustive switches where the shape permits.
- Use `import type` for type-only imports (enforced by ESLint).
- Prefer `readonly` on props and view-model fields.

## Import aliases

Configured in `tsconfig.base.json` `paths`, Vite, and Vitest:

| Alias         | Resolves to      |
| ------------- | ---------------- |
| `@/*`         | `src/*`          |
| `@table/*`    | `src/table/*`    |
| `@app/*`      | `src/app/*`      |
| `@shared/*`   | `src/shared/*`   |
| `@features/*` | `src/features/*` |
| `@mocks/*`    | `src/mocks/*`    |

Usage:

- Prefer `@table/...` inside `src/table/**` when crossing component or domain boundaries (for example filters → schema, components → lib).
- Prefer `@/...` (or the scoped `@app` / `@features` / `@shared` aliases) for application-level imports.
- Prefer `./...` for files in the same folder; one-level `../` is fine for immediate siblings under the same parent.
- Never import the public table barrel (`@table/index`, `@/table`, or `src/table/index.ts`) from inside `src/table/**`.

Porting `src/table/` to another React + TanStack Router host requires the `@table/*` → `src/table/*` alias (TypeScript `paths` + bundler resolve alias). Peer deps remain `react`, `@tanstack/react-table`, `@tanstack/react-router`, and `zod`.

## Typed semantic constants

- Meaningful domain values used in switches and comparisons live in `*.constants.ts` as `as const` objects (for example `FIELD_KINDS`, `FILTER_KINDS`, `DIAGNOSTIC_CODES`).
- Derive TypeScript unions from those objects with `(typeof CONST)[keyof typeof CONST]`. Do not maintain a parallel hand-written union of the same values.
- Keep runtime constants out of `*.types.ts` — that extension is for type declarations only.
- Preserve exhaustive `switch` statements and discriminated-union narrowing. Do not replace switches with registries.
- Do not invent constants for one-off UI copy, JSX attributes, CSS class names, or values already owned by TanStack, Zod, or React.

## Comments

- Source code is comment-free by default. Prefer self-documenting names, clear types, and small cohesive functions.
- Do not add single-line, block, JSDoc, or file-header comments that restate what the code already says.
- Exceptions are only for technically required directives or notices: lint/tool suppressions with a `--` reason, triple-slash references, license headers, generated-file markers, and configuration syntax that needs a type annotation (for example JSDoc `@type` in a `.js` config).
- Do not silence a quality finding with a comment when the finding can be fixed.

## Naming and file layout

- Schemas: `*.schema.ts`
- Runtime semantic constants: `*.constants.ts`
- Derived / colocated types: `*.types.ts`
- Request functions: `*.requests.ts`
- Query options: `*.queries.ts`
- Hooks: `use-*.ts`
- Pure helpers live beside their consumer. Shared helpers live in `src/shared/lib`.
- Feature UI lives inside the feature. Generic UI lives in `src/shared/components`.
- Table UI lives in `src/table/components/**`; pure filter predicates and filter-value types live in `src/table/filters/**` alongside filter UI folders.
- Do not split files only to satisfy a line-count target.
- The reusable table (`src/table/`) stays copy-paste portable. Do not move reusable table logic into `src/app/` or `src/features/`.

## Styles

- SCSS Modules colocated with the component that owns them.
- Shared filter chrome may live as `src/table/filters/filters.module.scss` when several filter widgets share the same classes.
- Design tokens live in `src/app/styles/tokens.scss` as CSS custom properties. Consumers use `var(--token)`.
- No Tailwind. Avoid `!important`; if a Stylelint suppression is unavoidable, use a directive with a `--` reason. Stylelint keeps selector depth and global usage in check.

## Labels and identifiers

- Table labels live in `src/table/table-labels.ts`. Consumers may override individual labels via the `labels` prop.
- Query keys, route IDs, and other shared identifiers are declared as `as const` constants, not scattered string literals.
- Ordinary one-off UI text may stay inline; only reused or semantic strings become constants.

## Tests

- Unit and component tests live beside the implementation (`*.test.ts(x)`).
- E2E tests live in `e2e/*.spec.ts`.
- Do not silence or weaken a test to make a check pass; fix the implementation or open a documented exception.

## Suppressions

- A suppression comment (`eslint-disable`, `fallow-ignore`, `@ts-expect-error`) must carry a `--` reason that explains what is suppressed and when it can be removed.
- Audited by `fallow audit` on each PR.
