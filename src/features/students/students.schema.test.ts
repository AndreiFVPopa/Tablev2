import { describe, expect, it } from "vitest";

import studentsFixture from "@mocks/students/students.fixture.json";
import { isPlainRecord } from "@table/lib/is-plain-record";
import { FIELD_KINDS } from "@table/schema/field-kinds.constants";
import { interpretSchema } from "@table/schema/interpretation/interpret";
import { URL_VALUE_ENCODINGS } from "@table/schema/url-value-encoding.constants";
import { decodeOptionFromUrlToken, encodeOptionToUrlToken } from "@table/url/codec/option-encoding";
import { composeTableSearchValidator } from "@table/url/validation/compose-search-validator";

import { STUDENT_GENDER, STUDENT_GENDER_LABELS, STUDENT_TAGS } from "./students.constants";
import { studentSchema, studentsDatasetSchema } from "./students.schema";

function asRecordArray(payload: unknown): Record<string, unknown>[] {
  if (!Array.isArray(payload)) throw new Error("expected array fixture");
  const rows: Record<string, unknown>[] = [];
  for (const row of payload) {
    if (!isPlainRecord(row)) throw new Error("expected object row");
    rows.push({ ...row });
  }
  return rows;
}

describe("studentSchema", () => {
  it("validates the fixture and coerces enrolledAt to Date", () => {
    const result = studentsDatasetSchema.safeParse(studentsFixture);
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data).toHaveLength(24);
    expect(result.data[0]?.enrolledAt).toBeInstanceOf(Date);
    expect(result.data.some((row) => row.gpa === null)).toBe(true);
    expect(result.data.some((row) => row.notes === null || row.notes === undefined)).toBe(true);
  });

  it("rejects invalid records instead of dropping them", () => {
    const rows = asRecordArray(studentsFixture);
    const first = rows[0];
    if (first === undefined) throw new Error("expected at least one row");
    const invalid = [{ ...first, age: 99 }, ...rows.slice(1)];
    const result = studentsDatasetSchema.safeParse(invalid);
    expect(result.success).toBe(false);
  });

  it("is compatible with the Phase 2 interpreter", () => {
    const { fields, diagnostics } = interpretSchema(studentSchema);
    expect(diagnostics).toEqual([]);
    const byPath = Object.fromEntries(fields.map((field) => [field.path, field.kind]));
    expect(byPath.id).toBe(FIELD_KINDS.TEXT);
    expect(byPath.name).toBe(FIELD_KINDS.TEXT);
    expect(byPath.email).toBe(FIELD_KINDS.TEXT);
    expect(byPath.age).toBe(FIELD_KINDS.NUMERIC);
    expect(byPath.grade).toBe(FIELD_KINDS.ENUM);
    expect(byPath.gender).toBe(FIELD_KINDS.ENUM);
    expect(byPath.active).toBe(FIELD_KINDS.BOOLEAN);
    expect(byPath.enrolledAt).toBe(FIELD_KINDS.DATE);
    expect(byPath.gpa).toBe(FIELD_KINDS.NUMERIC);
    expect(byPath.tags).toBe(FIELD_KINDS.TAGS);
    expect(byPath["address.city"]).toBe(FIELD_KINDS.TEXT);
    expect(byPath["address.county"]).toBe(FIELD_KINDS.TEXT);
    expect(byPath.notes).toBe(FIELD_KINDS.TEXT);
  });

  it("exposes Romanian titles via metadata", () => {
    const { fields } = interpretSchema(studentSchema);
    const titles = Object.fromEntries(fields.map((field) => [field.path, field.meta.title]));
    expect(titles.name).toBe("Nume");
    expect(titles.gender).toBe("Gen");
    expect(titles.enrolledAt).toBe("Înscris");
    expect(titles["address.city"]).toBe("Oraș");
  });

  it("configures positional gender URL aliases and slug tags", () => {
    const { fields, diagnostics } = interpretSchema(studentSchema);
    expect(diagnostics).toEqual([]);
    const gender = fields.find((field) => field.path === "gender");
    expect(gender?.kind).toBe(FIELD_KINDS.ENUM);
    if (gender?.kind !== FIELD_KINDS.ENUM) return;
    expect(gender.meta.urlParam).toBe("gen");
    expect(gender.meta.urlValueEncoding).toBe(URL_VALUE_ENCODINGS.POSITIONAL);
    expect(
      encodeOptionToUrlToken({
        canonicalOption: STUDENT_GENDER.MALE,
        optionValues: gender.options,
        encoding: gender.meta.urlValueEncoding,
      }),
    ).toBe("1");
    expect(
      encodeOptionToUrlToken({
        canonicalOption: STUDENT_GENDER.FEMALE,
        optionValues: gender.options,
        encoding: gender.meta.urlValueEncoding,
      }),
    ).toBe("2");
    expect(gender.meta.optionLabels?.[STUDENT_GENDER.MALE]).toBe(
      STUDENT_GENDER_LABELS[STUDENT_GENDER.MALE],
    );
    const optionLabels = gender.meta.optionLabels;
    if (optionLabels === undefined) throw new Error("expected gender option labels");
    expect(
      decodeOptionFromUrlToken({
        urlToken: "masculin",
        optionValues: gender.options,
        encoding: gender.meta.urlValueEncoding,
        optionLabels,
      }),
    ).toBe(STUDENT_GENDER.MALE);
    const active = fields.find((field) => field.path === "active");
    expect(active?.meta.urlValueEncoding).toBe(URL_VALUE_ENCODINGS.POSITIONAL);
    const tags = fields.find((field) => field.path === "tags");
    expect(tags?.kind).toBe(FIELD_KINDS.TAGS);
    if (tags?.kind !== FIELD_KINDS.TAGS) return;
    expect(tags.meta.urlValueEncoding).toBe(URL_VALUE_ENCODINGS.SLUG);
    expect(
      encodeOptionToUrlToken({
        canonicalOption: STUDENT_TAGS.BURSA,
        optionValues: tags.options,
        encoding: tags.meta.urlValueEncoding,
      }),
    ).toBe("bursa");
    expect(
      decodeOptionFromUrlToken({
        urlToken: "bursa",
        optionValues: tags.options,
        encoding: tags.meta.urlValueEncoding,
      }),
    ).toBe(STUDENT_TAGS.BURSA);
  });

  it("canonicalises active and gender URL aliases through the elevi search validator", () => {
    const validateSearch = composeTableSearchValidator(studentSchema);
    const male = validateSearch({ gen: "masculin", active: "true", utm: "keep" });
    expect(male.gen).toBe("masculin");
    expect(male.active).toBe("true");
    expect(male.utm).toBe("keep");
    const female = validateSearch({ gen: "female", active: "false" });
    expect(female.gen).toBe("female");
    expect(female.active).toBe("false");
    const positional = validateSearch({ gen: "1", active: "2" });
    expect(positional.gen).toBe("1");
    expect(positional.active).toBe("2");
    const invalid = validateSearch({ gen: "nope", active: "0", utm: "keep" });
    expect(invalid.gen).toBeUndefined();
    expect(Object.hasOwn(invalid, "gen")).toBe(true);
    expect(invalid.active).toBeUndefined();
    expect(Object.hasOwn(invalid, "active")).toBe(true);
    expect(invalid.utm).toBe("keep");
    expect(validateSearch({}).active).toBeUndefined();
    expect(Object.hasOwn(validateSearch({}), "active")).toBe(false);
  });
});
