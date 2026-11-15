import { queryOptions } from "@tanstack/react-query";

import { fetchStudents } from "./students.requests";

export const studentsQueryKeys = {
  all: ["students"] as const,
  list: () => [...studentsQueryKeys.all, "list"] as const,
};

export function studentsQueryOptions() {
  return queryOptions({
    queryKey: studentsQueryKeys.list(),
    queryFn: () => fetchStudents(),
  });
}
