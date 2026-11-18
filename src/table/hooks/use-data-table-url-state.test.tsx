import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { DataTable } from "../components/data-table";
import { composeTableSearchValidator } from "../url/validation/compose-search-validator";
const PeopleSchema = z.object({
  name: z.string().meta({ title: "Nume" }),
  age: z.number().meta({ title: "Vârstă" }),
  status: z.enum(["new", "done"]).meta({ title: "Status" }),
  address: z.object({
    city: z.string().meta({ title: "Oraș" }),
  }),
});
type Person = z.infer<typeof PeopleSchema>;
const PEOPLE: readonly Person[] = [
  { name: "Ana", age: 20, status: "new", address: { city: "Cluj" } },
  { name: "Bogdan", age: 45, status: "done", address: { city: "Sibiu" } },
  { name: "Carla", age: 32, status: "done", address: { city: "Brașov" } },
];
const BooksSchema = z.object({
  title: z.string().meta({ title: "Titlu" }),
  rating: z.number().meta({ title: "Notă" }),
});
type Book = z.infer<typeof BooksSchema>;
const BOOKS: readonly Book[] = [
  { title: "Alpha", rating: 4 },
  { title: "Beta", rating: 2 },
];
const PAGE_SIZES = [1, 2, 10] as const;
interface MountOptions {
  readonly initialEntry: string;
}
function buildRouter({ initialEntry }: MountOptions) {
  const rootRoute = createRootRoute({
    component: () => <Outlet />,
  });
  const peopleRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/people",
    validateSearch: composeTableSearchValidator(PeopleSchema, {
      pageSizes: PAGE_SIZES,
      defaultPageSize: 10,
    }),
    component: function PeoplePage() {
      return (
        <DataTable
          schema={PeopleSchema}
          data={PEOPLE}
          pageSizes={PAGE_SIZES}
          labels={{ tableLandmark: "People table" }}
        />
      );
    },
  });
  const dualRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/dual",
    validateSearch: (search: Record<string, unknown>) => {
      const students = composeTableSearchValidator(PeopleSchema, {
        urlNamespace: "students",
        pageSizes: PAGE_SIZES,
        defaultPageSize: 10,
      })(search);
      const products = composeTableSearchValidator(BooksSchema, {
        urlNamespace: "products",
        pageSizes: PAGE_SIZES,
        defaultPageSize: 10,
      })(students);
      return products;
    },
    component: function DualPage() {
      return (
        <>
          <DataTable
            schema={PeopleSchema}
            data={PEOPLE}
            pageSizes={PAGE_SIZES}
            urlNamespace="students"
            labels={{ tableLandmark: "Students table" }}
          />
          <DataTable
            schema={BooksSchema}
            data={BOOKS}
            pageSizes={PAGE_SIZES}
            urlNamespace="products"
            labels={{ tableLandmark: "Products table" }}
          />
        </>
      );
    },
  });
  const booksRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/books",
    validateSearch: composeTableSearchValidator(BooksSchema, {
      pageSizes: PAGE_SIZES,
      defaultPageSize: 10,
    }),
    component: function BooksPage() {
      return (
        <DataTable
          schema={BooksSchema}
          data={BOOKS}
          pageSizes={PAGE_SIZES}
          labels={{ tableLandmark: "Books table" }}
        />
      );
    },
  });
  const routeTree = rootRoute.addChildren([peopleRoute, dualRoute, booksRoute]);
  const history = createMemoryHistory({ initialEntries: [initialEntry] });
  const router = createRouter({
    routeTree,
    history,
    defaultPreload: false,
  });
  return { router, history };
}
async function mount(opts: MountOptions) {
  const { router, history } = buildRouter(opts);
  await act(async () => {
    await router.load();
  });
  const view = render(<RouterProvider router={router} />);
  return { router, history, ...view };
}
describe("URL-backed DataTable — single table", () => {
  it("canonicalises page / pageSize / sort on first render", async () => {
    const { history } = await mount({
      initialEntry: "/people?tab=list",
    });
    await waitFor(() => {
      expect(screen.getByRole("table", { name: "People table" })).toBeInTheDocument();
    });
    const search = history.location.search;
    expect(search).toMatch(/page=1/);
    expect(search).toMatch(/pageSize=10/);
    expect(search).toMatch(/(?:^|[?&])sort=/);
    expect(search).toMatch(/tab=list/);
  });
  it("writes filter + sort into the URL and resets page to 1", async () => {
    const { history } = await mount({
      initialEntry: "/people?page=2&pageSize=1&sort=",
    });
    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "Bogdan" })).toBeInTheDocument();
    });
    fireEvent.change(screen.getByRole("searchbox", { name: /Filtrează Nume/ }), {
      target: { value: "Ana" },
    });
    await waitFor(() => {
      expect(history.location.search).toMatch(/name=Ana/);
      expect(history.location.search).toMatch(/page=1/);
    });
    expect(screen.getByRole("cell", { name: "Ana" })).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "Bogdan" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Sortează Nume/i }));
    await waitFor(() => {
      expect(history.location.search).toMatch(/sort=name/);
    });
  });
  it("keeps page after sorting when autoResetPageIndex is disabled", async () => {
    const { history } = await mount({
      initialEntry: "/people?page=1&pageSize=1&sort=",
    });
    await waitFor(() => {
      expect(screen.getByRole("table", { name: "People table" })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /Sortează Nume/i }));
    await waitFor(() => {
      expect(history.location.search).toMatch(/sort=name/);
    });
    fireEvent.click(screen.getByRole("button", { name: /Pagina următoare/i }));
    await waitFor(() => {
      expect(history.location.search).toMatch(/page=2/);
      expect(history.location.search).toMatch(/sort=name/);
    });
  });

  it("preserves unrelated search parameters across navigation", async () => {
    const { history } = await mount({
      initialEntry: "/people?page=1&pageSize=10&sort=&utm=share&ref=email",
    });
    await waitFor(() => {
      expect(screen.getByRole("table", { name: "People table" })).toBeInTheDocument();
    });
    fireEvent.change(screen.getByRole("searchbox", { name: /Filtrează Nume/ }), {
      target: { value: "Bog" },
    });
    await waitFor(() => {
      expect(history.location.search).toMatch(/name=Bog/);
      expect(history.location.search).toMatch(/utm=share/);
      expect(history.location.search).toMatch(/ref=email/);
    });
  });
  it("restores state on browser back and forward", async () => {
    const { history } = await mount({
      initialEntry: "/people?page=1&pageSize=10&sort=",
    });
    await waitFor(() => {
      expect(screen.getByRole("table", { name: "People table" })).toBeInTheDocument();
    });
    fireEvent.change(screen.getByRole("searchbox", { name: /Filtrează Nume/ }), {
      target: { value: "Ana" },
    });
    await waitFor(() => {
      expect(history.location.search).toMatch(/name=Ana/);
    });
    act(() => {
      history.back();
    });
    await waitFor(() => {
      expect(history.location.search).not.toMatch(/name=Ana/);
      expect(screen.getByRole("cell", { name: "Bogdan" })).toBeInTheDocument();
    });
    act(() => {
      history.forward();
    });
    await waitFor(() => {
      expect(history.location.search).toMatch(/name=Ana/);
      expect(screen.getByRole("cell", { name: "Ana" })).toBeInTheDocument();
    });
  });
  it("restores state after a remount against the same history entry (refresh)", async () => {
    const { history, unmount } = await mount({
      initialEntry: "/people?page=1&pageSize=10&sort=&name=Ana&address.city=Cluj",
    });
    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "Ana" })).toBeInTheDocument();
    });
    const snapshot = history.location.search;
    expect(snapshot).toMatch(/name=Ana/);
    expect(snapshot).toMatch(/address\.city=Cluj/);
    unmount();
    const router2 = buildRouter({
      initialEntry: `/people${snapshot}`,
    });
    await act(async () => {
      await router2.router.load();
    });
    render(<RouterProvider router={router2.router} />);
    await waitFor(() => {
      expect(screen.getByRole("cell", { name: "Ana" })).toBeInTheDocument();
      expect(screen.queryByRole("cell", { name: "Bogdan" })).not.toBeInTheDocument();
    });
  });
  it("round-trips a nested dotted-path filter", async () => {
    const { history } = await mount({
      initialEntry: "/people?page=1&pageSize=10&sort=",
    });
    await waitFor(() => {
      expect(screen.getByRole("table", { name: "People table" })).toBeInTheDocument();
    });
    fireEvent.change(screen.getByRole("searchbox", { name: /Filtrează Oraș/ }), {
      target: { value: "Sibiu" },
    });
    await waitFor(() => {
      expect(history.location.search).toMatch(/address\.city=Sibiu/);
      expect(screen.getByRole("cell", { name: "Bogdan" })).toBeInTheDocument();
      expect(screen.queryByRole("cell", { name: "Ana" })).not.toBeInTheDocument();
    });
  });
});
describe("URL-backed DataTable — namespaced multi-table", () => {
  it("keeps two tables' search keys isolated under their namespaces", async () => {
    const { history } = await mount({
      initialEntry: "/dual",
    });
    await waitFor(() => {
      expect(screen.getByRole("table", { name: "Students table" })).toBeInTheDocument();
      expect(screen.getByRole("table", { name: "Products table" })).toBeInTheDocument();
    });
    fireEvent.change(screen.getByRole("searchbox", { name: /Filtrează Nume/ }), {
      target: { value: "Ana" },
    });
    await waitFor(() => {
      expect(history.location.search).toMatch(/students\.name=Ana/);
    });
    fireEvent.change(screen.getByRole("searchbox", { name: /Filtrează Titlu/ }), {
      target: { value: "Beta" },
    });
    await waitFor(() => {
      expect(history.location.search).toMatch(/students\.name=Ana/);
      expect(history.location.search).toMatch(/products\.title=Beta/);
      expect(history.location.search).toMatch(/students\.page=1/);
      expect(history.location.search).toMatch(/products\.page=1/);
    });
  });
});
describe("URL-backed DataTable — copied under an unrelated route", () => {
  it("hosts the same component against a different schema with no shared app code", async () => {
    const { history } = await mount({
      initialEntry: "/books",
    });
    await waitFor(() => {
      expect(screen.getByRole("table", { name: "Books table" })).toBeInTheDocument();
    });
    fireEvent.click(screen.getByRole("button", { name: /Sortează Notă/i }));
    await waitFor(() => {
      expect(history.location.search).toMatch(/sort=rating/);
    });
    const firstData = screen.getAllByRole("row")[2]!;
    expect(within(firstData).getAllByRole("cell")[0]!.textContent).toBe("Beta");
  });
});
describe("src/table portability", () => {
  it("does not import application-specific modules", async () => {
    const modules = import.meta.glob("../*.{ts,tsx}", { query: "?raw", import: "default" });
    const nested = import.meta.glob("../*/**/*.{ts,tsx}", {
      query: "?raw",
      import: "default",
    });
    const all = { ...modules, ...nested };
    const forbidden = [
      /from\s+["']@\/app\b/,
      /from\s+["']@app\b/,
      /from\s+["']@\/features\b/,
      /from\s+["']@features\b/,
      /from\s+["']@\/mocks\b/,
      /from\s+["']@mocks\b/,
      /from\s+["']\.\.\/\.\.\/app\b/,
      /from\s+["']\.\.\/\.\.\/features\b/,
      /from\s+["']\.\.\/\.\.\/mocks\b/,
    ];
    for (const [path, loader] of Object.entries(all)) {
      if (path.includes(".test.") || path.includes(".spec.")) continue;
      const source = await loader();
      if (typeof source !== "string") continue;
      for (const pattern of forbidden) {
        expect(source, `${path} must not match ${pattern}`).not.toMatch(pattern);
      }
    }
  });
});
