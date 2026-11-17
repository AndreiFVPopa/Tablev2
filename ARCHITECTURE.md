# Architecture

## Directory layout

```
src/
  app/        Shell, providers, router, routes.      Imports: anything except mocks.
  features/
    students/ Sole demo feature (Elevi).             Imports: table, shared, mocks.
  table/      Reusable schema-driven table.          Imports (peer deps only):
    schema/     Pure Zod interpreter.                  react/DOM/router/table forbidden; Zod allowed.
    url/        Pure URL encode/decode + route helper. react/DOM/router/table forbidden; Zod allowed.
    hooks/      Router-backed table hooks.             May import @tanstack/react-router.
    lib/        Column factory, features, formatters.  May import react / TanStack Table.
    components/   Component folders (see CONVENTIONS.md):
      data-table/              <DataTable> + use-data-table + styles + tests
      sort-button/             SortButton + use-sort-button
      data-table-pagination/   Pagination + hook + styles
      labels-context/          LabelsProvider / useLabels
    filters/      Pure predicates + filter UI folders:
      filter-functions.ts      Pure match predicates
      filter-values.types.ts   JSON-serializable filter value shapes
      parse-filter-value.ts    Unknown → typed filter values
      filters.module.scss      Shared filter chrome
      text-filter/ | number-range-filter/ | enum-filter/
      boolean-filter/ | tags-filter/ | date-range-filter/
      column-filter/           Kind dispatcher (uses FIELD_KINDS)
    schema/
      field-kinds.constants.ts / filter-kinds.constants.ts / diagnostic-codes.constants.ts
    table-labels.ts
    index.ts                   Public barrel (consumers only)
  shared/     Generic lib and UI.                    Imports: table.
  mocks/      Local JSON fixtures only.              Imports: anything except app.
  types/      Ambient *.d.ts declarations.           Imports: nothing.
e2e/          Playwright browser tests.
docs/         Repository documentation (this file and friends).
```

## Dependency rules (enforced)

Enforced by both `.fallowrc.jsonc` boundaries and ESLint `no-restricted-imports` so violations fail before they reach `main`.

| From \\ To   | app | table | shared | students | mocks | types |
| ------------ | --- | ----- | ------ | -------- | ----- | ----- |
| **app**      | —   | ✅    | ✅     | ✅       | ✖     | type  |
| **table**    | ✖   | —     | ✖      | ✖        | ✖     | type  |
| **shared**   | ✖   | ✅    | —      | ✖        | ✖     | type  |
| **students** | ✖   | ✅    | ✅     | —        | ✅    | type  |
| **mocks**    | ✖   | ✅    | ✅     | ✅       | —     | type  |
| **types**    | ✖   | ✖     | ✖      | ✖        | ✖     | —     |

Additional policies:

- `src/table/**` accepts a short, deliberate list of peer dependencies: `react`, `@tanstack/react-table`, `@tanstack/react-router`, `zod`. It must **not** import `@tanstack/react-query`, fixtures, or HTTP clients; data arrives as a prop.
- `src/table/schema/**` and `src/table/url/**` are pure TypeScript: no `react`, `react-dom`, `@tanstack/react-table`, or `@tanstack/react-router` imports. Zod is allowed. Router hooks live in `src/table/hooks/` and `src/table/components/`.
- `fetch()` is not allowed in `src/table` or `src/features/students`. The demo is fixture-only; host apps may fetch outside those zones and pass rows to `<DataTable>`.
- `boundaries.coverage.requireAllFiles: true` makes new files fail analysis until they land in a zone, so nothing silently escapes the policy.

## URL state is owned by TanStack Router

The table is explicit about this and does not try to abstract it away.

### Rules

1. TanStack Router is the single owner of URL search state. The table never listens to `popstate`, never calls `history.pushState`, never uses `useSyncExternalStore` to watch the URL.
2. All reading, validating, and writing of search parameters goes through `useSearch` and `useNavigate`.
3. URL state is authoritative. Pagination, sorting, and filter state are derived from search; the table does not keep a shadow React copy and does not use `useEffect` to sync them.
4. The URL always carries canonical `page`, `pageSize`, and `sort` keys even when they hold their default values, so a shared link is always a complete description.
5. Nested filter fields use dotted paths in the URL (for example `?address.city=Sibiu`). The path policy is defined in `src/table/url/` and tested there.
6. Changing a filter or `pageSize` resets `page` to 1.
7. Unrelated search parameters are preserved on every navigation.
8. Multiple tables may coexist on one route via a `urlNamespace` prop that prefixes the search keys.

