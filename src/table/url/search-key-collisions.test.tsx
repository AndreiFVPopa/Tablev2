import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { DataTable } from "../components/data-table";
import {
  composeTableSearchValidator,
  SearchKeyCollisionError,
  type SearchKeyCollision,
} from "../index";
import { createDefaultTableState } from "../lib/table-state";
import { interpretSchema } from "../schema/index";

import { createCodecOptions } from "./resolve-codec-options";

const PAGE_SIZES = [10, 25] as const;

function codecOptions(schema: z.ZodType, urlNamespace?: string) {
  const { fields } = interpretSchema(schema);
  return createCodecOptions({
    fields,
    defaultPageSize: 25,
    pageSizes: PAGE_SIZES,
    ...(urlNamespace !== undefined ? { urlNamespace } : {}),
  });
}

function collisionOf(schema: z.ZodType, urlNamespace?: string): SearchKeyCollisionError {
  try {
    codecOptions(schema, urlNamespace);
  } catch (error) {
    if (error instanceof SearchKeyCollisionError) return error;
    throw error;
  }
  throw new Error("expected SearchKeyCollisionError");
}

function collision(error: SearchKeyCollisionError, key: string): SearchKeyCollision | undefined {
  return error.collisions.find((entry) => entry.key === key);
}

const distinctSchema = z.object({
  name: z.string(),
  age: z.number(),
  joined: z.date(),
});

