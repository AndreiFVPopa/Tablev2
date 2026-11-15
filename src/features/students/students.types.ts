import type { studentSchema } from "./students.schema";
import type { z } from "zod";

export type Student = z.output<typeof studentSchema>;
export type StudentsDataset = readonly Student[];
