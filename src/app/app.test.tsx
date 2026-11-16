import { createMemoryHistory, RouterProvider } from "@tanstack/react-router";
import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { createAppRouter } from "./app";

describe("App", () => {
  it("renders the shell and redirects to Elevi", async () => {
    const history = createMemoryHistory({ initialEntries: ["/"] });
    const router = createAppRouter(history);
    await act(async () => {
      await router.load();
    });
    render(<RouterProvider router={router} />);

    expect(
      screen.getByRole("heading", { level: 1, name: /schema-driven data table/i }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Elevi/i })).toBeInTheDocument();
    await waitFor(() => {
      expect(history.location.pathname).toBe("/elevi");
      expect(screen.getByRole("heading", { level: 2, name: /Elevi/i })).toBeInTheDocument();
    });
    await waitFor(() => {
      expect(screen.getByRole("table", { name: /Tabel de date/i })).toBeInTheDocument();
    });
  });
});
