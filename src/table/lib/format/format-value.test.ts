import { describe, expect, it } from "vitest";
import { z } from "zod";

import { interpretSchema } from "../../schema/index";
import { DEFAULT_LABELS } from "../../table-labels";

import { formatValue } from "./format-value";

import type { FieldDescriptor, FieldKind } from "../../schema/index";

const FIXTURE_SCHEMA = z.object({
  name: z.string(),
  score: z.number(),
  active: z.boolean(),
  status: z.enum(["new", "done"]),
  created: z.date(),
  tags: z.array(z.enum(["a", "b", "c"])),
});

function descriptor(kind: FieldKind): FieldDescriptor {
  const { fields } = interpretSchema(FIXTURE_SCHEMA);
  const found = fields.find((field) => field.kind === kind);
  if (!found) throw new Error(`fixture missing kind ${kind}`);
  return found;
}

describe("formatValue", () => {
  it("formats text", () => {
    const text = descriptor("text");
    expect(formatValue({ value: "Ana", descriptor: text, labels: DEFAULT_LABELS })).toBe("Ana");
    expect(formatValue({ value: "", descriptor: text, labels: DEFAULT_LABELS })).toBe(
      DEFAULT_LABELS.cellEmpty,
    );
    expect(formatValue({ value: null, descriptor: text, labels: DEFAULT_LABELS })).toBe(
      DEFAULT_LABELS.cellEmpty,
    );
  });

  it("formats numbers with ro-RO locale", () => {
    const numeric = descriptor("numeric");
    expect(formatValue({ value: 1234, descriptor: numeric, labels: DEFAULT_LABELS })).toMatch(
      /1[.\s]234/u,
    );
    expect(formatValue({ value: Number.NaN, descriptor: numeric, labels: DEFAULT_LABELS })).toBe(
      DEFAULT_LABELS.cellEmpty,
    );
    expect(formatValue({ value: "5", descriptor: numeric, labels: DEFAULT_LABELS })).toBe(
      DEFAULT_LABELS.cellEmpty,
    );
  });

  it("formats booleans with Romanian Da/Nu", () => {
    const booleanField = descriptor("boolean");
    expect(formatValue({ value: true, descriptor: booleanField, labels: DEFAULT_LABELS })).toBe(
      "Da",
    );
    expect(formatValue({ value: false, descriptor: booleanField, labels: DEFAULT_LABELS })).toBe(
      "Nu",
    );
    expect(formatValue({ value: null, descriptor: booleanField, labels: DEFAULT_LABELS })).toBe(
      DEFAULT_LABELS.cellEmpty,
    );
  });

  it("formats enum as the raw string, preferring optionLabels when present", () => {
    const enumField = descriptor("enum");
    expect(formatValue({ value: "done", descriptor: enumField, labels: DEFAULT_LABELS })).toBe(
      "done",
    );
    expect(formatValue({ value: null, descriptor: enumField, labels: DEFAULT_LABELS })).toBe(
      DEFAULT_LABELS.cellEmpty,
    );
    const labeled: FieldDescriptor = {
      ...enumField,
      meta: { ...enumField.meta, optionLabels: { done: "Finalizat", new: "Nou" } },
    };
    expect(formatValue({ value: "done", descriptor: labeled, labels: DEFAULT_LABELS })).toBe(
      "Finalizat",
    );
    expect(formatValue({ value: "new", descriptor: labeled, labels: DEFAULT_LABELS })).toBe("Nou");
  });

  it("formats dates with ro-RO locale and rejects invalid ones", () => {
    const dateField = descriptor("date");
    expect(
      formatValue({
        value: new Date("2026-11-13T12:00:00Z"),
        descriptor: dateField,
        labels: DEFAULT_LABELS,
      }),
    ).toMatch(/\d/u);
    expect(
      formatValue({ value: new Date("invalid"), descriptor: dateField, labels: DEFAULT_LABELS }),
    ).toBe(DEFAULT_LABELS.cellEmpty);
    expect(
      formatValue({ value: "2026-11-13", descriptor: dateField, labels: DEFAULT_LABELS }),
    ).toBe(DEFAULT_LABELS.cellEmpty);
  });

  it("joins tags with comma, applies optionLabels, drops non-strings", () => {
    const tags = descriptor("tags");
    expect(formatValue({ value: ["a", "b"], descriptor: tags, labels: DEFAULT_LABELS })).toBe(
      "a, b",
    );
    expect(formatValue({ value: [], descriptor: tags, labels: DEFAULT_LABELS })).toBe(
      DEFAULT_LABELS.cellEmpty,
    );
    expect(formatValue({ value: [1, 2], descriptor: tags, labels: DEFAULT_LABELS })).toBe(
      DEFAULT_LABELS.cellEmpty,
    );
    expect(formatValue({ value: "nope", descriptor: tags, labels: DEFAULT_LABELS })).toBe(
      DEFAULT_LABELS.cellEmpty,
    );
    const labeled: FieldDescriptor = {
      ...tags,
      meta: { ...tags.meta, optionLabels: { a: "Alpha", b: "Beta" } },
    };
    expect(
      formatValue({ value: ["a", "b", "c"], descriptor: labeled, labels: DEFAULT_LABELS }),
    ).toBe("Alpha, Beta, c");
  });
});
