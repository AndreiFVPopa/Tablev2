import studentsFixture from "@mocks/students/students.fixture.json";
import { parseDataset } from "@shared/lib/dataset-validation";

import { studentsDatasetSchema } from "./students.schema";

import type { StudentsDataset } from "./students.types";

export const studentsDataset: StudentsDataset = parseDataset({
  schema: studentsDatasetSchema,
  payload: studentsFixture,
  entity: "elevi",
});
