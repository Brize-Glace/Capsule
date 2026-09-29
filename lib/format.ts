import { format, isSameMonth, isValid, parseISO, startOfDay } from "date-fns";
import { fr } from "date-fns/locale";

/** Today at midnight, local time. */
export const today = () => startOfDay(new Date());

/** Date → "yyyy-MM-dd", the format of every date stored by the app. */
export const iso = (date: Date) => format(date, "yyyy-MM-dd");

/** Like `iso`, but "" for a missing or invalid date (value of an `<input type="date">`). */
export const safeIso = (date: Date | null) => (date && isValid(date) ? iso(date) : "");

export const formatFr = (date: Date, pattern: string) => format(date, pattern, { locale: fr });

/** Formats a stored "yyyy-MM-dd" date in French. */
export const dayFmt = (date: string, pattern = "d MMM yyyy") => formatFr(parseISO(date), pattern);

export const capitalize = (text: string) => text.charAt(0).toUpperCase() + text.slice(1);

const moneyFormat = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 0,
});
const moneyShortFormat = new Intl.NumberFormat("fr-FR", {
  style: "currency",
  currency: "EUR",
  notation: "compact",
  maximumFractionDigits: 1,
});

export const money = (value: number) => moneyFormat.format(value);
export const moneyShort = (value: number) => moneyShortFormat.format(value);

/** Number of days without useless decimals: 6 → "6", 2.5 → "2,5", 2.08 → "2,08". */
export const fmtDays = (days: number) =>
  days.toFixed(2).replace(/\.?0+$/, "").replace(".", ",");

/** "Du samedi 17 au dimanche 18 octobre" — the year only appears when it is not the current one. */
export function rangeLabel(start: string, end: string) {
  const from = parseISO(start);
  const to = parseISO(end);
  const year = to.getFullYear() !== today().getFullYear() ? " yyyy" : "";

  if (start === end) return capitalize(formatFr(from, `EEEE d MMMM${year}`));

  let fromPattern = "EEEE d MMMM";
  if (isSameMonth(from, to)) fromPattern = "EEEE d";
  else if (from.getFullYear() !== to.getFullYear()) fromPattern = "EEEE d MMMM yyyy";

  return `Du ${formatFr(from, fromPattern)} au ${formatFr(to, `EEEE d MMMM${year}`)}`;
}
