import { describe, expect, expectTypeOf, it } from "vitest";
import { z } from "zod";

import { DataTable, type DataTableProps } from "./data-table";

const studentSchema = z.object({
  name: z.string(),
  age: z.number(),
  active: z.boolean(),
  nickname: z.string().optional(),
  notes: z.string().nullable(),
  enrolledAt: z.coerce.date(),
});

type StudentRow = z.output<typeof studentSchema>;

describe("DataTable schema-derived rows", () => {
  it("accepts schema output, including optional omission and nullable null", () => {
    const props: DataTableProps<typeof studentSchema> = {
      schema: studentSchema,
      data: [
        {
          name: "Ana",
          age: 20,
          active: true,
          notes: null,
          enrolledAt: new Date("2026-01-01T00:00:00Z"),
        },
      ],
    };
    expect(props.data[0]?.name).toBe("Ana");
    expectTypeOf<DataTableProps<typeof studentSchema>["data"]>().toEqualTypeOf<
      readonly StudentRow[]
    >();
    expectTypeOf<StudentRow["enrolledAt"]>().toEqualTypeOf<Date>();
    expectTypeOf<StudentRow["nickname"]>().toEqualTypeOf<string | undefined>();
    expectTypeOf<StudentRow["notes"]>().toEqualTypeOf<string | null>();
  });

  it("rejects property types that disagree with the schema output", () => {
    const element = (
      <DataTable
        schema={studentSchema}
        // @ts-expect-error age is number and active is boolean on the schema output
        data={[{ name: "Ana", age: "20", active: "yes", notes: null, enrolledAt: new Date() }]}
      />
    );
    expect(element).toBeTruthy();
  });

  it("rejects rows that omit required fields", () => {
    const element = (
      <DataTable
        schema={studentSchema}
        // @ts-expect-error age, active, notes, and enrolledAt are required output fields
        data={[{ name: "Ana" }]}
      />
    );
    expect(element).toBeTruthy();
  });

  it("rejects a coerced date string where the output must be a Date", () => {
    const element = (
      <DataTable
        schema={studentSchema}
        data={[
          {
            name: "Ana",
            age: 20,
            active: true,
            notes: null,
            // @ts-expect-error z.coerce.date() output is Date, not the raw input string
            enrolledAt: "2026-01-01",
          },
        ]}
      />
    );
    expect(element).toBeTruthy();
  });

  it("does not widen the schema to accept an unrelated row shape", () => {
    const books = [{ title: "A" }] as const;
    const element = (
      <DataTable
        schema={studentSchema}
        // @ts-expect-error book rows are not student schema output
        data={books}
      />
    );
    expect(element).toBeTruthy();
  });
});
