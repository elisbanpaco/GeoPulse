import { test } from "node:test";
import assert from "node:assert/strict";
import {
  resolveFilters,
  filterQuery,
  formatValue,
} from "../src/lib/filters.ts";
const indicators = [
  { code: 30, years: [2024, 2023] },
  { code: 10, years: [2022, 2020] },
];
const regions = [
  { code: "01", name: "Amazonas" },
  { code: "02", name: "Áncash" },
];
test("defaults to homicide and its latest actual period", () => {
  assert.deepEqual(resolveFilters(new URLSearchParams(), indicators, regions), {
    national: false,
    indicator: 30,
    year: 2024,
    region: null,
    compareRegion: null,
    view: "general",
  });
});
test("shared URL restores the exact comparison and period", () => {
  const original = {
    national: false,
    indicator: 10,
    year: 2020,
    region: "01",
    compareRegion: "02",
    view: "comparative",
  };
  assert.deepEqual(
    resolveFilters(filterQuery(original), indicators, regions),
    original,
  );
});
test("rejects unknown indicator, year, territory, and view", () => {
  const result = resolveFilters(
    new URLSearchParams(
      "indicator=999&year=2026&region=15&compare_region=99&view=invalid",
    ),
    indicators,
    regions,
  );
  assert.equal(result.indicator, 30);
  assert.equal(result.year, 2024);
  assert.equal(result.region, null);
  assert.equal(result.compareRegion, null);
  assert.equal(result.view, "general");
});
test("changing indicator cannot retain a year absent from its data", () => {
  assert.equal(
    resolveFilters(
      new URLSearchParams("indicator=10&year=2024"),
      indicators,
      regions,
    ).year,
    2022,
  );
});
test("cannot compare a territory with itself", () => {
  assert.equal(
    resolveFilters(
      new URLSearchParams("region=01&compare_region=01"),
      indicators,
      regions,
    ).compareRegion,
    null,
  );
});
test("zero is a real observation, missing values stay absent, decimals are retained", () => {
  assert.equal(formatValue(0, "%"), "0 %");
  assert.equal(formatValue(null, "%"), "Sin dato");
  assert.equal(formatValue(undefined), "Sin dato");
  assert.match(formatValue(1.25, "%"), /1[.,]25 %/);
});

test("the initial page does not silently choose national data", () => {
  assert.equal(resolveFilters(new URLSearchParams(), indicators, regions).national, false);
});
test("explicit national selection survives sharing and reloading", () => {
  const state = { national: true, indicator: 30, year: 2024, region: null, compareRegion: null, view: "general" };
  assert.deepEqual(resolveFilters(filterQuery(state), indicators, regions), state);
});
test("old national and advanced links still open their result", () => {
  assert.equal(resolveFilters(new URLSearchParams("indicator=30&year=2024&view=reports"), indicators, regions).national, true);
  assert.equal(resolveFilters(new URLSearchParams("region=01&view=prediction"), indicators, regions).view, "prediction");
});
test("a region takes precedence over a national scope", () => {
  const result = resolveFilters(new URLSearchParams("region=01&scope=national"), indicators, regions);
  assert.equal(result.region, "01");
  assert.equal(result.national, false);
});
