import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { DATA_MODES } from "@table/lib/state/data-mode.constants";
import { createDefaultTableState, type DataTableState } from "@table/lib/state/table-state";
import { composeTableSearchValidator } from "@table/url/validation/compose-search-validator";

import { DataTable } from "./data-table";

const PeopleSchema = z.object({
  name: z.string().meta({ title: "Nume" }),
  age: z.number().meta({ title: "Vârstă" }),
});
type Person = z.infer<typeof PeopleSchema>;

function person(name: string, age: number): Person {
  return { name, age };
}

const SERVER_PAGE: readonly Person[] = [person("Ana", 20), person("Bogdan", 45)];
const PAGE_SIZES = [25, 50] as const;

interface ServerHarnessProps {
  readonly data?: readonly Person[];
  readonly totalRows: number | null;
  readonly initial?: Partial<DataTableState>;
  readonly pageSizes?: readonly number[];
}

function ServerHarness({
  data = SERVER_PAGE,
  totalRows,
  initial,
  pageSizes = PAGE_SIZES,
}: ServerHarnessProps): React.JSX.Element {
  const [state, setState] = useState<DataTableState>(() =>
    createDefaultTableState({
      ...initial,
      pagination: { pageIndex: 1, pageSize: 25, ...initial?.pagination },
    }),
  );
  return (
    <DataTable
      schema={PeopleSchema}
      data={data}
      dataMode={DATA_MODES.SERVER}
      totalRows={totalRows}
      state={state}
      onStateChange={setState}
      pageSizes={pageSizes}
    />
  );
}

function renderServer(props: ServerHarnessProps): ReturnType<typeof render> {
  return render(<ServerHarness {...props} />);
}

describe("DataTable server mode", () => {
  it("renders the supplied page at page index 1 as rows 26–27 of 100", () => {
    renderServer({ totalRows: 100 });
    expect(screen.getByRole("cell", { name: "Ana" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Bogdan" })).toBeInTheDocument();
    expect(screen.getByText("26–27 din 100")).toBeInTheDocument();
    expect(screen.getByText("2 din 4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pagina următoare" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Pagina anterioară" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Ultima pagină" })).toBeEnabled();
  });

  it("does not filter the supplied rows again", () => {
    renderServer({
      totalRows: 100,
      initial: { columnFilters: [{ id: "name", value: "Bogdan" }] },
    });
    expect(screen.getByRole("searchbox", { name: /Filtrează Nume/ })).toHaveValue("Bogdan");
    expect(screen.getByRole("cell", { name: "Ana" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Bogdan" })).toBeInTheDocument();
  });

  it("does not sort the supplied rows again", () => {
    renderServer({
      totalRows: 100,
      initial: { sorting: [{ id: "name", desc: true }] },
    });
    const nameHeader = screen.getByRole("button", { name: /Sortează Nume/i });
    expect(nameHeader.closest("th")?.getAttribute("aria-sort")).toBe("descending");
    expect(
      within(screen.getAllByRole("row")[2]!).getByRole("cell", { name: "Ana" }),
    ).toBeInTheDocument();
  });

  it("does not slice the supplied page again", () => {
    renderServer({ totalRows: 100 });
    expect(screen.queryByText("Nu există rezultate.")).not.toBeInTheDocument();
    expect(screen.getAllByRole("row")).toHaveLength(4);
  });

  it("moves next, previous, first, and last from the reported total", () => {
    renderServer({ totalRows: 100 });
    fireEvent.click(screen.getByRole("button", { name: "Pagina următoare" }));
    expect(screen.getByText("3 din 4")).toBeInTheDocument();
    expect(screen.getByText("51–52 din 100")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pagina anterioară" }));
    expect(screen.getByText("2 din 4")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Ultima pagină" }));
    expect(screen.getByText("4 din 4")).toBeInTheDocument();
    expect(screen.getByText("76–77 din 100")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pagina următoare" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Prima pagină" }));
    expect(screen.getByText("1 din 4")).toBeInTheDocument();
    expect(screen.getByText("1–2 din 100")).toBeInTheDocument();
  });

  it("resets to the first page when a filter or the page size changes", () => {
    renderServer({ totalRows: 100 });
    fireEvent.change(screen.getByRole("searchbox", { name: /Filtrează Nume/ }), {
      target: { value: "Ana" },
    });
    expect(screen.getByText("1–2 din 100")).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Bogdan" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Pagina următoare" }));
    expect(screen.getByText("2 din 4")).toBeInTheDocument();
    fireEvent.change(screen.getByRole("combobox", { name: /Rânduri pe pagină/ }), {
      target: { value: "50" },
    });
    expect(screen.getByText("1 din 2")).toBeInTheDocument();
    expect(screen.getByText("1–2 din 100")).toBeInTheDocument();
  });

  it("renders an empty server page without inventing a row total from the page", () => {
    renderServer({
      data: [],
      totalRows: 0,
      initial: { pagination: { pageIndex: 0, pageSize: 25 } },
    });
    expect(screen.getByText("Nu există rezultate.")).toBeInTheDocument();
    expect(screen.getByText("0–0 din 0")).toBeInTheDocument();
    expect(screen.getByText("1 din 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pagina următoare" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Pagina anterioară" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Ultima pagină" })).toBeDisabled();
  });

  it("keeps next available on a full page when the total is unknown and disables it on a short page", () => {
    const { unmount } = renderServer({
      data: [person("Ana", 20)],
      totalRows: null,
      pageSizes: [1],
      initial: { pagination: { pageIndex: 0, pageSize: 1 } },
    });
    expect(screen.getByText("1–1")).toBeInTheDocument();
    expect(screen.queryByText(/din/)).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pagina următoare" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Ultima pagină" })).toBeDisabled();
    fireEvent.click(screen.getByRole("button", { name: "Pagina următoare" }));
    expect(screen.getByText("2–2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pagina anterioară" })).toBeEnabled();
    unmount();

    renderServer({
      totalRows: null,
      initial: { pagination: { pageIndex: 0, pageSize: 25 } },
    });
    expect(screen.getByText("1–2")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Pagina următoare" })).toBeDisabled();
  });

  it("keeps two server tables independent", () => {
    function TwoTables(): React.JSX.Element {
      const [first, setFirst] = useState<DataTableState>(() =>
        createDefaultTableState({ pagination: { pageIndex: 0, pageSize: 25 } }),
      );
      const [second, setSecond] = useState<DataTableState>(() =>
        createDefaultTableState({ pagination: { pageIndex: 0, pageSize: 25 } }),
      );
      return (
        <>
          <DataTable
            schema={PeopleSchema}
            data={[person("Ana", 20)]}
            dataMode={DATA_MODES.SERVER}
            totalRows={100}
            state={first}
            onStateChange={setFirst}
            pageSizes={PAGE_SIZES}
            labels={{ tableLandmark: "Prima" }}
          />
          <DataTable
            schema={PeopleSchema}
            data={[person("Bogdan", 45)]}
            dataMode={DATA_MODES.SERVER}
            totalRows={3}
            state={second}
            onStateChange={setSecond}
            pageSizes={PAGE_SIZES}
            labels={{ tableLandmark: "A doua" }}
          />
        </>
      );
    }
    render(<TwoTables />);
    const firstTable = screen.getByRole("table", { name: "Prima" });
    const secondTable = screen.getByRole("table", { name: "A doua" });
    expect(within(firstTable).getByRole("cell", { name: "Ana" })).toBeInTheDocument();
    expect(within(secondTable).getByRole("cell", { name: "Bogdan" })).toBeInTheDocument();
    expect(within(firstTable).queryByRole("cell", { name: "Bogdan" })).not.toBeInTheDocument();
    const navs = screen.getAllByRole("navigation", { name: "Paginare" });
    expect(within(navs[0]!).getByText("1–1 din 100")).toBeInTheDocument();
    expect(within(navs[1]!).getByText("1–1 din 3")).toBeInTheDocument();
    fireEvent.change(within(firstTable).getByRole("searchbox", { name: /Filtrează Nume/ }), {
      target: { value: "Ana" },
    });
    expect(within(secondTable).getByRole("searchbox", { name: /Filtrează Nume/ })).toHaveValue("");
    expect(within(firstTable).getByRole("cell", { name: "Ana" })).toBeInTheDocument();
  });
});

