import type { Indicator } from "./types";

export const topicName = (indicator: Indicator) =>
  indicator.display_name || indicator.name;
export function number(value: number) {
  return new Intl.NumberFormat("es-PE", { maximumFractionDigits: 2 }).format(
    value,
  );
}
export function changeSentence(
  value: number | null,
  previous: number | null,
  year: number,
  unit: string,
): string {
  if (value === null)
    return "Prueba otro año o tema para encontrar datos disponibles.";
  if (previous === null) return "No hay datos del año anterior para comparar.";
  const difference = Math.round((value - previous) * 100) / 100;
  if (difference === 0) return `La misma cifra que en ${year - 1}.`;
  const quantity = number(Math.abs(difference));
  const direction = difference > 0 ? "más" : "menos";
  const points =
    Math.abs(difference) === 1 ? "punto porcentual" : "puntos porcentuales";
  return unit === "%"
    ? `${quantity} ${points} ${direction} que en ${year - 1}.`
    : `${quantity} ${direction} que en ${year - 1}.`;
}
export function resultLabel(indicator: Indicator, value: number): string {
  const label = indicator.result_label || "valor publicado";
  if (value !== 1) return label;
  return label
    .replace("homicidios registrados", "homicidio registrado")
    .replace("feminicidios registrados", "feminicidio registrado")
    .replace("denuncias registradas", "denuncia registrada")
    .replace("casos reportados", "caso reportado");
}
export function normalizeSearch(text: string) {
  return text
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("es");
}
