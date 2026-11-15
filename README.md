# Schema-Driven Data Table

A small React + TypeScript demo of a reusable data table whose behavior is derived from Zod schemas.

Two pages, one table:

- `/elevi` — Students
- `/produse` — Products

Both consume the same `<DataTable>` from `src/table`. The table interprets a Zod object schema to build columns, filters, sorting, and URL-persisted state.

## Requirements

- Node 22+
- pnpm 12+

## Scripts

```sh
pnpm install

pnpm dev           # start the dev server
pnpm build         # production build
pnpm preview       # serve the production build

pnpm test          # vitest run
pnpm test:watch    # vitest in watch mode
pnpm test:cov      # vitest + coverage
pnpm e2e           # playwright (requires build/preview; config boots the preview server)

pnpm lint          # eslint
pnpm stylelint     # stylelint on SCSS/CSS
pnpm format        # prettier --write
pnpm format:check  # prettier --check

pnpm fallow:arch   # architecture boundaries + cycles
pnpm fallow:dead   # dead files / exports / dependencies
pnpm fallow:health # complexity + maintainability

pnpm quality       # full gate (CI equivalent)
pnpm quality:local # lighter local gate used by pre-push
```

## Copying the table into another project

`src/table/` is the reusable surface. Copy that directory only — do not pull `src/app`, `src/features`, `src/mocks`, or `src/shared`.

### Peer dependencies

| Package                  | Role                                                              |
| ------------------------ | ----------------------------------------------------------------- |
| `react` / `react-dom`    | UI                                                                |
| `@tanstack/react-table`  | row models, sorting, filtering, pagination                        |
| `@tanstack/react-router` | exclusive owner of URL search state (`useSearch` / `useNavigate`) |
| `zod`                    | schema interpretation + `composeTableSearchValidator`             |
| SCSS Modules             | component styles (Vite/`sass` or equivalent)                      |

The table does **not** depend on `@tanstack/react-query`. Data is always a prop.

### Alias

Configure `@table` → `src/table` in both the bundler and TypeScript:

```ts
// vite.config.ts
resolve: {
  alias: {
    "@table": fileURLToPath(new URL("./src/table", import.meta.url)),
  },
}
```

```json
// tsconfig paths
{ "@table/*": ["src/table/*"] }
```

Inside `src/table/**`, cross-folder imports use `@table/...`. Never import the public barrel (`@table/index`) from inside the table.

### TanStack Router setup

1. Host the table inside a TanStack Router route tree.
2. On the route, set `validateSearch: composeTableSearchValidator(schema, options?)`.
3. Optionally pass `pageSizes` / `defaultPageSize` / `urlNamespace` to keep the validator aligned with the table props.
4. Render URL mode with `<DataTable schema={schema} data={data} />`.
5. For controlled mode (tests or non-URL hosts), pass `state` and `onStateChange` together.
6. Use `urlNamespace` when two tables share one route.

Canonical URL keys always include `page`, `pageSize`, and `sort` (even at defaults). Changing a filter or `pageSize` resets `page` to 1. Unrelated query parameters are preserved.

### Supported Zod field kinds

`text`, `numeric`, `boolean`, `enum`, `date`, `tags` (array of string enums), plus nested objects flattened to dotted paths (`address.city`).

Unsupported leaves emit diagnostics from `interpretSchema` rather than failing silently.

### Known limitations

- TanStack Router is required for URL mode — there is no History API adapter.
- `z.date().min/max` bounds are not exposed on descriptors (Zod v4 public API gap); dates remain sortable/filterable by kind.
- Date JSON fixtures should use `z.coerce.date()` at the domain boundary so string inputs become `Date` while the interpreter still sees `ZodDate`.
- Default page size is `25` (`DEFAULT_PAGE_SIZE`); allowed sizes default to `[10, 25, 50, 100]`.

See `ARCHITECTURE.md`, `CONVENTIONS.md`, and `QUALITY.md` for deeper detail. An independent copy-paste harness lives outside this repo during Phase 6 verification (`tablev2-portability-phase6`).

## Project status

- Phase 1 — engineering foundation + quality gate.
- Phase 2 — Zod v4 → `FieldDescriptor` interpreter.
- Phase 3 — schema-driven `<DataTable>` UI (TanStack Table v9).
- Phase 4 — TanStack Router URL codec + hooks.
- Phase 5 — Students/Products schemas, fixtures, Query layer, `/elevi` + `/produse`.
- Phase 6 — portability verification, audits, documentation.