describe("URL-backed DataTable server mode", () => {
  it("restores the requested page from the URL and follows back and forward", async () => {
    const rootRoute = createRootRoute({ component: () => <Outlet /> });
    const peopleRoute = createRoute({
      getParentRoute: () => rootRoute,
      path: "/people",
      validateSearch: composeTableSearchValidator(PeopleSchema, {
        pageSizes: PAGE_SIZES,
        defaultPageSize: 25,
      }),
      component: function PeoplePage() {
        return (
          <DataTable
            schema={PeopleSchema}
            data={SERVER_PAGE}
            dataMode={DATA_MODES.SERVER}
            totalRows={100}
            pageSizes={PAGE_SIZES}
          />
        );
      },
    });
    const history = createMemoryHistory({
      initialEntries: ["/people?page=2&pageSize=25&name=Bogdan"],
    });
    const router = createRouter({
      routeTree: rootRoute.addChildren([peopleRoute]),
      history,
      defaultPreload: false,
    });
    await act(async () => {
      await router.load();
    });
    render(<RouterProvider router={router} />);
    await waitFor(() => {
      expect(screen.getByText("26–27 din 100")).toBeInTheDocument();
    });
    expect(screen.getByRole("searchbox", { name: /Filtrează Nume/ })).toHaveValue("Bogdan");
    expect(screen.getByRole("cell", { name: "Ana" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Bogdan" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Pagina următoare" }));
    await waitFor(() => {
      expect(history.location.search).toMatch(/page=3/);
      expect(screen.getByText("51–52 din 100")).toBeInTheDocument();
    });
    act(() => {
      history.back();
    });
    await waitFor(() => {
      expect(history.location.search).toMatch(/page=2/);
      expect(screen.getByText("26–27 din 100")).toBeInTheDocument();
    });
    act(() => {
      history.forward();
    });
    await waitFor(() => {
      expect(history.location.search).toMatch(/page=3/);
      expect(screen.getByText("51–52 din 100")).toBeInTheDocument();
    });
    expect(screen.getByRole("cell", { name: "Ana" })).toBeInTheDocument();
  });
});
