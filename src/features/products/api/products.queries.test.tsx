import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { productsQueryKeys, productsQueryOptions } from "./products.queries";
import * as productsRequests from "./products.requests";

afterEach(() => {
  vi.restoreAllMocks();
});

describe("productsQueryKeys", () => {
  it("builds a stable list key", () => {
    expect(productsQueryKeys.list()).toEqual(["products", "list"]);
  });
});

function Probe(): React.JSX.Element {
  const query = useQuery(productsQueryOptions());
  if (query.isPending) return <p>pending</p>;
  if (query.isError) return <p role="alert">{query.error.message}</p>;
  return <p>rows:{String(query.data.length)}</p>;
}

describe("productsQueryOptions", () => {
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
    vi.spyOn(productsRequests, "fetchProducts").mockRejectedValue(new Error("query fail"));
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
