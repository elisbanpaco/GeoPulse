/** Browser acceptance checks. Start the frontend and API first; see README. */
import { chromium } from "playwright";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import { changeSentence, number } from "../src/lib/presentation.ts";
const base = process.env.GEOPULSE_TEST_URL || "http://localhost:3000";
const api = process.env.GEOPULSE_TEST_API_URL || "http://localhost:8000";
const output = process.env.GEOPULSE_TEST_OUTPUT || "/tmp/geopulse-ux";
await fs.mkdir(output, { recursive: true });
const browser = await chromium.launch({
  headless: true,
  ...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE
    ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE }
    : {}),
});
const page = await browser.newPage({
  viewport: { width: 1366, height: 960 },
  acceptDownloads: true,
});
page.setDefaultTimeout(12000);
const errors = [];
page.on("pageerror", (error) => errors.push(String(error)));
const analytics = [];
page.on("request", (request) => {
  if (/dashboard\/(summary|trend|map-data)\?/.test(request.url()))
    analytics.push(request.url());
});
// Permit a separate test API without changing the application's configured API URL.
await page.context().route("**/api/v1/dashboard/**", async (route) => {
  const original = new URL(route.request().url());
  const target = new URL(original.pathname + original.search, api);
  const response = await route.fetch({ url: target.toString() });
  await route.fulfill({
    response,
    headers: {
      ...response.headers(),
      "access-control-allow-origin": new URL(base).origin,
    },
  });
});
const pick = async (trigger, search, option) => {
  await page.getByRole("button", { name: trigger, exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("textbox").fill(search);
  await dialog.getByRole("button", { name: option, exact: true }).click();
  await dialog.waitFor({ state: "hidden" });
};
const noOverflow = async () => {
  assert.ok(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
    "horizontal document overflow",
  );
};
const result = () => page.locator(".gx-result-number");
try {
  const catalog = await (
    await page.request.get(`${api}/api/v1/dashboard/indicators`)
  ).json();
  const registry = await (
    await page.request.get(`${api}/api/v1/dashboard/regions`)
  ).json();
  const homicide = catalog.find((item) => item.code === 30);
  const victimization = catalog.find((item) => item.code === 10);
  assert.ok(
    homicide && victimization,
    "The test dataset must include homicide and victimization indicators.",
  );
  const initialYear = homicide.years[0];
  const percentYear = victimization.years.includes(initialYear)
    ? initialYear
    : victimization.years[0];
  const recorded = await (
    await page.request.get(
      `${api}/api/v1/dashboard/map-data?indicator=30&year=${initialYear}`,
    )
  ).json();
  const percentages = await (
    await page.request.get(
      `${api}/api/v1/dashboard/map-data?indicator=10&year=${percentYear}`,
    )
  ).json();
  const eligible = recorded.filter(
    (row) =>
      row.value !== null &&
      percentages.some(
        (other) => other.COD_DPTO === row.COD_DPTO && other.value !== null,
      ),
  );
  const first = eligible.find((row) => row.COD_DPTO === "16") ?? eligible[0];
  assert.ok(
    first,
    "The test dataset must have a region with both counts and percentages.",
  );
  const second =
    recorded.find(
      (row) =>
        row.COD_DPTO === "01" &&
        row.COD_DPTO !== first.COD_DPTO &&
        row.value !== null,
    ) ??
    recorded.find(
      (row) => row.COD_DPTO !== first.COD_DPTO && row.value !== null,
    );
  assert.ok(
    second,
    "The test dataset must have a second region for comparison.",
  );
  const primary = registry.find((item) => item.code === first.COD_DPTO);
  const secondary = registry.find((item) => item.code === second.COD_DPTO);
  await page.goto(base);
  await page.getByRole("heading", { name: /Entiende los datos/ }).waitFor();
  assert.equal(
    analytics.length,
    0,
    "welcome must not query national statistics",
  );
  await page.screenshot({
    path: `${output}/welcome-desktop.png`,
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Elegir mi región", exact: true })
    .click();
  const welcomeDialog = page.getByRole("dialog");
  await welcomeDialog.getByRole("textbox").fill(primary.name.toLowerCase());
  await welcomeDialog.getByRole("textbox").press("ArrowDown");
  assert.equal(
    await page.evaluate(() => document.activeElement.textContent),
    primary.name,
  );
  await page.keyboard.press("Escape");
  await welcomeDialog.waitFor({ state: "hidden" });
  assert.equal(
    await page
      .getByRole("button", { name: "Elegir mi región", exact: true })
      .evaluate((el) => el === document.activeElement),
    true,
  );
  await pick("Elegir mi región", primary.name, primary.name);
  await page
    .getByRole("heading", {
      name: `Homicidios en ${primary.name}`,
      exact: true,
    })
    .waitFor();
  await result().waitFor();
  const params = new URL(page.url()).searchParams;
  const year = Number(params.get("year"));
  const expected = await (
    await page.request.get(
      `${api}/api/v1/dashboard/summary?indicator=30&region=${primary.code}&year=${year}`,
    )
  ).json();
  assert.equal(await result().innerText(), number(expected.value));
  assert.equal(
    await page.locator(".gx-change-sentence").innerText(),
    changeSentence(expected.value, expected.prev_value, year, "homicidios"),
  );
  assert.equal(await page.locator(".gp-sidebar").count(), 0);
  assert.equal(
    await page
      .locator(".gx-disclosure")
      .first()
      .evaluate((el) => el.open),
    false,
  );
  assert.equal(
    await page.locator("#about-data").evaluate((el) => el.open),
    false,
  );
  await noOverflow();
  await page.screenshot({
    path: `${output}/region-desktop.png`,
    fullPage: true,
  });
  await pick("Comparar con otra región", secondary.name, secondary.name);
  await page
    .getByRole("heading", { name: "¿Cómo se comparan?", exact: true })
    .waitFor();
  await page.locator(".gx-comparison-values > div").nth(1).waitFor();
  assert.equal(await page.locator(".gx-comparison-values > div").count(), 2);
  await page.getByText("Más", { exact: true }).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page
      .getByRole("button", { name: "Descargar datos (CSV)", exact: true })
      .click(),
  ]);
  const csv = await fs.readFile(await download.path(), "utf8");
  assert.ok(csv.includes(primary.name));
  assert.ok(csv.includes(secondary.name));
  assert.equal(csv.trim().split(/\r?\n/).length, 3);
  await page.context().grantPermissions(["clipboard-read", "clipboard-write"]);
  await page.getByText("Más", { exact: true }).click();
  await page
    .getByRole("button", { name: "Copiar enlace", exact: true })
    .click();
  await page
    .getByRole("status")
    .filter({ hasText: "Enlace copiado" })
    .waitFor();
  const shared = await page.evaluate(() => navigator.clipboard.readText());
  assert.equal(shared, page.url());
  await page.reload();
  await page.locator(".gx-comparison-values > div").nth(1).waitFor();
  await page.getByRole("button", { name: "Quitar comparación" }).click();
  await page
    .getByRole("heading", { name: "¿Cómo ha cambiado?", exact: true })
    .waitFor();
  await page.goBack();
  await page
    .getByRole("heading", { name: "¿Cómo se comparan?", exact: true })
    .waitFor();
  await page.getByRole("button", { name: "Quitar comparación" }).click();
  await pick("Tema: Homicidios", "victimizacion", "Victimización");
  await page
    .getByRole("heading", {
      name: `Victimización en ${primary.name}`,
      exact: true,
    })
    .waitFor();
  await page
    .locator(".gx-result-number span")
    .filter({ hasText: "%" })
    .waitFor();
  await page.locator(".gx-disclosure").first().locator("summary").click();
  await page.locator(".leaflet-container path").first().waitFor();
  for (const width of [1920, 1366, 390, 375]) {
    await page.setViewportSize({ width, height: width < 700 ? 844 : 960 });
    await page.waitForTimeout(250);
    await noOverflow();
    const fit = await page.locator(".gx-map-canvas").evaluate((container) => {
      const box = container.getBoundingClientRect();
      const shape = container
        .querySelector(".leaflet-overlay-pane g")
        .getBoundingClientRect();
      return {
        inside:
          shape.left >= box.left - 2 &&
          shape.right <= box.right + 2 &&
          shape.top >= box.top - 2 &&
          shape.bottom <= box.bottom + 2,
        box: { w: box.width, h: box.height },
        shape: { w: shape.width, h: shape.height },
      };
    });
    assert.ok(fit.inside, JSON.stringify({ width, ...fit }));
    await page.screenshot({
      path: `${output}/region-${width}.png`,
      fullPage: true,
    });
  }
  // Error states and recovery remain explicit, never rendered as a zero.
  let reject = true;
  await page.route("**/api/v1/dashboard/summary?**", async (route) => {
    if (reject)
      await route.fulfill({
        status: 503,
        contentType: "application/json",
        headers: { "access-control-allow-origin": new URL(base).origin },
        body: JSON.stringify({
          detail: "Datos no disponibles para esta prueba",
        }),
      });
    else await route.fallback();
  });
  const years = await page
    .locator("#query-year option")
    .evaluateAll((options) => options.map((option) => option.value));
  const current = await page.locator("#query-year").inputValue();
  const other = years.find((y) => y !== current);
  if (other) {
    await page.locator("#query-year").selectOption(other);
    await page
      .getByRole("alert")
      .filter({ hasText: "Datos no disponibles" })
      .waitFor();
    assert.equal(await result().count(), 0);
    reject = false;
    await page
      .getByRole("alert")
      .getByRole("button", { name: "Reintentar" })
      .click();
    await result().waitFor();
  }
  await page.unrouteAll({ behavior: "wait" });
  // Missing values must stay absent instead of looking like a safe or zero result.
  if (other) {
    await page.route("**/api/v1/dashboard/summary?**", async (route) => {
      const url = new URL(route.request().url());
      const response = await route.fetch({
        url: new URL(url.pathname + url.search, api).toString(),
      });
      const original = await response.json();
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        headers: { "access-control-allow-origin": new URL(base).origin },
        json: {
          ...original,
          value: null,
          prev_value: null,
          yoy_variation_percent: null,
          missing_reason: "Sin dato regional",
        },
      });
    });
    await page.locator("#query-year").selectOption(current);
    await page
      .getByRole("heading", {
        name: "No hay datos para esta selección",
        exact: true,
      })
      .waitFor();
    assert.equal(await result().count(), 0);
    await page.unrouteAll({ behavior: "wait" });
    await page.locator("#query-year").selectOption(other);
    await result().waitFor();
    const latestResult = await result().innerText();
    await page.route("**/api/v1/dashboard/summary?**", async (route) => {
      if (new URL(route.request().url()).searchParams.get("year") === current)
        await new Promise((resolve) => setTimeout(resolve, 650));
      try {
        await route.fallback();
      } catch {
        /* An obsolete request may already be cancelled. */
      }
    });
    await page.locator("#query-year").selectOption(current);
    await page.locator("#query-year").selectOption(other);
    await result().waitFor();
    await page.waitForTimeout(800);
    assert.equal(await result().innerText(), latestResult);
    await page.unrouteAll({ behavior: "wait" });
  }
  // Old URLs enter the matching contextual sections without a separate dashboard.
  await page.goto(
    `${base}/?region=${primary.code}&indicator=30&year=${year}&view=reports`,
  );
  await page
    .getByRole("heading", { name: "Descarga esta consulta", exact: true })
    .waitFor();
  await page.goto(
    `${base}/?region=${primary.code}&indicator=30&year=${year}&view=prediction`,
  );
  await page
    .getByRole("heading", { name: "Análisis avanzado", exact: true })
    .waitFor();
  await page.goto(base);
  await page.getByRole("heading", { name: /Entiende los datos/ }).waitFor();
  await page.screenshot({
    path: `${output}/welcome-mobile.png`,
    fullPage: true,
  });
  await page.getByRole("button", { name: "Prefiero ver todo el Perú" }).click();
  await page
    .getByRole("heading", { name: "Homicidios en Perú", exact: true })
    .waitFor();
  await page.locator(".leaflet-container path").first().waitFor();
  assert.equal(new URL(page.url()).searchParams.get("scope"), "national");
  assert.deepEqual(errors, []);
  console.log(
    JSON.stringify(
      {
        ok: true,
        checks: [
          "region-first welcome",
          "search and keyboard navigation",
          "Escape and focus restoration",
          "plain-language count changes",
          "inline comparison",
          "CSV scope",
          "shared URL",
          "reload and Back",
          "percentage-point presentation",
          "full Peru map at 1920/1366/390/375px",
          "API error and retry",
          "missing values are not zero",
          "obsolete responses cannot replace current results",
          "legacy reports and ML URLs",
          "explicit national selection",
        ],
        screenshots: output,
      },
      null,
      2,
    ),
  );
} catch (error) {
  await page.screenshot({ path: `${output}/failure.png`, fullPage: true });
  console.log(await page.locator("body").innerText());
  throw error;
} finally {
  await browser.close();
}
