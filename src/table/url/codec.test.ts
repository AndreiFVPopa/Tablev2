import { describe, expect, it } from "vitest";
import { z } from "zod";

import { interpretSchema } from "../schema/index";

import {
  canonicaliseSearch,
  decodeTableState,
  encodeTableState,
  shallowEqual,
  stripTableKeys,
  type CodecOptions,
  type CodecTableState,
} from "./codec";
import { composeTableSearchValidator } from "./compose-search-validator";
import { parseSort, stringifySort } from "./sort";
const Schema = z.object({
  name: z.string().meta({ title: "Nume" }),
  age: z.number().meta({ title: "Vârstă" }),
  active: z.boolean().meta({ title: "Activ" }),
  status: z.enum(["new", "done"]).meta({ title: "Status" }),
  tags: z.array(z.enum(["a", "b", "c"])).meta({ title: "Etichete" }),
  joined: z.date().meta({ title: "Înscris" }),
  address: z.object({
    city: z.string().meta({ title: "Oraș" }),
  }),
});
const PAGE_SIZES = [10, 25, 50] as const;
function options(overrides: Partial<CodecOptions> = {}): CodecOptions {
  const { fields } = interpretSchema(Schema);
  return {
    fields,
    defaultPageSize: 25,
    pageSizes: PAGE_SIZES,
    ...overrides,
  };
}
function defaultState(overrides: Partial<CodecTableState> = {}): CodecTableState {
  return {
    pagination: { pageIndex: 0, pageSize: 25 },
    sorting: [],
    columnFilters: [],
    ...overrides,
  };
}
describe("sort token", () => {
  it("stringifies ascending / descending / empty", () => {
    expect(stringifySort([])).toBe("");
    expect(stringifySort([{ id: "name", desc: false }])).toBe("name");
    expect(stringifySort([{ id: "address.city", desc: true }])).toBe("-address.city");
  });
  it("parses ascending / descending / empty / malformed", () => {
    expect(parseSort("")).toEqual([]);
    expect(parseSort(undefined)).toEqual([]);
    expect(parseSort("name")).toEqual([{ id: "name", desc: false }]);
    expect(parseSort("-name")).toEqual([{ id: "name", desc: true }]);
    expect(parseSort("-")).toEqual([]);
    expect(parseSort(42)).toEqual([]);
  });
});
describe("encodeTableState", () => {
  it("always writes page, pageSize, and sort — even at defaults", () => {
    const encoded = encodeTableState(defaultState(), options());
    expect(encoded).toEqual({ page: 1, pageSize: 25, sort: "" });
  });
  it("encodes 1-based page and descending sort", () => {
    const encoded = encodeTableState(
      defaultState({
        pagination: { pageIndex: 2, pageSize: 10 },
        sorting: [{ id: "name", desc: true }],
      }),
      options(),
    );
    expect(encoded.page).toBe(3);
    expect(encoded.pageSize).toBe(10);
    expect(encoded.sort).toBe("-name");
  });
  it("encodes every filter kind and nested dotted paths", () => {
    const encoded = encodeTableState(
      defaultState({
        columnFilters: [
          { id: "name", value: "Ana" },
          { id: "age", value: { min: 18, max: 40 } },
          { id: "active", value: true },
          { id: "status", value: "done" },
          { id: "tags", value: ["a", "c"] },
          { id: "joined", value: { from: "2026-01-01", to: "2026-12-31" } },
          { id: "address.city", value: "Cluj" },
        ],
      }),
      options(),
    );
    expect(encoded.name).toBe("Ana");
    expect(encoded["age.min"]).toBe(18);
    expect(encoded["age.max"]).toBe(40);
    expect(encoded.active).toBe(true);
    expect(encoded.status).toBe("done");
    expect(encoded.tags).toBe("a,c");
    expect(encoded["joined.from"]).toBe("2026-01-01");
    expect(encoded["joined.to"]).toBe("2026-12-31");
    expect(encoded["address.city"]).toBe("Cluj");
  });
  it("prefixes every key when a urlNamespace is set", () => {
    const encoded = encodeTableState(
      defaultState({
        columnFilters: [{ id: "name", value: "Ana" }],
        sorting: [{ id: "name", desc: false }],
      }),
      options({ urlNamespace: "students" }),
    );
    expect(encoded["students.page"]).toBe(1);
    expect(encoded["students.pageSize"]).toBe(25);
    expect(encoded["students.sort"]).toBe("name");
    expect(encoded["students.name"]).toBe("Ana");
    expect(encoded.page).toBeUndefined();
  });
});
describe("decodeTableState", () => {
  it("fills defaults when the search record is empty", () => {
    const decoded = decodeTableState({}, options());
    expect(decoded).toEqual(defaultState());
  });
  it("round-trips a fully populated record", () => {
    const opts = options();
    const original = defaultState({
      pagination: { pageIndex: 1, pageSize: 10 },
      sorting: [{ id: "address.city", desc: true }],
      columnFilters: [
        { id: "name", value: "Ana" },
        { id: "age", value: { min: 20 } },
        { id: "active", value: false },
        { id: "status", value: "new" },
        { id: "tags", value: ["b"] },
        { id: "joined", value: { from: "2026-06-01" } },
        { id: "address.city", value: "Sibiu" },
      ],
    });
    const encoded = encodeTableState(original, opts);
    expect(decodeTableState(encoded, opts)).toEqual(original);
  });
  it("clamps invalid pageSize to the default and drops invalid filters", () => {
    const decoded = decodeTableState(
      {
        page: "0",
        pageSize: "999",
        sort: "-unknown",
        name: "",
        status: "not-an-option",
        active: "maybe",
        tags: "x,y",
        "age.min": "nope",
        "joined.from": "not-a-date",
      },
      options(),
    );
    expect(decoded.pagination.pageIndex).toBe(0);
    expect(decoded.pagination.pageSize).toBe(25);
    expect(decoded.sorting).toEqual([{ id: "unknown", desc: true }]);
    expect(decoded.columnFilters).toEqual([]);
  });
  it("accepts numeric page / pageSize that arrive as numbers (router coercion)", () => {
    const decoded = decodeTableState({ page: 4, pageSize: 10, sort: "" }, options());
    expect(decoded.pagination).toEqual({ pageIndex: 3, pageSize: 10 });
  });
});
describe("canonicaliseSearch", () => {
  it("fills missing canonical keys and preserves unrelated parameters", () => {
    const out = canonicaliseSearch({ tab: "overview", ref: "share-link", name: "Ana" }, options());
    expect(out.page).toBe(1);
    expect(out.pageSize).toBe(25);
    expect(out.sort).toBe("");
    expect(out.name).toBe("Ana");
    expect(out.tab).toBe("overview");
    expect(out.ref).toBe("share-link");
  });
  it("drops empty / invalid filter slots while keeping unrelated keys", () => {
    const out = canonicaliseSearch(
      { name: "", status: "bogus", utm: "campaign", page: "2" },
      options(),
    );
    expect(out.name).toBeUndefined();
    expect(out.status).toBeUndefined();
    expect(out.utm).toBe("campaign");
    expect(out.page).toBe(2);
  });
});
describe("stripTableKeys", () => {
  it("removes only this table's keys", () => {
    const stripped = stripTableKeys(
      {
        page: "1",
        pageSize: "25",
        sort: "",
        name: "Ana",
        tab: "overview",
      },
      options(),
    );
    expect(stripped).toEqual({ tab: "overview" });
  });
  it("with a namespace, leaves other namespaces alone", () => {
    const stripped = stripTableKeys(
      {
        "students.page": "1",
        "students.name": "Ana",
        "products.page": "2",
        "products.name": "Widget",
        shared: "x",
      },
      options({ urlNamespace: "students" }),
    );
    expect(stripped).toEqual({
      "products.page": "2",
      "products.name": "Widget",
      shared: "x",
    });
  });
});
describe("shallowEqual", () => {
  it("compares encoded search records by key/value identity", () => {
    expect(shallowEqual({ a: "1" }, { a: "1" })).toBe(true);
    expect(shallowEqual({ a: "1" }, { a: "2" })).toBe(false);
    expect(shallowEqual({ a: "1" }, { a: "1", b: "2" })).toBe(false);
  });
});
describe("composeTableSearchValidator", () => {
  it("canonicalises table keys and preserves extras", () => {
    const validate = composeTableSearchValidator(Schema, {
      pageSizes: PAGE_SIZES,
      defaultPageSize: 25,
    });
    const out = validate({ name: "Ana", tab: "list" });
    expect(out.page).toBe(1);
    expect(out.pageSize).toBe(25);
    expect(out.sort).toBe("");
    expect(out.name).toBe("Ana");
    expect(out.tab).toBe("list");
  });
  it("runs the optional `extend` callback on the stripped extras", () => {
    const validate = composeTableSearchValidator(Schema, {
      pageSizes: PAGE_SIZES,
      extend: (extras) => ({ ...extras, injected: "yes" }),
    });
    const out = validate({ name: "Ana", tab: "list" });
    expect(out.injected).toBe("yes");
    expect(out.tab).toBe("list");
    expect(out.name).toBe("Ana");
    expect(out.page).toBe(1);
  });
  it("shares the codec with encode/decode under a namespace", () => {
    const validate = composeTableSearchValidator(Schema, {
      urlNamespace: "s",
      pageSizes: PAGE_SIZES,
      defaultPageSize: 25,
    });
    const out = validate({ "s.name": "Ana", foreign: "1" });
    expect(out["s.page"]).toBe(1);
    expect(out["s.pageSize"]).toBe(25);
    expect(out["s.sort"]).toBe("");
    expect(out["s.name"]).toBe("Ana");
    expect(out.foreign).toBe("1");
  });
});