### The composition helper

TanStack Router's `validateSearch` is a property of the route, not something a child component can register after the fact. So the table ships a small pure helper in `src/table/url/`:

```text
src/table/url/
  field-descriptor.ts         (produced by src/table/schema, re-used here as a type)
  compose-search-validator.ts (pure: schema → Zod validator for the table's search keys)
  encode.ts / decode.ts       (pure, schema-driven; no router dependency)
```

The hosting route composes the table's validator with its own:

```ts
// Consumer route — in the demo this lives in src/app/routes, outside src/table.
import { createFileRoute } from "@tanstack/react-router";
import { composeTableSearchValidator } from "@/table/url/compose-search-validator";
import { studentSchema } from "@features/students/schema/student.schema";

export const Route = createFileRoute("/elevi")({
  validateSearch: composeTableSearchValidator(studentSchema, {
    // optional per-route search extras
  }),
  component: StudentsPage,
});
```

The table then consumes and updates that validated search with router hooks living inside `src/table/hooks/` and `src/table/components/`. The pure layer and the React layer share one schema interpreter — no duplicated parsing logic.

### Required test coverage (Phase 4 — implemented)

Covered by `src/table/url/codec.test.ts` and `src/table/hooks/use-data-table-url-state.test.tsx`:

1. A copied table hosted under a different TanStack Router route works unchanged.
2. Canonical `page`, `pageSize`, and `sort` are always present in the URL, including defaults.
3. Invalid search parameters are normalized through the schema-derived validator.
4. Nested filter paths (`address.city`) round-trip through encode/decode.
5. Browser back / forward and full-page refresh restore the exact state.
6. Unrelated query parameters are preserved across navigation.
7. Two tables with distinct `urlNamespace` values coexist on the same route.
8. A static import scan proves `src/table/**` has no application-specific imports.

## Data flow

1. A feature `*.dataset.ts` imports a raw JSON fixture from `src/mocks/**` and validates it once with `parseDataset` against the domain dataset schema.
2. The hosting route composes `composeTableSearchValidator(schema)` with any route-specific search validation.
3. The feature page passes the validated dataset and schema into `<DataTable schema={…} data={…} />`.
4. The table derives columns, filter UI, and sorting from the schema.
5. The table reads and writes URL search state through TanStack Router hooks — no shadow state, no `useEffect`-based URL sync.

There is no demo HTTP client, data-source switch, or TanStack Query layer. Node.js remains required for Vite, pnpm, tests, and the production build — not as an application backend.

Phase 1 shipped the shell and directory policy. Phase 2 shipped the pure schema interpreter. Phase 3 shipped the controlled `<DataTable>` UI. Phase 4 shipped the router-backed URL codec and hooks. Phase 5 shipped domain schemas and fixtures (v0.1.0 included Students + Products; v0.2.0 keeps Students/`/elevi` only). Phase 6 verified portability.

## Feature data loading

- Domain contracts live in `src/features/students/*.{schema,types,constants}.ts`. Types are derived with `z.output`; dates use `z.coerce.date()` so JSON string fixtures validate without weakening the interpreter's `ZodDate` kind.
- Fixtures under `src/mocks/**` stay raw `unknown` (typed ambient). `students.dataset.ts` calls `parseDataset` once and exports a typed `StudentsDataset` (no silent drops).
- The Elevi page renders `<DataTable schema={studentSchema} data={studentsDataset} />` with no loading or network-error UI.
- Routes under `src/app/routes/` plug `composeTableSearchValidator(schema)` into `validateSearch`. `/` redirects to `/elevi`.

## URL value encodings (enum / tags)

Canonical dataset values, display labels, and URL tokens are separate:

| Layer          | Example                             |
| -------------- | ----------------------------------- |
| Canonical data | `gender: "male"`, `tags: ["bursă"]` |
| Display label  | `Masculin`, `bursă`                 |
| URL token      | `gen=1`, `tags=bursa`               |

Configure via Zod `table` metadata (no Students-specific codec branches):

