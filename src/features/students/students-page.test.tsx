import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { composeTableSearchValidator } from "@table/index";
import { interpretSchema } from "@table/schema/interpretation/interpret";

import { StudentsPage } from "./students-page";
import { studentSchema } from "./students.schema";

async function mount(initialEntry = "/elevi"): Promise<{
  history: ReturnType<typeof createMemoryHistory>;
  unmount: () => void;
}> {
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
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
  it("renders the schema-driven table from the validated fixture", async () => {
    await mount();
    expect(screen.getByRole("heading", { level: 2, name: /Elevi/i })).toBeInTheDocument();
    expect(screen.getByRole("table", { name: /Tabel de date/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sortează Nume/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sortează Oraș/i })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Ana Pop" })).toBeInTheDocument();
  });

  it("filters nested city and writes URL state", async () => {
    const { history } = await mount("/elevi?page=1&pageSize=10&sort=");
    expect(screen.getByRole("cell", { name: "Ana Pop" })).toBeInTheDocument();
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
    expect(screen.getByRole("table")).toBeInTheDocument();
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
    expect(screen.getByRole("cell", { name: "Ana Pop" })).toBeInTheDocument();
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
    expect(screen.getByRole("cell", { name: "Ana Pop" })).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "Bogdan Ionescu" })).not.toBeInTheDocument();
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
