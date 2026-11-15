import { expect, test } from "@playwright/test";

test("elevi sorting is keyboard reachable and exposes aria-sort", async ({ page }) => {
  await page.goto("/elevi?page=1&pageSize=10&sort=");
  await expect(page.getByRole("table")).toBeVisible();

  const nameSort = page.getByRole("button", { name: /Sortează Nume/i });
  await nameSort.focus();
  await expect(nameSort).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/sort=name/);
  await expect(page.getByRole("columnheader", { name: /Sortează Nume/i })).toHaveAttribute(
    "aria-sort",
    "ascending",
  );

  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/sort=-name/);
  await expect(page.getByRole("columnheader", { name: /Sortează Nume/i })).toHaveAttribute(
    "aria-sort",
    "descending",
  );
});

test("elevi text filter is keyboard operable and pagination has a landmark", async ({ page }) => {
  await page.goto("/elevi?page=1&pageSize=10&sort=");
  await expect(page.getByRole("navigation", { name: /Paginare/i })).toBeVisible();
  await expect(page.getByRole("button", { name: /Pagina următoare/i })).toBeEnabled();

  const nameFilter = page.getByRole("searchbox", { name: /Filtrează Nume/ });
  await nameFilter.focus();
  await nameFilter.fill("Ana");
  await expect(page).toHaveURL(/name=Ana/);
  await expect(page.getByRole("cell", { name: "Ana Pop" })).toBeVisible();
  await expect(page.getByRole("button", { name: /Pagina următoare/i })).toBeDisabled();
});

test("empty filtered results announce the empty label", async ({ page }) => {
  await page.goto("/elevi?page=1&pageSize=10&sort=&name=zzz-no-match");
  await expect(page.getByText("Nu există rezultate.")).toBeVisible();
});

test("produse loading completes into a labelled table", async ({ page }) => {
  await page.goto("/produse");
  await expect(page.getByRole("heading", { level: 2, name: /Produse/i })).toBeVisible();
  await expect(page.getByRole("table", { name: /Tabel de date/i })).toBeVisible();
  await expect(page.getByRole("columnheader").first()).toBeVisible();
});