```ts
z.enum(["male", "female"]).meta({
  title: "Gen",
  table: {
    urlParam: "gen",
    urlValueEncoding: URL_VALUE_ENCODINGS.POSITIONAL,
    optionLabels: { male: "Masculin", female: "Feminin" },
  },
});

z.array(z.enum(["bursă", "olimpic"])).meta({
  title: "Etichete",
  table: { urlValueEncoding: URL_VALUE_ENCODINGS.SLUG },
});
```

Strategies (`URL_VALUE_ENCODINGS`):

- `canonical` (default) — URL token equals the option string.
- `positional` — 1-based index of the schema option order (`male` → `1`). Opt-in; enum only. Order changes change shared URLs. Preferred for short binary enums; not a boolean type.
- `slug` — ASCII slug from Unicode NFD normalization + diacritic stripping (`bursă` → `bursa`). Collisions emit a diagnostic and force canonical encoding unless `urlSlugOverrides` resolves them — never a half-applied slug map.

Invalid tokens are dropped (no crash). TanStack filter state always stores canonical values. Controlled mode does not require encoding configuration.

## Portability and URL authority (Phase 6)

- `src/table/` must remain copy-paste portable. Accepted peers: `react`, `@tanstack/react-table`, `@tanstack/react-router`, `zod` (+ SCSS Modules). No `@tanstack/react-query`, HTTP clients, or fixture imports.
- Default page size is shared via `src/table/lib/page-sizes.ts` (`DEFAULT_PAGE_SIZE = 25`, `DEFAULT_PAGE_SIZES`, `resolveDefaultPageSize`) so `composeTableSearchValidator` and URL-backed `DataTable` stay aligned.
- URL-backed tables set `autoResetPageIndex: false` so TanStack Table cannot overwrite URL-authoritative pagination after sort/filter prop updates.
- Controlled mode (`state` + `onStateChange`) and URL mode remain mutually exclusive (XOR props).
- Table design tokens live in `src/table/styles/tokens.scss` (`--table-*` on `:root`). The table never imports `src/app/styles/**`. Host apps override `--table-*` CSS variables for theming.

- App chrome tokens (`src/app/styles/tokens.scss`) use foundation roles `top`, `main`, `secondary`, and `accent`. Component SCSS Modules use BEM; Vite maps locals to camelCase for TypeScript.

## Schema interpreter (Phase 2)

`src/table/schema/` turns any Zod v4 object schema into a stable, framework-agnostic shape the table, filters, sorting, and URL codec can share.

- `descriptors.ts` — public types: `FieldKind` (`text | numeric | boolean | enum | date | tags`), the `FieldDescriptor` discriminated union, `FieldWrappers` (optional / nullable / default / readonly), `ResolvedFieldMeta` (title / description / deprecated / hidden), diagnostic types, and the capability helpers `isSortableKind` and `defaultFilterKind`. Augments Zod v4's `GlobalMeta` with an opt-in `table?: TableFieldMeta` key read via `schema.meta()`.
- `interpret.ts` — exposes `interpretSchema(schema, options?) → { fields, diagnostics }` and orchestrates object walking. Leaf construction lives in `build-leaf-descriptor.ts`, wrapper peeling in `unwrap-schema.ts`, metadata resolution in `resolve-field-meta.ts`. Uses only public, non-deprecated Zod v4 APIs (`instanceof z.ZodString/Number/…`, `schema.shape`, `schema.element`, `schema.options`, `schema.unwrap()`, `schema.minLength` / `maxLength` / `minValue` / `maxValue` / `format`, `schema.meta()`). Zod v4 `unwrap()` / `element` return core `$ZodType`; `toClassicZodType` is the single bridge back to classic `z.ZodType`. Never touches `_def` / `_zod` and never suppresses a deprecation diagnostic. See "Zod v4 date-bounds limitation" below.

- `index.ts` — barrel; re-exported through `src/table/index.ts` so consumers import from `@/table`.

Rules:

