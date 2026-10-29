import { test } from "node:test";
import assert from "node:assert/strict";
import {
  changeSentence,
  resultLabel,
  normalizeSearch,
} from "../src/lib/presentation.ts";
test("counts are explained as an absolute change before percentages", () => {
  assert.equal(
    changeSentence(26, 25, 2021, "homicidios"),
    "1 más que en 2020.",
  );
  assert.equal(
    changeSentence(24, 26, 2021, "homicidios"),
    "2 menos que en 2020.",
  );
});
test("percentage values use percentage points rather than relative growth", () => {
  assert.equal(
    changeSentence(25, 20, 2024, "%"),
    "5 puntos porcentuales más que en 2023.",
  );
  assert.equal(
    changeSentence(19, 20, 2024, "%"),
    "1 punto porcentual menos que en 2023.",
  );
  assert.match(
    changeSentence(14.5, 17.5, 2024, "%"),
    /^3 puntos porcentuales menos/,
  );
});
test("missing observations do not invent an improvement or a zero", () => {
  assert.equal(
    changeSentence(10, null, 2024, "casos"),
    "No hay datos del año anterior para comparar.",
  );
  assert.match(changeSentence(null, 10, 2024, "casos"), /Prueba otro año/);
});
test("an absolute count can be compared to zero without dividing by zero", () => {
  assert.equal(changeSentence(2, 0, 2024, "casos"), "2 más que en 2023.");
  assert.equal(
    changeSentence(0, 0, 2024, "casos"),
    "La misma cifra que en 2023.",
  );
});
test("result labels use singular for one recorded case", () => {
  assert.equal(
    resultLabel({ result_label: "homicidios registrados" }, 1),
    "homicidio registrado",
  );
  assert.equal(
    resultLabel({ result_label: "homicidios registrados" }, 26),
    "homicidios registrados",
  );
});
test("region and topic search ignore accents and capitalization", () => {
  assert.equal(normalizeSearch("ÁNCASH"), "ancash");
  assert.equal(normalizeSearch("Extorsión"), "extorsion");
});
