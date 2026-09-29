import { addDays } from "date-fns";
import { iso } from "./format";

/** Easter Sunday of a year (Gregorian computus). */
function easterDate(year: number) {
  const f = Math.floor;
  const G = year % 19;
  const C = f(year / 100);
  const H = (C - f(C / 4) - f((8 * C + 13) / 25) + 19 * G + 15) % 30;
  const I = H - f(H / 28) * (1 - f(H / 28) * f(29 / (H + 1)) * f((21 - G) / 11));
  const J = (year + f(year / 4) + I + 2 - C + f(C / 4)) % 7;
  const L = I - J;
  const month = 3 + f((L + 40) / 44);
  const day = L + 28 - 31 * f(month / 4);
  return new Date(year, month - 1, day);
}

const cache = new Map<number, Set<string>>();

/** French public holidays of a year, as "yyyy-MM-dd" strings. */
function holidays(year: number): Set<string> {
  const cached = cache.get(year);
  if (cached) return cached;

  const easter = easterDate(year);
  const set = new Set([
    `${year}-01-01`, // Jour de l’an
    `${year}-05-01`, // Fête du travail
    `${year}-05-08`, // Victoire 1945
    `${year}-07-14`, // Fête nationale
    `${year}-08-15`, // Assomption
    `${year}-11-01`, // Toussaint
    `${year}-11-11`, // Armistice
    `${year}-12-25`, // Noël
    iso(addDays(easter, 1)), // Lundi de Pâques
    iso(addDays(easter, 39)), // Ascension
    iso(addDays(easter, 50)), // Lundi de Pentecôte
  ]);
  cache.set(year, set);
  return set;
}

export const isHoliday = (date: Date) => holidays(date.getFullYear()).has(iso(date));
