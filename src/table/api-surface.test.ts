import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";

import {
  DATA_MODES,
  DataTable,
  DEFAULT_LABELS,
  DEFAULT_PAGE_SIZE,
  DEFAULT_PAGE_SIZES,
  FIELD_KINDS,
  composeTableSearchValidator,
  createDefaultTableState,
  resolveDefaultPageSize,
  resolveLabels,
  SearchKeyCollisionError,
  useDataTableUrlState,
  URL_VALUE_ENCODINGS,
  type BooleanFilterValue,
  type ColumnFilterValue,
  type ComposeTableSearchValidatorOptions,
  type DataMode,
  type DataTableProps,
  type DataTableState,
  type DateRangeFilterValue,
  type EnumFilterValue,
  type NumberRangeFilterValue,
  type TableLabels,
  type TagsFilterValue,
  type UseDataTableUrlStateOptions,
  type UseDataTableUrlStateResult,
  type UrlValueEncoding,
} from "./index";

import type { TableColumnDef } from "./lib/column-factory";
import type { TableFeaturesConfig } from "./lib/table-features";
import type { ColumnDef } from "@tanstack/react-table";
describe("DataTable public API — runtime values", () => {
  it("exposes the component and a default page-size catalogue", () => {
    expect(typeof DataTable).toBe("function");
    expect(DEFAULT_PAGE_SIZES).toEqual([10, 25, 50, 100]);
    expect(DEFAULT_PAGE_SIZE).toBe(25);
    expect(resolveDefaultPageSize(DEFAULT_PAGE_SIZES)).toBe(25);
    expect(resolveDefaultPageSize([1, 2, 10])).toBe(1);

    expect(Object.values(FIELD_KINDS)).toEqual([
      "text",
      "numeric",
      "boolean",
      "enum",
      "date",
      "tags",
    ]);
    const encoding: UrlValueEncoding = URL_VALUE_ENCODINGS.CANONICAL;
    expect(encoding).toBe("canonical");
    expect(Object.values(URL_VALUE_ENCODINGS)).toEqual(["canonical", "positional", "slug"]);
  });
  it("provides a controlled-state factory with sane defaults", () => {
    const s: DataTableState = createDefaultTableState();
    expect(s.pagination.pageIndex).toBe(0);
    expect(s.pagination.pageSize).toBe(DEFAULT_PAGE_SIZE);
  });
  it("ships a flat Romanian label bag that merges with overrides", () => {
    expect(DEFAULT_LABELS.tableEmpty).toBe("Nu există rezultate.");
    const merged: TableLabels = resolveLabels({ tableEmpty: "Gol" });
    expect(merged.tableEmpty).toBe("Gol");
    expect(merged.paginationFirst).toBe(DEFAULT_LABELS.paginationFirst);
  });
  it("exposes the Phase-4 URL helper and hook", () => {
    expect(typeof composeTableSearchValidator).toBe("function");
    expect(typeof useDataTableUrlState).toBe("function");
    expect(typeof SearchKeyCollisionError).toBe("function");
    const opts: ComposeTableSearchValidatorOptions = { urlNamespace: "s" };
    const hookOpts: UseDataTableUrlStateOptions = {
      schema: z.object({ name: z.string() }),
      pageSizes: [10],
      defaultPageSize: 10,
    };
    const resultShape: UseDataTableUrlStateResult = {
      state: createDefaultTableState(),
      onStateChange: () => undefined,
    };
    expect(opts.urlNamespace).toBe("s");
    expect(hookOpts.defaultPageSize).toBe(10);
    expect(resultShape.state.pagination.pageIndex).toBe(0);
  });
});
describe("TanStack ColumnDef generics", () => {
  it("uses ColumnDef<TFeatures, TData> with features first (row data is the second generic)", () => {
    interface SampleRow {
      readonly id: string;
    }
    expectTypeOf<TableColumnDef<SampleRow>>().toEqualTypeOf<
      ColumnDef<TableFeaturesConfig, SampleRow>
    >();
  });
});
describe("DataTable public API — type surface", () => {
  it("exports the client and server data modes", () => {
    expectTypeOf<DataMode>().toEqualTypeOf<(typeof DATA_MODES)[keyof typeof DATA_MODES]>();
    expect(DATA_MODES.CLIENT).toBe("client");
    expect(DATA_MODES.SERVER).toBe("server");
  });

  it("accepts controlled props with both state and onStateChange", () => {
    const schema = z.object({ name: z.string() });
    const props: DataTableProps<typeof schema> = {
      schema,
      data: [{ name: "Ana" }],
      state: createDefaultTableState(),
      onStateChange: () => undefined,
      pageSizes: [5, 10],
      labels: { tableEmpty: "x" },
    };
    expect(props.schema).toBe(schema);
  });

  it("accepts URL-backed props with urlNamespace and without state handlers", () => {
    const schema = z.object({ name: z.string() });
    const props: DataTableProps<typeof schema> = {
      schema,
      data: [],
      urlNamespace: "demo",
      pageSizes: [5, 10],
    };
    expect(props.urlNamespace).toBe("demo");
  });

  it("rejects incomplete controlled combinations at the type level", () => {
    const schema = z.object({ name: z.string() });
    expect(schema.shape.name).toBeDefined();
    type Props = DataTableProps<typeof schema>;
    type Row = z.output<typeof schema>;

    interface StateOnly {
      schema: typeof schema;
      data: readonly Row[];
      state: DataTableState;
    }
    interface HandlerOnly {
      schema: typeof schema;
      data: readonly Row[];
      onStateChange: (next: DataTableState) => void;
    }
    interface Controlled {
      schema: typeof schema;
      data: readonly Row[];
      state: DataTableState;
      onStateChange: (next: DataTableState) => void;
    }
    interface UrlOnly {
      schema: typeof schema;
      data: readonly Row[];
      urlNamespace: string;
    }

    expectTypeOf<StateOnly>().not.toExtend<Props>();
    expectTypeOf<HandlerOnly>().not.toExtend<Props>();
    expectTypeOf<Controlled>().toExtend<Props>();
    expectTypeOf<UrlOnly>().toExtend<Props>();
  });
  it("exposes every filter-value shape so routes can round-trip them", () => {
    const samples: {
      text: ColumnFilterValue;
      num: NumberRangeFilterValue;
      enu: EnumFilterValue;
      bool: BooleanFilterValue;
      tags: TagsFilterValue;
      date: DateRangeFilterValue;
    } = {
      text: "andrei",
      num: { min: 1, max: 10 },
      enu: "status",
      bool: true,
      tags: ["a", "b"],
      date: { from: "2026-01-01", to: "2026-12-31" },
    };
    expect(samples.text).toBe("andrei");
    expect(samples.num).toEqual({ min: 1, max: 10 });
    expect(samples.enu).toBe("status");
    expect(samples.bool).toBe(true);
    expect(samples.tags).toHaveLength(2);
    expect(samples.date).toEqual({ from: "2026-01-01", to: "2026-12-31" });
  });
});
