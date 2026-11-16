import { expect, test } from "@playwright/test";

test("redirects home to Elevi and loads the students table", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(/Schema-Driven Data Table/i);
  await expect(page).toHaveURL(/\/elevi/);
  await expect(page.getByRole("heading", { level: 2, name: /Elevi/i })).toBeVisible();
  await expect(page.getByRole("table", { name: /Tabel de date/i })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Ana Pop" })).toBeVisible();
});

test("elevi URL filter, sort, pagination, refresh, and back/forward", async ({ page }) => {
  await page.goto("/elevi?page=1&pageSize=10&sort=&utm=e2e");
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page).toHaveURL(/utm=e2e/);
  await expect(page.getByLabel(/Rânduri pe pagină/i)).toHaveValue("10");

  await page.getByRole("button", { name: /Sortează Nume/i }).click();
  await expect(page).toHaveURL(/sort=name/);

  await page.getByRole("button", { name: /Pagina următoare/i }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page).toHaveURL(/utm=e2e/);

  await page.getByRole("searchbox", { name: /Filtrează Oraș/ }).fill("Sibiu");
  await expect(page).toHaveURL(/address\.city=Sibiu/);
  await expect(page).toHaveURL(/page=1/);
  await expect(page.getByRole("cell", { name: "Bogdan Ionescu" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Ana Pop" })).toHaveCount(0);

  await page.reload();
  await expect(page).toHaveURL(/address\.city=Sibiu/);
  await expect(page.getByRole("searchbox", { name: /Filtrează Oraș/ })).toHaveValue("Sibiu");
  await expect(page.getByRole("cell", { name: "Bogdan Ionescu" })).toBeVisible();

  await page.goBack();
  await expect(page).not.toHaveURL(/address\.city=Sibiu/);
  await page.goForward();
  await expect(page).toHaveURL(/address\.city=Sibiu/);
});

test("/produse is not registered as a demo route", async ({ page }) => {
  await page.goto("/produse");
  await expect(page.getByRole("link", { name: /Produse/i })).toHaveCount(0);
  await expect(page.getByRole("heading", { level: 2, name: /Produse/i })).toHaveCount(0);
  await expect(page.getByRole("button", { name: /Sortează Titlu/i })).toHaveCount(0);
});

test("elevi gender uses positional gen URL aliases", async ({ page }) => {
  await page.goto("/elevi?page=1&pageSize=10&sort=&gen=1");
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByLabel(/Filtrează Gen/i)).toHaveValue("male");
  await expect(page.getByRole("cell", { name: "Bogdan Ionescu" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Ana Pop" })).toHaveCount(0);

  await page.getByLabel(/Filtrează Gen/i).selectOption("female");
  await expect(page).toHaveURL(/gen=2/);
  await expect(page.getByRole("cell", { name: "Ana Pop" })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/gen=2/);
  await expect(page.getByLabel(/Filtrează Gen/i)).toHaveValue("female");
});

test("elevi tags use slug URL aliases", async ({ page }) => {
  await page.goto("/elevi?page=1&pageSize=25&sort=&tags=bursa");
  await expect(page.getByRole("table")).toBeVisible();
  await expect(page.getByRole("checkbox", { name: "bursă" })).toBeChecked();
  await expect(page.getByRole("cell", { name: "Ana Pop" })).toBeVisible();
});
