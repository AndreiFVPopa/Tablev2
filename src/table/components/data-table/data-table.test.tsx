import { act, fireEvent, render, screen, within } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { createDefaultTableState, type DataTableState } from "@table/lib/table-state";

import { DataTable, DEFAULT_PAGE_SIZES } from "./data-table";

import type { TableLabels } from "@table/table-labels";

const PeopleSchema = z.object({
  name: z.string().meta({ title: "Nume" }),
  age: z.int().meta({ title: "Vârstă" }),
  active: z.boolean().meta({ title: "Activ" }),
  status: z.enum(["new", "done", "archived"]).meta({ title: "Status" }),
  tags: z.array(z.enum(["alpha", "beta", "gamma"])).meta({ title: "Etichete" }),
  joined: z.date().meta({ title: "Înscris" }),
  address: z
    .object({
      city: z.string().meta({ title: "Oraș" }),
    })
    .meta({ title: "Adresă" }),
  hidden: z.string().meta({ title: "Ascuns", table: { hidden: true } }),
});
type Person = z.infer<typeof PeopleSchema>;
function person(overrides: Partial<Person> = {}): Person {
  return {
    name: "Ana",
    age: 20,
    active: true,
    status: "new",
    tags: ["alpha"],
    joined: new Date("2026-01-01T12:00:00Z"),
    address: { city: "Cluj" },
    hidden: "secret",
    ...overrides,
  };
}
const PEOPLE: readonly Person[] = [
  person({
    name: "Ana",
    age: 20,
    active: true,
    status: "new",
    tags: ["alpha"],
    joined: new Date("2026-01-01T12:00:00Z"),
    address: { city: "Cluj" },
  }),
  person({
    name: "Bogdan",
    age: 45,
    active: false,
    status: "done",
    tags: ["beta"],
    joined: new Date("2026-06-15T12:00:00Z"),
    address: { city: "Sibiu" },
  }),
  person({
    name: "carla",
    age: 32,
    active: true,
    status: "done",
    tags: ["alpha", "gamma"],
    joined: new Date("2026-11-20T12:00:00Z"),
    address: { city: "Brașov" },
  }),
];
interface HarnessProps<TSchema extends z.ZodObject> {
  readonly schema: TSchema;
  readonly data: readonly z.output<TSchema>[];
  readonly initial?: Partial<DataTableState>;
  readonly labels?: Partial<TableLabels>;
  readonly pageSizes?: readonly number[];
}
function Harness<TSchema extends z.ZodObject>({
  schema,
  data,
  initial,
  labels,
  pageSizes,
}: HarnessProps<TSchema>): React.JSX.Element {
  const [state, setState] = useState<DataTableState>(() => createDefaultTableState(initial));
  return (
    <DataTable
      schema={schema}
      data={data}
      state={state}
      onStateChange={setState}
      {...(labels !== undefined ? { labels } : {})}
      {...(pageSizes !== undefined ? { pageSizes } : {})}
    />
  );
}
function renderTable<TSchema extends z.ZodObject>(
  props: HarnessProps<TSchema>,
): ReturnType<typeof render> {
  return render(<Harness {...props} />);
}
describe("DataTable column generation", () => {
  it("renders one column per non-hidden leaf, in schema order", () => {
    renderTable({ schema: PeopleSchema, data: PEOPLE });
    const headers = screen.getAllByRole("columnheader");
    const titleRow = headers.slice(0, 7).map((h) => h.textContent);
    for (const txt of titleRow) {
      expect(txt).not.toMatch(/Ascuns/);
    }
    expect(titleRow[0]).toMatch(/Nume/);
    expect(titleRow[6]).toMatch(/Oraș/);
  });
  it("uses dotted paths as column ids for nested fields", () => {
    renderTable({ schema: PeopleSchema, data: PEOPLE });
    const cityCells = screen.getAllByRole("cell").filter((c) => c.textContent === "Cluj");
    expect(cityCells.length).toBeGreaterThan(0);
  });
});
describe("DataTable cell rendering", () => {
  it("renders booleans, enums, dates, and tag arrays", () => {
    renderTable({ schema: PeopleSchema, data: [PEOPLE[0]!] });
    const row = screen.getAllByRole("row")[2]!;
    expect(within(row).getByRole("cell", { name: "Da" })).toBeInTheDocument();
    expect(within(row).getByRole("cell", { name: "new" })).toBeInTheDocument();
    expect(within(row).getByRole("cell", { name: "alpha" })).toBeInTheDocument();
    expect(row.textContent).toMatch(/20/);
  });
});
describe("DataTable filtering", () => {
  it("text filter narrows rows case-insensitively", () => {
    renderTable({ schema: PeopleSchema, data: PEOPLE });
    const search = screen.getByRole("searchbox", { name: /Filtrează Nume/ });
    fireEvent.change(search, { target: { value: "BOG" } });
    expect(screen.getByRole("cell", { name: "Bogdan" })).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "Ana" })).not.toBeInTheDocument();
    fireEvent.change(search, { target: { value: "" } });
    expect(screen.getByRole("cell", { name: "Ana" })).toBeInTheDocument();
  });
  it("number range filter applies inclusive min/max", () => {
    renderTable({ schema: PeopleSchema, data: PEOPLE });
    const min = screen.getByRole("spinbutton", { name: /Filtrează Vârstă.*Min/i });
    fireEvent.change(min, { target: { value: "30" } });
    expect(screen.queryByRole("cell", { name: "Ana" })).not.toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "carla" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Bogdan" })).toBeInTheDocument();
    fireEvent.change(min, { target: { value: "" } });
    expect(screen.getByRole("cell", { name: "Ana" })).toBeInTheDocument();
  });
  it("enum filter restricts to a selected option", () => {
    renderTable({ schema: PeopleSchema, data: PEOPLE });
    const select = screen.getByRole("combobox", { name: /Filtrează Status/ });
    fireEvent.change(select, { target: { value: "done" } });
    expect(screen.queryByRole("cell", { name: "Ana" })).not.toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Bogdan" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "carla" })).toBeInTheDocument();
  });
  it("boolean filter restricts to true/false", () => {
    renderTable({ schema: PeopleSchema, data: PEOPLE });
    fireEvent.click(screen.getByRole("radio", { name: "Nu" }));
    expect(screen.getByRole("cell", { name: "Bogdan" })).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "Ana" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Da" }));
    expect(screen.getByRole("cell", { name: "Ana" })).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "Bogdan" })).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("radio", { name: "Toate" }));
    expect(screen.getByRole("cell", { name: "Ana" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Bogdan" })).toBeInTheDocument();
  });
  it("tags filter is multi-select match-any", () => {
    renderTable({ schema: PeopleSchema, data: PEOPLE });
    const betaCheck = screen.getByRole("checkbox", { name: "beta" });
    fireEvent.click(betaCheck);
    expect(screen.getByRole("cell", { name: "Bogdan" })).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "Ana" })).not.toBeInTheDocument();
    fireEvent.click(betaCheck);
    expect(screen.getByRole("cell", { name: "Ana" })).toBeInTheDocument();
  });
  it("date range filter keeps rows on or after the from date and clears when emptied", () => {
    renderTable({ schema: PeopleSchema, data: PEOPLE });
    const from = screen.getByLabelText("Filtrează Înscris — De la");
    fireEvent.change(from, { target: { value: "2026-06-01" } });
    expect(screen.queryByRole("cell", { name: "Ana" })).not.toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "Bogdan" })).toBeInTheDocument();
    fireEvent.change(from, { target: { value: "" } });
    expect(screen.getByRole("cell", { name: "Ana" })).toBeInTheDocument();
  });
  it("filter activation resets pageIndex to 0", () => {
    renderTable({
      schema: PeopleSchema,
      data: PEOPLE,
      initial: { pagination: { pageIndex: 1, pageSize: 2 } },
    });
    expect(screen.getByRole("cell", { name: "carla" })).toBeInTheDocument();
    const search = screen.getByRole("searchbox", { name: /Filtrează Nume/ });
    fireEvent.change(search, { target: { value: "a" } });
    expect(screen.getByRole("cell", { name: "Ana" })).toBeInTheDocument();
  });
});
describe("DataTable sorting", () => {
  it("toggles ascending then descending for a text column", () => {
    renderTable({ schema: PeopleSchema, data: PEOPLE });
    const nameHeader = screen.getByRole("button", { name: /Sortează Nume/i });
    fireEvent.click(nameHeader);
    let firstRow = screen.getAllByRole("row")[2];
    expect(within(firstRow!).getByRole("cell", { name: "Ana" })).toBeInTheDocument();
    fireEvent.click(nameHeader);
    firstRow = screen.getAllByRole("row")[2];
    expect(within(firstRow!).getByRole("cell", { name: "carla" })).toBeInTheDocument();
  });
  it("sorts numbers numerically (not lexicographically)", () => {
    renderTable({ schema: PeopleSchema, data: PEOPLE });
    const header = screen.getByRole("button", { name: /Sortează Vârstă/i });
    fireEvent.click(header);
    const firstDataRow = screen.getAllByRole("row")[2]!;
    const firstCell = within(firstDataRow).getAllByRole("cell")[0]!;
    expect(firstCell.textContent).toBe("Ana");
  });
  it("sorts booleans with false before true ascending", () => {
    renderTable({ schema: PeopleSchema, data: PEOPLE });
    fireEvent.click(screen.getByRole("button", { name: /Sortează Activ/i }));
    const firstDataRow = screen.getAllByRole("row")[2]!;
    expect(within(firstDataRow).getByRole("cell", { name: "Bogdan" })).toBeInTheDocument();
  });
  it("sorts dates chronologically ascending", () => {
    renderTable({ schema: PeopleSchema, data: PEOPLE });
    fireEvent.click(screen.getByRole("button", { name: /Sortează Înscris/i }));
    const firstDataRow = screen.getAllByRole("row")[2]!;
    expect(within(firstDataRow).getByRole("cell", { name: "Ana" })).toBeInTheDocument();
  });
  it("does not expose a sort toggle for tag columns", () => {
    renderTable({ schema: PeopleSchema, data: PEOPLE });
    expect(screen.queryByRole("button", { name: /Sortează Etichete/i })).not.toBeInTheDocument();
  });
  it("sets aria-sort on the active sort column", () => {
    renderTable({ schema: PeopleSchema, data: PEOPLE });
    const nameHeader = screen.getByRole("button", { name: /Sortează Nume/i });
    fireEvent.click(nameHeader);
    const nameTh = nameHeader.closest("th");
    expect(nameTh?.getAttribute("aria-sort")).toBe("ascending");
  });
});
describe("DataTable pagination", () => {
  it("renders the configured page-size options", () => {
    renderTable({ schema: PeopleSchema, data: PEOPLE, pageSizes: [1, 2] });
    const select = screen.getByRole("combobox", { name: /Rânduri pe pagină/ });
    const options = within(select)
      .getAllByRole("option")
      .map((o) => o.textContent);
    expect(options).toEqual(["1", "2"]);
  });
  it("paginates client-side and offers next/previous controls", () => {
    renderTable({ schema: PeopleSchema, data: PEOPLE, pageSizes: [1, 2, 3] });
    const select = screen.getByRole("combobox", { name: /Rânduri pe pagină/ });
    fireEvent.change(select, { target: { value: "1" } });
    expect(screen.getAllByRole("row")).toHaveLength(3);
    fireEvent.click(screen.getByRole("button", { name: "Pagina următoare" }));
    expect(screen.getAllByRole("row")[2]?.textContent).toMatch(/Bogdan/);
    fireEvent.click(screen.getByRole("button", { name: "Pagina anterioară" }));
    expect(screen.getAllByRole("row")[2]?.textContent).toMatch(/Ana/);
    fireEvent.click(screen.getByRole("button", { name: "Ultima pagină" }));
    expect(screen.getAllByRole("row")[2]?.textContent).toMatch(/carla/);
    fireEvent.click(screen.getByRole("button", { name: "Prima pagină" }));
    expect(screen.getAllByRole("row")[2]?.textContent).toMatch(/Ana/);
  });
  it("changing page size resets pageIndex to 0", () => {
    renderTable({
      schema: PeopleSchema,
      data: PEOPLE,
      pageSizes: [1, 2, 3],
      initial: { pagination: { pageIndex: 2, pageSize: 1 } },
    });
    expect(screen.getByRole("cell", { name: "carla" })).toBeInTheDocument();
    const select = screen.getByRole("combobox", { name: /Rânduri pe pagină/ });
    fireEvent.change(select, { target: { value: "3" } });
    expect(screen.getByRole("cell", { name: "Ana" })).toBeInTheDocument();
  });
  it("exposes DEFAULT_PAGE_SIZES", () => {
    expect(DEFAULT_PAGE_SIZES).toEqual([10, 25, 50, 100]);
  });
});
describe("DataTable labels override", () => {
  it("merges a partial override on top of the Romanian defaults", () => {
    renderTable({
      schema: PeopleSchema,
      data: PEOPLE,
      labels: { cellBooleanTrue: "YES" },
    });
    expect(screen.getAllByText("YES")).toHaveLength(2);
    expect(screen.getByRole("radio", { name: "Da" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Prima pagină" })).toBeInTheDocument();
  });
});
describe("DataTable empty state", () => {
  it("renders the empty-state message spanning all columns", () => {
    renderTable({ schema: PeopleSchema, data: [] });
    const cell = screen.getByText("Nu există rezultate.");
    expect(cell.tagName).toBe("TD");
    expect(cell.getAttribute("colspan")).toMatch(/\d+/);
  });
  it("honours a labels override for the empty-state message", () => {
    renderTable({ schema: PeopleSchema, data: [], labels: { tableEmpty: "Gol" } });
    expect(screen.getByText("Gol")).toBeInTheDocument();
  });
});
describe("DataTable accessibility", () => {
  it("has an aria-labelled table landmark", () => {
    renderTable({ schema: PeopleSchema, data: PEOPLE });
    expect(screen.getByRole("table", { name: "Tabel de date" })).toBeInTheDocument();
  });
  it("marks sortable headers with aria-sort=none until clicked", () => {
    renderTable({ schema: PeopleSchema, data: PEOPLE });
    const nameHeader = screen.getByRole("button", { name: /Sortează Nume/i });
    const th = nameHeader.closest("th");
    expect(th?.getAttribute("aria-sort")).toBe("none");
  });
  it("does not set aria-sort on tag headers (not sortable)", () => {
    renderTable({ schema: PeopleSchema, data: PEOPLE });
    const allHeaders = screen.getAllByRole("columnheader");
    const tagHeader = allHeaders.find((h) => h.textContent.includes("Etichete"));
    expect(tagHeader?.getAttribute("aria-sort")).toBeNull();
  });
  it("exposes a navigation landmark for pagination", () => {
    renderTable({ schema: PeopleSchema, data: PEOPLE });
    expect(screen.getByRole("navigation", { name: "Paginare" })).toBeInTheDocument();
  });
});
describe("DataTable controlled state", () => {
  it("emits every state transition to onStateChange", () => {
    const changes: DataTableState[] = [];
    function Controlled(): React.JSX.Element {
      const [state, setState] = useState<DataTableState>(() => createDefaultTableState());
      return (
        <DataTable
          schema={PeopleSchema}
          data={PEOPLE}
          state={state}
          onStateChange={(next) => {
            changes.push(next);
            setState(next);
          }}
        />
      );
    }
    render(<Controlled />);
    act(() => {
      fireEvent.change(screen.getByRole("searchbox", { name: /Filtrează Nume/ }), {
        target: { value: "a" },
      });
    });
    expect(changes.length).toBeGreaterThan(0);
    const last = changes.at(-1)!;
    expect(last.columnFilters.some((f) => f.id === "name")).toBe(true);
    expect(last.pagination.pageIndex).toBe(0);
  });
  it("treats external state as authoritative — no competing internal copy", () => {
    function ExternalDriver(): React.JSX.Element {
      const [state, setState] = useState<DataTableState>(() => createDefaultTableState());
      return (
        <>
          <button
            type="button"
            onClick={() => {
              setState({
                ...state,
                columnFilters: [{ id: "name", value: "Bogdan" }],
                pagination: { ...state.pagination, pageIndex: 0 },
              });
            }}
          >
            Force filter
          </button>
          <DataTable schema={PeopleSchema} data={PEOPLE} state={state} onStateChange={setState} />
        </>
      );
    }
    render(<ExternalDriver />);
    expect(screen.getByRole("cell", { name: "Ana" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Force filter" }));
    expect(screen.getByRole("cell", { name: "Bogdan" })).toBeInTheDocument();
    expect(screen.queryByRole("cell", { name: "Ana" })).not.toBeInTheDocument();
  });
});
describe("DataTable with an unrelated schema", () => {
  const BookSchema = z.object({
    title: z.string().meta({ title: "Titlu" }),
    rating: z.number().meta({ title: "Notă" }),
  });
  type Book = z.infer<typeof BookSchema>;
  const BOOKS: readonly Book[] = [
    { title: "A", rating: 4 },
    { title: "B", rating: 3 },
  ];
  it("renders and sorts a schema it has never seen before", () => {
    renderTable({ schema: BookSchema, data: BOOKS });
    expect(screen.getByRole("button", { name: /Sortează Titlu/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Sortează Notă/i })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /Sortează Notă/i }));
    const firstData = screen.getAllByRole("row")[2]!;
    const firstCell = within(firstData).getAllByRole("cell")[0]!;
    expect(firstCell.textContent).toBe("B");
  });
});
