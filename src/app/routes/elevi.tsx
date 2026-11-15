import { createFileRoute } from "@tanstack/react-router";

import { StudentsPage } from "@features/students/students-page";
import { studentSchema } from "@features/students/students.schema";
import { composeTableSearchValidator } from "@table/index";

export const Route = createFileRoute("/elevi")({
  validateSearch: composeTableSearchValidator(studentSchema),
  component: StudentsPage,
});