- The root schema must be `z.object(...)` (optional/nullable/default/readonly wrappers are unwrapped). Any other root produces one `root-not-object` diagnostic.
- Nested objects flatten to dot-separated paths (`address.city`, `address.geo.lat`).
- A schema key that itself contains a literal `.` is rejected with a `dotted-key` diagnostic and omitted from `fields`.
- Unsupported leaf schemas (`bigint`, `union`, `record`, `map`, `set`, `literal`, `tuple`, `any`, `unknown`, non-string enum, array-of-non-enum) each emit an explicit diagnostic. Nothing fails silently.
- When `{ throwOnDiagnostics: true }` is passed, a `SchemaInterpretationError` is thrown with the diagnostics list. The only class in the module exists for that identity.
- No classes beyond the error, no registries, no generic plugin system. Adding a new Zod kind is an `instanceof` branch in `buildLeafDescriptor` and a new descriptor variant — editable by anyone, auditable with one `rg instanceof src/table/schema`.

The cascading test (`src/table/schema/interpret.cascading.test.ts`) proves the derivation is real: flipping `age: z.number()` to `z.string()` changes `kind`, `isSortableKind`, and `defaultFilterKind` without a single hand-written column, filter, or configuration change.

### Zod v4 date-bounds limitation

`z.date().min(...)` and `z.date().max(...)` are supported as validators, but Zod v4 does not expose their configured bounds through a public, non-deprecated accessor:

- `ZodDate.minDate` / `ZodDate.maxDate` are the only public getters; both are marked `@deprecated Not recommended` with no documented replacement.
- `z.toJSONSchema(z.date())` throws `"Date cannot be represented in JSON Schema"`.
- The only non-deprecated path is `schema._zod.def.checks`, which the Zod docs describe as "for library implementers building their own Zod"; `src/table/schema/**` is forbidden by project policy from touching `_zod` / `_def`.

Phase 2 therefore interprets `z.date()` as `kind: "date"` without exposing `min` / `max` on the descriptor. The field is still sortable and filterable by kind, and `DateFieldDescriptor` deliberately has no `min` / `max` keys so no consumer accidentally relies on absent data.

When Zod ships a public replacement (or we are explicitly approved to consume `_zod.def.checks`), the fix is one small change in `interpret.ts`'s `ZodDate` branch plus adding `min` and `max` to `DateFieldDescriptor`. The verification test `src/table/schema/interpret.test.ts` already pins the current behavior.

## DataTable component (Phase 3)

`src/table/components/data-table.tsx` ships the reusable, schema-driven `<DataTable>` consumed by the Elevi demo. Phase 3 shipped it as a fully controlled component; Phase 4 wrapped that contract with optional URL-backed mode so the public call site is `<DataTable schema={schema} data={data} />`.

### Public API (barrel: `src/table/index.ts`)

- **Component** — `DataTable<TData>({ schema, data, state?, onStateChange?, labels?, pageSizes?, urlNamespace? })`. Omit `state`/`onStateChange` for URL-backed mode; pass both for fully controlled mode.
- **Controlled state** — `DataTableState` (`{ pagination, sorting, columnFilters }`), `createDefaultTableState(partial?)`, `DEFAULT_PAGE_SIZE`, `DEFAULT_PAGE_SIZES` (`[10, 25, 50, 100]`).
- **Labels** — `TableLabels` (flat Romanian strings for every piece of chrome), `DEFAULT_LABELS`, `resolveLabels(partial?)`.
- **Filter-value shapes** — `NumberRangeFilterValue`, `EnumFilterValue`, `BooleanFilterValue`, `TagsFilterValue`, `DateRangeFilterValue`, and the `ColumnFilterValue` union. The Phase-4 URL codec round-trips these without inventing new shapes.
- **URL helpers (Phase 4)** — `composeTableSearchValidator(schema, options?)`, `useDataTableUrlState(options)`.

### Design choices

