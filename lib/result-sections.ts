import { PROFILES, calculateNameNumber } from "@/lib/numerology";
import { isPlanId, type PlanId } from "@/lib/plans";
import type { PdfSection } from "@/lib/pdf-generator";

/**
 * Собирает разделы разбора для PDF в письме, PDF по кнопке и открытого
 * результата на /success — чтобы все три источника совпадали.
 *
 * Число имени и его профиль берутся из lib/numerology.ts, то есть из того же
 * расчёта, который показывает бесплатная страница результата.
 */

export type NameInput = {
  name: string;
};

/**
 * Базовый тариф открывает полное описание числа; полный и премиум добавляют
 * денежный код, отношения и прогноз. Это соответствует LOCKED_TITLES.
 */
function sectionCountForPlan(plan: PlanId): number {
  return plan === "basic" ? 2 : 5;
}

export function generateResultSections(
  input: NameInput,
  plan: string | null | undefined
): PdfSection[] {
  const result = calculateNameNumber(input.name);
  if (!result) return [];

  const resolvedPlan: PlanId = isPlanId(plan) ? plan : "full";
  const profile = PROFILES[result.number];

  const letters = result.letters
    .map((item) => `${item.letter}=${item.value}`)
    .join(" + ");

  const all: PdfSection[] = [
    {
      title: `Ваше число имени — ${result.number}. ${profile.energy}`,
      content: `${letters} = ${result.sum}, и в свёрнутом виде это ${result.number}.\n\n${profile.free}`,
    },
    {
      title: "Полное описание числа",
      content: profile.full,
    },
    {
      title: "Денежный код имени",
      content: profile.money,
    },
    {
      title: "Отношения и совместимость",
      content: profile.relationships,
    },
    {
      title: "Прогноз на 2026 год",
      content: profile.forecast,
    },
  ];

  return all.slice(0, sectionCountForPlan(resolvedPlan));
}

/** Читает имя из metadata ЮKassa — там всё приходит строками. */
export function inputFromMetadata(
  metadata: Record<string, string>
): NameInput | null {
  const name = metadata.name;
  if (!name || !calculateNameNumber(name)) return null;
  return { name };
}

/** Строка под заголовком отчёта: имя, по которому считали. */
export function buildSubtitle(input: NameInput): string {
  return input.name;
}
