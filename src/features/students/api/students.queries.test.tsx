import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { studentsQueryKeys, studentsQueryOptions } from "./students.queries";
import * as studentsRequests from "./students.requests";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("studentsQueryKeys", () => {
  it("builds a stable list key", () => {
    expect(studentsQueryKeys.list()).toEqual(["students", "list"]);
  });
});

function Probe(): React.JSX.Element {
  const query = useQuery(studentsQueryOptions());
  if (query.isPending) return <p>pending</p>;
  if (query.isError) return <p role="alert">{query.error.message}</p>;
  return <p>rows:{String(query.data.length)}</p>;
}

describe("studentsQueryOptions", () => {
  it("exposes loading then success", async () => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );
    expect(screen.getByText("pending")).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText("rows:24")).toBeInTheDocument();
    });
  });

  it("exposes error state", async () => {
    vi.spyOn(studentsRequests, "fetchStudents").mockRejectedValue(new Error("query fail"));
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Probe />
      </QueryClientProvider>,
    );
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("query fail");
    });
  });
});
