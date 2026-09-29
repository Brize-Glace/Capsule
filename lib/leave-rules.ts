import { differenceInCalendarDays, eachDayOfInterval, getDay, isAfter, isValid, startOfWeek } from "date-fns";
import { fmtDays, iso } from "./format";
import { isHoliday } from "./holidays";
import type { Job, PartialFields } from "./types";

export const MAX_LEAVE_SPAN = 366;

// Monday-first display order; `value` is the date-fns getDay() index (0 = Sunday).
export const WEEK_DAYS = [
  { value: 1, short: "L", label: "Lundi" },
  { value: 2, short: "M", label: "Mardi" },
  { value: 3, short: "M", label: "Mercredi" },
  { value: 4, short: "J", label: "Jeudi" },
  { value: 5, short: "V", label: "Vendredi" },
  { value: 6, short: "S", label: "Samedi" },
  { value: 0, short: "D", label: "Dimanche" },
];

/** Partial-time settings of a job, with defaults filled in. */
export function partialConfig(job: PartialFields) {
  return {
    workDays: job.workDays?.length ? job.workDays : [6, 0],
    rule: job.partialRule || "week",
    weekCost: job.weekendCost ?? 6,
    dayCost: job.dayCost ?? 1,
  };
}

/** "le week-end" or "lundi, mardi, mercredi" */
export function workDaysLabel(days: number[]) {
  if (days.length === 2 && days.includes(6) && days.includes(0)) return "le week-end";
  return WEEK_DAYS.filter((d) => days.includes(d.value))
    .map((d) => d.label.toLowerCase())
    .join(", ");
}

/** Short name of the counting rule, e.g. "Jours ouvrés" or "6 j par semaine travaillée". */
export function ruleLabel(job: Job) {
  if (job.type !== "partial") return job.countMode === "ouvrables" ? "Jours ouvrables" : "Jours ouvrés";

  const config = partialConfig(job);
  return config.rule === "week"
    ? `${fmtDays(config.weekCost)} j par semaine travaillée`
    : `${fmtDays(config.dayCost)} j par jour travaillé`;
}

/** Full sentence explaining how a leave is counted on a job. */
export function ruleSentence(job: Job) {
  if (job.type !== "partial") {
    const week = job.countMode === "ouvrables" ? "Du lundi au samedi" : "Du lundi au vendredi";
    return `${week}, hors jours fériés.`;
  }

  const config = partialConfig(job);
  const worked = workDaysLabel(config.workDays);
  if (config.rule === "week") {
    return `Travaillé ${worked} : chaque semaine touchée retire ${fmtDays(config.weekCost)} jours.`;
  }
  const plural = config.dayCost > 1 ? "s" : "";
  return `Travaillé ${worked} : chaque jour travaillé posé retire ${fmtDays(config.dayCost)} jour${plural}.`;
}

/** The two dates in chronological order. */
export function orderedRange(a: Date, b: Date): [Date, Date] {
  return isAfter(a, b) ? [b, a] : [a, b];
}

/** Both dates are valid and less than MAX_LEAVE_SPAN days apart. */
export function leaveSpanOk(start: Date | null, end: Date | null): start is Date {
  return (
    !!start &&
    !!end &&
    isValid(start) &&
    isValid(end) &&
    Math.abs(differenceInCalendarDays(end, start)) < MAX_LEAVE_SPAN
  );
}

/** Number of leave days a period costs on a job, public holidays excluded. */
export function countLeaveDays(job: Job, start: Date, end: Date) {
  if (!leaveSpanOk(start, end)) return 0;

  const [from, to] = orderedRange(start, end);
  const dates = eachDayOfInterval({ start: from, end: to }).filter((date) => !isHoliday(date));

  if (job.type === "partial") {
    const config = partialConfig(job);
    const worked = dates.filter((date) => config.workDays.includes(getDay(date)));
    if (config.rule === "day") return worked.length * config.dayCost;

    // Weekly flat rate: every week touched by the leave costs the same, whatever the number of days.
    const weeks = new Set(worked.map((date) => iso(startOfWeek(date, { weekStartsOn: 1 }))));
    return weeks.size * config.weekCost;
  }

  const countsSaturday = job.countMode === "ouvrables";
  return dates.filter((date) => {
    const day = getDay(date);
    return day !== 0 && (countsSaturday || day !== 6);
  }).length;
}
