import { expect, test } from "@playwright/test";

test("elevi boolean URLs keep the loaded token and filter rows", async ({ page }) => {
  await page.goto("/elevi?active=true");
  await expect(page).toHaveURL(/[?&]active=true(?:&|$)/);
  await expect(page.getByRole("radio", { name: "Da" })).toBeChecked();
  await expect(page.getByRole("cell", { name: "Bogdan Ionescu" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Ana Pop" })).toHaveCount(0);

  await page.goto("/elevi?active=1");
  await expect(page).toHaveURL(/[?&]active=1(?:&|$)/);
  await expect(page).not.toHaveURL(/active=true/);
  await expect(page.getByRole("radio", { name: "Da" })).toBeChecked();
  await expect(page.getByRole("cell", { name: "Bogdan Ionescu" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Ana Pop" })).toHaveCount(0);

  await page.goto("/elevi?active=false");
  await expect(page).toHaveURL(/[?&]active=false(?:&|$)/);
  await expect(page.getByRole("radio", { name: "Nu" })).toBeChecked();
  await expect(page.getByRole("cell", { name: "Ana Pop" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Bogdan Ionescu" })).toHaveCount(0);

  await page.goto("/elevi?active=2");
  await expect(page).toHaveURL(/[?&]active=2(?:&|$)/);
  await expect(page.getByRole("radio", { name: "Nu" })).toBeChecked();
  await expect(page.getByRole("cell", { name: "Ana Pop" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Bogdan Ionescu" })).toHaveCount(0);
});

test("elevi gender URLs keep positional, canonical, and display-label tokens", async ({ page }) => {
  for (const gen of ["1", "male", "masculin", "Masculin"]) {
    await page.goto(`/elevi?gen=${gen}`);
    await expect(page).toHaveURL(new RegExp(`[?&]gen=${gen}(?:&|$)`));
    await expect(page.getByLabel(/Filtrează Gen/i)).toHaveValue("male");
    await expect(page.getByRole("cell", { name: "Bogdan Ionescu" })).toBeVisible();
    await expect(page.getByRole("cell", { name: "Ana Pop" })).toHaveCount(0);
  }

  await page.goto("/elevi?gen=female");
  await expect(page).toHaveURL(/[?&]gen=female(?:&|$)/);
  await expect(page.getByLabel(/Filtrează Gen/i)).toHaveValue("female");
  await expect(page.getByRole("cell", { name: "Ana Pop" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Bogdan Ionescu" })).toHaveCount(0);

  await page.goto("/elevi?gen=feminin");
  await expect(page).toHaveURL(/[?&]gen=feminin(?:&|$)/);
  await expect(page.getByLabel(/Filtrează Gen/i)).toHaveValue("female");
  await expect(page.getByRole("cell", { name: "Ana Pop" })).toBeVisible();
});

test("changing page keeps gen=masculin and the gender control writes a positional token", async ({
  page,
}) => {
  await page.goto("/elevi?gen=masculin&page=1&pageSize=10&sort=");
  await expect(page).toHaveURL(/[?&]gen=masculin(?:&|$)/);
  await expect(page.getByLabel(/Filtrează Gen/i)).toHaveValue("male");

  await page.getByRole("button", { name: /Pagina următoare/i }).click();
  await expect(page).toHaveURL(/page=2/);
  await expect(page).toHaveURL(/[?&]gen=masculin(?:&|$)/);
  await expect(page.getByLabel(/Filtrează Gen/i)).toHaveValue("male");
  await expect(page.getByRole("cell", { name: "Bogdan Ionescu" })).toHaveCount(0);

  await page.getByLabel(/Filtrează Gen/i).selectOption("female");
  await expect(page).toHaveURL(/[?&]gen=2(?:&|$)/);
  await expect(page).not.toHaveURL(/gen=masculin/);
  await expect(page.getByLabel(/Filtrează Gen/i)).toHaveValue("female");
  await expect(page.getByRole("cell", { name: "Ana Pop" })).toBeVisible();
});

test("elevi drops invalid filter tokens and keeps unrelated parameters", async ({ page }) => {
  await page.goto("/elevi?active=0&gen=nope&utm=keep");
  await expect(page).toHaveURL(/utm=keep/);
  await expect(page).not.toHaveURL(/[?&]active=/);
  await expect(page).not.toHaveURL(/[?&]gen=/);
  await expect(page.getByRole("radio", { name: "Toate" })).toBeChecked();
  await expect(page.getByLabel(/Filtrează Gen/i)).toHaveValue("__all__");
  await expect(page.getByRole("cell", { name: "Ana Pop" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Bogdan Ionescu" })).toBeVisible();
});

test("elevi gender label alias survives refresh and browser history", async ({ page }) => {
  await page.goto("/elevi?page=1&pageSize=25&sort=");
  await page.goto("/elevi?gen=masculin&utm=keep");
  await expect(page).toHaveURL(/[?&]gen=masculin(?:&|$)/);
  await expect(page).toHaveURL(/utm=keep/);
  await expect(page.getByLabel(/Filtrează Gen/i)).toHaveValue("male");
  await expect(page.getByRole("cell", { name: "Bogdan Ionescu" })).toBeVisible();
  await expect(page.getByRole("cell", { name: "Ana Pop" })).toHaveCount(0);

  await page.reload();
  await expect(page).toHaveURL(/[?&]gen=masculin(?:&|$)/);
  await expect(page.getByLabel(/Filtrează Gen/i)).toHaveValue("male");
  await expect(page.getByRole("cell", { name: "Bogdan Ionescu" })).toBeVisible();

  await page.goBack();
  await expect(page).not.toHaveURL(/[?&]gen=/);
  await expect(page.getByLabel(/Filtrează Gen/i)).toHaveValue("__all__");
  await expect(page.getByRole("cell", { name: "Ana Pop" })).toBeVisible();

  await page.goForward();
  await expect(page).toHaveURL(/[?&]gen=masculin(?:&|$)/);
  await expect(page.getByLabel(/Filtrează Gen/i)).toHaveValue("male");
  await expect(page.getByRole("cell", { name: "Ana Pop" })).toHaveCount(0);
});

test("elevi boolean filter survives refresh and browser history", async ({ page }) => {
  await page.goto("/elevi?page=1&pageSize=25&sort=");
  await page.goto("/elevi?active=false");
  await expect(page).toHaveURL(/[?&]active=false(?:&|$)/);
  await expect(page.getByRole("radio", { name: "Nu" })).toBeChecked();
  await expect(page.getByRole("cell", { name: "Ana Pop" })).toBeVisible();

  await page.reload();
  await expect(page).toHaveURL(/[?&]active=false(?:&|$)/);
  await expect(page.getByRole("radio", { name: "Nu" })).toBeChecked();
  await expect(page.getByRole("cell", { name: "Bogdan Ionescu" })).toHaveCount(0);

  await page.goBack();
  await expect(page).not.toHaveURL(/[?&]active=/);
  await expect(page.getByRole("radio", { name: "Toate" })).toBeChecked();
  await expect(page.getByRole("cell", { name: "Bogdan Ionescu" })).toBeVisible();

  await page.goForward();
  await expect(page).toHaveURL(/[?&]active=false(?:&|$)/);
  await expect(page.getByRole("radio", { name: "Nu" })).toBeChecked();
  await expect(page.getByRole("cell", { name: "Ana Pop" })).toBeVisible();
});
