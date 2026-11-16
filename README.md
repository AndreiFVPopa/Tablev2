# Schema-Driven Data Table

A reusable schema-driven `<DataTable>` demonstrated through one Students (Elevi) feature.

- `/` redirects to `/elevi`
- `/elevi` — Students demo

The table interprets a Zod object schema to build columns, filters, sorting, and URL-persisted state. Demo rows come from a Zod-validated local JSON fixture under `src/mocks/students/` — not from HTTP. The DataTable itself is data-source agnostic and supports controlled mode as well as TanStack Router URL-backed mode.

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

The table is data-source agnostic: it does not depend on `@tanstack/react-query`, `fetch`, or fixtures. Pass validated rows as the `data` prop. A host application may load those rows from any source.

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

### Theme / design tokens

Table styles ship their own portable token layer in `src/table/styles/tokens.scss` (`--table-color-*`, `--table-space-*`, `--table-radius-*`, …) applied on `:root` when the table styles load. Override those CSS variables in the host app when theming; do not wire the table to application-global SCSS variables.

The demo app tokens (`src/app/styles/tokens.scss`) use foundation roles `top`, `main`, `secondary`, and `accent` plus semantic text/border/focus/error tokens. They never leak into `src/table/**`.

SCSS Modules use BEM with camelCase identifiers (`styles.dataTable`, `styles.filter__range`) so Stylelint, TypeScript, and Fallow agree on the same class export names.

### Known limitations

- TanStack Router is required for URL mode — there is no History API adapter.
- `z.date().min/max` bounds are not exposed on descriptors (Zod v4 public API gap); dates remain sortable/filterable by kind.
- Date JSON fixtures should use `z.coerce.date()` at the domain boundary so string inputs become `Date` while the interpreter still sees `ZodDate`.
- Default page size is `25` (`DEFAULT_PAGE_SIZE`); allowed sizes default to `[10, 25, 50, 100]`.

See `ARCHITECTURE.md`, `CONVENTIONS.md`, and `QUALITY.md` for deeper detail. An independent copy-paste harness lives outside this repo (`tablev2-portability-phase6`).

## Project status

- Phase 1 — engineering foundation + quality gate.
- Phase 2 — Zod v4 → `FieldDescriptor` interpreter.
- Phase 3 — schema-driven `<DataTable>` UI (TanStack Table v9).
- Phase 4 — TanStack Router URL codec + hooks.
- Phase 5 — Students/Products schemas, fixtures, `/elevi` + `/produse` (as shipped in v0.1.0).
- Phase 6 — portability verification, audits, documentation.
- v0.1.0 — released (Students + Products demos).
- v0.2.0 — consistency, fixture-only data, Students-only demo (in progress on `refactor/v0.2.0-consistency`).
