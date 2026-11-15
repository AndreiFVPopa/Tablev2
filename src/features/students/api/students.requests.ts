import { loadStudentsFixture } from "@mocks/students/load-students-fixture";
import { DATA_SOURCES, resolveDataSource } from "@shared/api/data-source";
import { getJson, type JsonGetter } from "@shared/api/http";
import { parseDataset } from "@shared/lib/dataset-validation";

import { studentsDatasetSchema } from "../students.schema";

import type { StudentsDataset } from "../students.types";
import type { DataSourceKind } from "@shared/api/data-source";

const STUDENTS_HTTP_URL = "/api/students";

export interface FetchStudentsOptions {
  readonly source?: DataSourceKind;
  readonly getJson?: JsonGetter;
}

export async function fetchStudents(options: FetchStudentsOptions = {}): Promise<StudentsDataset> {
  const source = options.source ?? resolveDataSource();
  const loadJson = options.getJson ?? getJson;
  const raw =
    source === DATA_SOURCES.HTTP ? await loadJson(STUDENTS_HTTP_URL) : loadStudentsFixture();
  return parseDataset(studentsDatasetSchema, raw, "elevi");
}
