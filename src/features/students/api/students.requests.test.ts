import { describe, expect, it } from "vitest";

import { loadStudentsFixture } from "@mocks/students/load-students-fixture";
import { DATA_SOURCES } from "@shared/api/data-source";
import { DatasetValidationError } from "@shared/lib/dataset-validation";

import { fetchStudents } from "./students.requests";

import type { Student } from "../students.types";

describe("fetchStudents", () => {
  it("loads and validates the fixture source", async () => {
    const students = await fetchStudents({ source: DATA_SOURCES.FIXTURE });
    expect(students).toHaveLength(24);
    const first: Student | undefined = students[0];
    expect(first?.enrolledAt).toBeInstanceOf(Date);
  });

  it("uses the HTTP adapter without a live service", async () => {
    const students = await fetchStudents({
      source: DATA_SOURCES.HTTP,
      getJson: () => Promise.resolve(loadStudentsFixture()),
    });
    expect(students).toHaveLength(24);
  });

  it("surfaces validation errors from HTTP payloads", async () => {
    await expect(
      fetchStudents({
        source: DATA_SOURCES.HTTP,
        getJson: () => Promise.resolve([{ id: "bad" }]),
      }),
    ).rejects.toBeInstanceOf(DatasetValidationError);
  });

  it("propagates network failures from the HTTP getter", async () => {
    await expect(
      fetchStudents({
        source: DATA_SOURCES.HTTP,
        getJson: () => Promise.reject(new Error("network down")),
      }),
    ).rejects.toThrow(/network down/);
  });
});
