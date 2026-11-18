import { sortFn_basic, sortFn_datetime } from "@tanstack/react-table";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { interpretSchema } from "@table/schema/index";

import { buildColumnsFromDescriptors } from "./column-factory";
import { compareTextValues, normalizeTextSortValue, sortText } from "./sort/sort-functions";

const schema = z.object({
  name: z.string(),
  age: z.number(),
  active: z.boolean(),
  status: z.enum(["a", "b"]),
  joined: z.date(),
  tags: z.array(z.enum(["x", "y"])),
});

describe("buildColumnsFromDescriptors sortFn registration", () => {
  it("assigns TanStack columnDef.sortFn (v9), not sortingFn", () => {
    const { fields } = interpretSchema(schema);
    const columns = buildColumnsFromDescriptors(fields);
    const name = columns.find((column) => column.id === "name");
    expect(name).toBeDefined();
    expect(name).toHaveProperty("sortFn");
    expect(name).not.toHaveProperty("sortingFn");
    expect(name?.enableSorting).toBe(true);
  });

  it("registers the intended comparator for each sortable kind", () => {
    const { fields } = interpretSchema(schema);
    const columns = buildColumnsFromDescriptors(fields);
    const byId = new Map(columns.map((column) => [column.id, column]));

    expect(byId.get("name")?.sortFn).toBe(sortText);
    expect(byId.get("status")?.sortFn).toBe(sortText);
    expect(byId.get("age")?.sortFn).toBe(sortFn_basic);
    expect(byId.get("active")?.sortFn).toBe(sortFn_basic);
    expect(byId.get("joined")?.sortFn).toBe(sortFn_datetime);
  });

  it("disables sorting for tags instead of registering a comparator", () => {
    const { fields } = interpretSchema(schema);
    const tags = buildColumnsFromDescriptors(fields).find((column) => column.id === "tags");
    expect(tags?.enableSorting).toBe(false);
    expect(tags?.sortFn).toBeUndefined();
  });

  it("uses the registered text comparator for ascending and descending order", () => {
    const { fields } = interpretSchema(schema);
    const nameColumn = buildColumnsFromDescriptors(fields).find((column) => column.id === "name");
    expect(nameColumn?.sortFn).toBe(sortText);

    const values = ["carla", "Ana", "Bogdan"] as const;
    const ascending = [...values].toSorted((left, right) =>
      compareTextValues(normalizeTextSortValue(left), normalizeTextSortValue(right)),
    );
    expect(ascending).toEqual(["Ana", "Bogdan", "carla"]);

    const descending = [...values].toSorted(
      (left, right) =>
        -compareTextValues(normalizeTextSortValue(left), normalizeTextSortValue(right)),
    );
    expect(descending).toEqual(["carla", "Bogdan", "Ana"]);
  });
});