describe("URL search-key collisions", () => {
  it("accepts a schema whose keys have one owner each", () => {
    const options = codecOptions(distinctSchema);
    expect(options.tableSearchKeySet.has("page")).toBe(true);
    expect(options.tableSearchKeySet.has("pageSize")).toBe(true);
    expect(options.tableSearchKeySet.has("sort")).toBe(true);
    expect(options.tableSearchKeySet.has("name")).toBe(true);
    expect(options.tableSearchKeySet.has("age")).toBe(true);
    expect(options.tableSearchKeySet.has("age.min")).toBe(true);
    expect(options.tableSearchKeySet.has("age.max")).toBe(true);
    expect(options.tableSearchKeySet.has("joined")).toBe(true);
    expect(options.tableSearchKeySet.has("joined.from")).toBe(true);
    expect(options.tableSearchKeySet.has("joined.to")).toBe(true);
    expect(interpretSchema(distinctSchema).diagnostics).toEqual([]);
  });

  it("rejects a filter that reuses page", () => {
    const error = collisionOf(
      z.object({
        name: z.string().meta({ table: { urlParam: "page" } }),
      }),
    );
    expect(collision(error, "page")?.owners).toEqual(["pagination.page", 'field "name"']);
    expect(error.message).toContain(
      'URL search key "page" is claimed by pagination.page and field "name".',
    );
  });

  it("rejects a filter that reuses pageSize", () => {
    const error = collisionOf(
      z.object({
        name: z.string().meta({ table: { urlParam: "pageSize" } }),
      }),
    );
    expect(collision(error, "pageSize")?.owners).toEqual(["pagination.pageSize", 'field "name"']);
  });

  it("rejects a filter that reuses sort", () => {
    const error = collisionOf(
      z.object({
        name: z.string().meta({ table: { urlParam: "sort" } }),
      }),
    );
    expect(collision(error, "sort")?.owners).toEqual(["sorting", 'field "name"']);
  });

  it("rejects two fields that share a custom urlParam", () => {
    const error = collisionOf(
      z.object({
        firstName: z.string().meta({ table: { urlParam: "person" } }),
        lastName: z.string().meta({ table: { urlParam: "person" } }),
      }),
    );
    expect(collision(error, "person")?.owners).toEqual(['field "firstName"', 'field "lastName"']);
  });

  it("rejects a custom urlParam that matches another field path", () => {
    const error = collisionOf(
      z.object({
        firstName: z.string(),
        lastName: z.string().meta({ table: { urlParam: "firstName" } }),
      }),
    );
    expect(collision(error, "firstName")?.owners).toEqual([
      'field "firstName"',
      'field "lastName"',
    ]);
  });

  it("rejects numeric range boundaries that match another field", () => {
    const error = collisionOf(
      z.object({
        age: z.number(),
        minimumAge: z.string().meta({ table: { urlParam: "age.min" } }),
        maximumAge: z.string().meta({ table: { urlParam: "age.max" } }),
      }),
    );
    expect(collision(error, "age.min")?.owners).toEqual([
      'field "age" minimum boundary',
      'field "minimumAge"',
    ]);
    expect(collision(error, "age.max")?.owners).toEqual([
      'field "age" maximum boundary',
      'field "maximumAge"',
    ]);
  });

  it("rejects date range boundaries that match another field", () => {
    const error = collisionOf(
      z.object({
        joined: z.date(),
        start: z.string().meta({ table: { urlParam: "joined.from" } }),
        end: z.string().meta({ table: { urlParam: "joined.to" } }),
      }),
    );
    expect(collision(error, "joined.from")?.owners).toEqual([
      'field "joined" from boundary',
      'field "start"',
    ]);
    expect(collision(error, "joined.to")?.owners).toEqual([
      'field "joined" to boundary',
      'field "end"',
    ]);
  });

  it("rejects two numeric fields that share range boundary keys", () => {
    const error = collisionOf(
      z.object({
        age: z.number().meta({ table: { urlParam: "limit" } }),
        score: z.number().meta({ table: { urlParam: "limit" } }),
      }),
    );
    expect(collision(error, "limit.min")?.owners).toEqual([
      'field "age" minimum boundary',
      'field "score" minimum boundary',
    ]);
    expect(collision(error, "limit.max")?.owners).toEqual([
      'field "age" maximum boundary',
      'field "score" maximum boundary',
    ]);
  });

  it("rejects a numeric boundary that matches a date boundary", () => {
    const error = collisionOf(
      z.object({
        age: z.number().meta({ table: { urlParam: "window.from" } }),
        joined: z.date().meta({ table: { urlParam: "window" } }),
      }),
    );
    expect(collision(error, "window.from")?.owners).toEqual([
      'field "age" reserved base key',
      'field "joined" from boundary',
    ]);
  });

  it("rejects a field that reuses a range field's reserved base key", () => {
    const error = collisionOf(
      z.object({
        age: z.number(),
        label: z.string().meta({ table: { urlParam: "age" } }),
      }),
    );
    expect(collision(error, "age")?.owners).toEqual([
      'field "age" reserved base key',
      'field "label"',
    ]);
    expect(error.message).toContain('field "age" reserved base key');
  });

  it("detects collisions after the namespace prefix is applied", () => {
    const schema = z.object({
      name: z.string().meta({ table: { urlParam: "page" } }),
    });
    const error = collisionOf(schema, "students");
    expect(collision(error, "students.page")?.owners).toEqual(["pagination.page", 'field "name"']);
    expect(error.message).toContain('URL search key "students.page"');
    expect(collisionOf(schema, "courses").collisions[0]?.key).toBe("courses.page");
  });

  it("keeps different namespaces independent when each table's keys are unique", () => {
    const students = codecOptions(distinctSchema, "students");
    const courses = codecOptions(distinctSchema, "courses");
    expect(students.tableSearchKeySet.has("students.page")).toBe(true);
    expect(students.tableSearchKeySet.has("students.age.min")).toBe(true);
    expect(students.tableSearchKeySet.has("students.age.max")).toBe(true);
    expect(students.tableSearchKeySet.has("students.joined.from")).toBe(true);
    expect(students.tableSearchKeySet.has("students.joined.to")).toBe(true);
    const overlap = [...students.tableSearchKeySet].filter((key) =>
      courses.tableSearchKeySet.has(key),
    );
    expect(overlap).toEqual([]);
  });

  it("preserves unrelated query parameters for a valid configuration", () => {
    const validate = composeTableSearchValidator(distinctSchema);
    const search = validate({ utm: "campaign", ref: "email", page: "2" });
    expect(search.utm).toBe("campaign");
    expect(search.ref).toBe("email");
    expect(search.page).toBe(2);
  });

  it("rejects an ambiguous schema when the public search validator is created", () => {
    const schema = z.object({
      name: z.string().meta({ table: { urlParam: "sort" } }),
    });
    expect(interpretSchema(schema).diagnostics).toEqual([]);
    expect(() => composeTableSearchValidator(schema)).toThrow(SearchKeyCollisionError);
    expect(() => composeTableSearchValidator(schema)).toThrow(
      'URL search key "sort" is claimed by sorting and field "name".',
    );
  });

  it("still renders a controlled table when the schema would be ambiguous in the URL", () => {
    const schema = z.object({
      name: z.string().meta({ table: { urlParam: "page" } }),
    });
    render(
      <DataTable
        schema={schema}
        data={[{ name: "Ana" }]}
        state={createDefaultTableState()}
        onStateChange={() => undefined}
      />,
    );
    expect(screen.getByRole("table")).toBeInTheDocument();
    expect(screen.getByText("Ana")).toBeInTheDocument();
  });

  it("rejects the URL-backed table before it can read or write the search string", () => {
    const schema = z.object({
      name: z.string().meta({ table: { urlParam: "page" } }),
    });
    expect(() => render(<DataTable schema={schema} data={[{ name: "Ana" }]} />)).toThrow(
      SearchKeyCollisionError,
    );
  });
});
