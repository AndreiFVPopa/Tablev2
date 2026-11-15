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
import { z } from "zod";

import { composeTableSearchValidator } from "@table/index";
import { interpretSchema } from "@table/schema/interpret";

import * as studentsRequests from "./api/students.requests";
import { StudentsPage } from "./students-page";
import { studentSchema } from "./students.schema";

afterEach(() => {
  vi.restoreAllMocks();
});

async function mount(initialEntry = "/elevi"): Promise<{
  history: ReturnType<typeof createMemoryHistory>;
  unmount: () => void;
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
  const eleviRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/elevi",
    validateSearch: composeTableSearchValidator(studentSchema),
    component: StudentsPage,
  });
  const history = createMemoryHistory({ initialEntries: [initialEntry] });
  const router = createRouter({
    routeTree: rootRoute.addChildren([eleviRoute]),
    history,
    defaultPreload: false,
  });
  await act(async () => {
    await router.load();
  });
  const view = render(<RouterProvider router={router} />);
  return { history, unmount: view.unmount };
}

describe("StudentsPage", () => {
  it("shows loading then the schema-driven table", async () => {
    await mount();
    expect(screen.getByRole("heading", { level: 2, name: /Elevi/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByRole("table", { name: /Tabel de date/i })).toBeInTheDocument();
    });
    expect(screen.getByRole("button", { name: /Sortează Nume/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sortează Oraș/i })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Ana Pop" })).toBeInTheDocument();
  });

  it("renders an error state when the request fails", async () => {
    vi.spyOn(studentsRequests, "fetchStudents").mockRejectedValue(new Error("Eșec elevi"));
    await mount();
    await waitFor(() => {
      expect(screen.getByRole("alert")).toHaveTextContent("Eșec elevi");
    });
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("shows the empty table state for an empty valid dataset", async () => {
    vi.spyOn(studentsRequests, "fetchStudents").mockResolvedValue([]);
    await mount();
    await waitFor(() => {
      expect(screen.getByText("Nu există rezultate.")).toBeInTheDocument();
    });
  });

  it("filters nested city and writes URL state", async () => {
    const { history } = await mount("/elevi?page=1&pageSize=10&sort=");
    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "Ana Pop" })).toBeInTheDocument();
    });
    fireEvent.change(screen.getByRole("searchbox", { name: /Filtrează Oraș/ }), {
      target: { value: "Sibiu" },
    });
    await waitFor(() => {
      expect(history.location.search).toMatch(/address\.city=Sibiu/);
      expect(screen.getByRole("cell", { name: "Bogdan Ionescu" })).toBeInTheDocument();
      expect(screen.queryByRole("cell", { name: "Ana Pop" })).not.toBeInTheDocument();
    });
  });

  it("paginates and sorts through the URL", async () => {
    const { history } = await mount("/elevi?page=1&pageSize=10&sort=");
    await waitFor(() => {
      expect(screen.getByRole("table")).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /Sortează Nume/i }));
    await waitFor(() => {
      expect(history.location.search).toMatch(/sort=name/);
    });
    fireEvent.click(screen.getByRole("button", { name: /Pagina următoare/i }));
    await waitFor(() => {
      expect(history.location.search).toMatch(/page=2/);
    });
  });

  it("restores filters after remount (refresh) and supports back/forward", async () => {
    const { history, unmount } = await mount("/elevi?page=1&pageSize=10&sort=&name=Ana&utm=demo");
    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "Ana Pop" })).toBeInTheDocument();
    });
    expect(history.location.search).toMatch(/utm=demo/);
    const snapshot = history.location.search;
    fireEvent.change(screen.getByRole("searchbox", { name: /Filtrează Nume/ }), {
      target: { value: "Bogdan" },
    });
    await waitFor(() => {
      expect(history.location.search).toMatch(/name=Bogdan/);
    });
    act(() => {
      history.back();
    });
    await waitFor(() => {
      expect(history.location.search).toMatch(/name=Ana/);
      expect(screen.getByRole("cell", { name: "Ana Pop" })).toBeInTheDocument();
    });
    unmount();
    await mount(`/elevi${snapshot}`);
    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "Ana Pop" })).toBeInTheDocument();
      expect(screen.queryByRole("cell", { name: "Bogdan Ionescu" })).not.toBeInTheDocument();
    });
  });
});

describe("schema-driven columns", () => {
  it("picks up a new domain field without manual column wiring", () => {
    const extended = z.object({
      ...studentSchema.shape,
      alias: z.string().meta({ title: "Alias" }),
    });
    const titles = interpretSchema(extended).fields.map((field) => field.meta.title);
    expect(titles).toContain("Nume");
    expect(titles).toContain("Alias");
  });
});