- **TanStack Table v9 (plugin API).** The project pins `@tanstack/react-table@^9.3.1`, whose `tableFeatures({...})` helper replaces v8's row-model getters. All features and row models are registered once in `src/table/lib/table-features.ts` as `TABLE_FEATURES`; every column, filter function, and sort function is typed against `TableFeaturesConfig`. The component calls `useTable({ features: TABLE_FEATURES, ... })`.
- **Columns derive from descriptors.** `src/table/lib/column-factory.tsx` is the single bridge between the Phase-2 interpreter and the table engine. Each column gets `accessorFn = getValueAtPath(row, descriptor.segments)`, a kind-dispatched `cell` renderer (`FormattedCell → formatValue`), the right `filterFn`, and a kind-dispatched `sortFn`. `isSortableKind(descriptor.kind)` drives `enableSorting`, so tag columns have no sort control. All kinds use ascending-first (`sortDescFirst: false`) for consistent UX.
- **Pure where practical.** `src/table/lib/format-value.ts`, `src/table/lib/get-value-at-path.ts`, and `src/table/filters/shared/filter-functions.ts` are pure modules with no React or DOM dependency; each is tested as a pure function and then wrapped by thin React adapters.
- **Filter widgets per kind.** Six small components under `src/table/filters/` (`text`, `number-range`, `enum`, `boolean` as radio group, `tags` as checkbox multi-select, `date-range`). Each uses the shared `FilterComponentProps<D, V>` shape and calls `onChange(undefined)` to clear. `column-filter.tsx` dispatches on `descriptor.kind`.
- **Labels centralised.** Every user-visible string the table renders lives in `src/table/table-labels.ts` with Romanian defaults. The component merges `labels?` over `DEFAULT_LABELS` with `resolveLabels` and publishes them through a light React Context (`src/table/components/labels-context.tsx`) so widgets read the merged bag without prop drilling.
- **Controlled component.** The table reads from `state` and emits every change to `onStateChange`. Filter and `pageSize` transitions reset `pageIndex` to `0`. This is the same shape Phase 4's URL hooks will produce, so wrapping with router hooks is additive.
- **Accessibility.** The `<table>` carries `aria-label={labels.tableLandmark}`; sortable headers cycle `aria-sort` through `none | ascending | descending`; the sort button's `aria-label` reads `${labels.sortLabelPrefix} ${title}: ${nextAction}`; each filter widget has an `aria-label` tied to its descriptor title; pagination is wrapped in a `<nav aria-label>` landmark with named previous/next/first/last buttons.
- **No `useEffect` for derived state.** The two `useMemo`s derive columns (from the schema) and resolved labels (from the override). All other state lives on the TanStack table instance.

### Test coverage

Phase 3 adds four new test files (57 new tests, 116 total):

- `src/table/lib/pure-helpers.test.ts` — `getValueAtPath`, `formatValue` for every kind, `createDefaultTableState`.
- `src/table/filters/shared/filter-functions.test.ts` — the six pure predicates with their full value space.
- `src/table/components/data-table.test.tsx` — end-to-end: column generation, nested dotted paths, cell rendering per kind, each filter kind, sorting including tags-not-sortable, pagination (page-size reset, next/previous), labels override, empty state, accessibility (aria-sort, aria-labels, navigation landmark), controlled-state transitions, and an unrelated third schema.
- `src/table/api-surface.test.ts` — imports every runtime value and type from `src/table/index.ts` so a deleted export fails the gate.

### Zod v4 date-bounds limitation (unchanged)

Phase 3 does not re-introduce the deprecated `minDate` / `maxDate` getters. Date filters remain fully functional through the `DateRangeFilterValue` shape; if Zod ships a public date-bounds API later, `DateFieldDescriptor` can gain `min` / `max` without breaking any Phase-3 widget.

## URL integration (Phase 4)

All reusable URL logic lives inside `src/table/`. There is no native History API sync and no generic router adapter — only TanStack Router.

### Modules

```
src/table/schema/              Zod interpretation + descriptors + metadata config validation
  interpret / build-leaf / resolve-field-meta / unwrap / field-meta.schema
  option-encoding-config.ts    Encoding compatibility + slug collision checks + toUrlSlug
  url-value-encoding.constants.ts
src/table/filters/
  shared/                      Filter-value Zod contracts, parsers, predicates, shared SCSS
  text|enum|boolean|tags|number-range|date-range-filter/   Colocated UI
  column-filter/               Kind dispatcher
src/table/url/                 Search serialization (no React)
  option-encoding.ts           encode/decode tokens (imports toUrlSlug from schema)
  filter-encoders|decoders|value-codec, pagination, sort, search-*, table-state-codec
src/table/hooks/
  use-data-table-url-state.ts
```

Dependency direction: `schema` → (no url). `filters` → schema. `url` → schema + filters/shared. `hooks` → schema + url.
`toUrlSlug` lives in `src/table/lib/to-url-slug.ts` (pure string helper). Schema config validation and URL token encode/decode both import it — no schema↔url cycle and no duplicated slug algorithm.

