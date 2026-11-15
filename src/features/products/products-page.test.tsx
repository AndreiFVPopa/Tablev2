import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { composeTableSearchValidator } from "@table/index";

import * as productsRequests from "./api/products.requests";
import { ProductsPage } from "./products-page";
import { productSchema } from "./products.schema";

afterEach(() => {
  vi.restoreAllMocks();
});

async function mount(initialEntry = "/produse"): Promise<{
  history: ReturnType<typeof createMemoryHistory>;
}> {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const rootRoute = createRootRoute({
    component: () => (
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    ),
  });
  const produseRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/produse",
    validateSearch: composeTableSearchValidator(productSchema),
    component: ProductsPage,
  });
  const history = createMemoryHistory({ initialEntries: [initialEntry] });
  const router = createRouter({
    routeTree: rootRoute.addChildren([produseRoute]),
    history,
    defaultPreload: false,
  });
  await act(async () => {
    await router.load();
  });
  render(<RouterProvider router={router} />);
  return { history };
}

describe("ProductsPage", () => {
  it("loads products into the schema-driven table", async () => {
    await mount();
    expect(screen.getByRole("heading", { level: 2, name: /Produse/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("table", { name: /Tabel de date/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Sortează Titlu/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sortează Țară/i })).toBeInTheDocument();
  });

  it("renders an error state when the request fails", async () => {
    vi.spyOn(productsRequests, "fetchProducts").mockRejectedValue(new Error("Eșec produse"));
    await mount();
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Eșec produse");
    });
  });

  it("filters by nested supplier country via URL", async () => {
    const { history } = await mount("/produse?page=1&pageSize=10&sort=");
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
    fireEvent.change(screen.getByRole("searchbox", { name: /Filtrează Țară/ }), {
      target: { value: "România" },
    });
    await waitFor(() => {
      expect(history.location.search).toMatch(/supplier\.country=Rom/);
    });
  });

  it("sorts by price through the URL", async () => {
    const { history } = await mount("/produse?page=1&pageSize=10&sort=");
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /Sortează Preț/i }));
    await waitFor(() => {
      expect(history.location.search).toMatch(/sort=price/);
    });
  });
});