URL search validation uses FieldDescriptors once (via `createCodecOptions` / `resolveCodecOptions`), not a dynamic Zod URL schema. Known table keys are precomputed into `tableSearchKeySet`; range sub-keys are only claimed for numeric/date fields.

Positional encoding remains a generic enum strategy (1-based option order). The intended primary use case is binary fields such as Active/Inactive, Male/Female, or Yes/No; it is not yet scoped to a dedicated binary-filter API, and two-option enums are not treated as booleans.

### Single source of truth

1. The hosting route plugs `composeTableSearchValidator(schema, { urlNamespace?, pageSizes?, extend? })` into `createFileRoute({ validateSearch })`.
2. `<DataTable schema data />` (no `state`/`onStateChange`) calls `useDataTableUrlState`, which re-derives `DataTableState` from `useSearch` on every render and writes via `navigate({ to: ".", search })`.
3. Both sides close over the same `FieldDescriptor[]` from `interpretSchema` and share `encodeTableState` / `decodeTableState`. There is no second parser and no `useEffect`-based URL sync.

### Wire format

- Canonical keys `page` (1-based number), `pageSize` (number), `sort` (string) are **always** written, including defaults.
- Filter keys use the field's dotted path (`address.city`) and range sub-keys (`age.min`, `joined.from`).
- `urlNamespace` prefixes every key (`students.page`, `students.address.city`).
- `page` / `pageSize` / numeric bounds / booleans are typed (not stringified) so TanStack Router's default serializer emits `page=1` / `active=true` instead of JSON-quoted strings.
- Unrelated search parameters are preserved by `stripTableKeys` on every navigation.
- Filter and `pageSize` changes reset `page` to 1 on the **write** side (inside `DataTableControlled`); the decoder mirrors the URL so back/forward/refresh restore the exact previous page.

### Consumer shape

```ts
// Route
export const Route = createFileRoute("/elevi")({
  validateSearch: composeTableSearchValidator(studentSchema),
  component: StudentsPage,
});

// Page — closest public API to `<DataTable schema data />`
<DataTable schema={studentSchema} data={rows} />
```

## Why `types` has its own zone

Ambient `*.d.ts` declarations (`src/types/modules.d.ts`, `src/types/eslint-plugins.d.ts`, `src/vite-env.d.ts`) do not produce runtime imports. They sit in a `types` zone with no outgoing edges, and every other zone may import from them type-only. This keeps `requireAllFiles: true` honest without inviting type declarations to leak into runtime code.

## TypeScript project references

`tsconfig.json` composes three project references:

- `tsconfig.app.json` — all source and unit tests (uses `vitest/globals` and `@testing-library/jest-dom` types).
- `tsconfig.node.json` — config files (`vite.config.ts`, `eslint.config.ts`, etc.) with Node globals.
- `tsconfig.e2e.json` — Playwright tests under `e2e/`.

Running `tsc -b --noEmit` type-checks all three.

## Import aliases

| Alias         | Target           |
| ------------- | ---------------- |
| `@/*`         | `src/*`          |
| `@table/*`    | `src/table/*`    |
| `@app/*`      | `src/app/*`      |
| `@shared/*`   | `src/shared/*`   |
| `@features/*` | `src/features/*` |
| `@mocks/*`    | `src/mocks/*`    |

Wired in `tsconfig.base.json` `compilerOptions.paths`, `vite.config.ts`, and `vitest.config.ts`. ESLint resolves them via `import-x` + TypeScript. Playwright e2e uses `tsconfig.e2e.json` (same paths) for any typed imports.

Inside `src/table/**`, prefer `@table/<area>/...` when crossing folders; keep `./` for same-folder files. Never import `@table/index` from inside the table package — that barrel is for app/features/shared consumers only.

### Porting `src/table/`

Copy the directory and configure the host with:

```ts
// vite / vitest resolve.alias
"@table": fileURLToPath(new URL("./src/table", import.meta.url))

// tsconfig paths
"@table/*": ["./src/table/*"]
```

Accepted peer dependencies: `react`, `@tanstack/react-table`, `@tanstack/react-router`, `zod`. Do not add reverse imports from `src/table` into `src/app`, `src/features`, or `src/shared`.
