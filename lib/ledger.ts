import { addMonths, endOfMonth, getDaysInMonth, isBefore, isSameMonth, parseISO } from "date-fns";
import { iso, today } from "./format";
import type { Job, Leave } from "./types";
import { sumBy } from "./utils";

// The reference period for paid leave runs 1 June → 31 May; it is identified by the year it starts.
export const periodOf = (date: Date) => (date.getMonth() >= 5 ? date.getFullYear() : date.getFullYear() - 1);

/** 2026 → "2026-27" */
export const periodLabel = (year: number) => `${year}-${String(year + 1).slice(-2)}`;

/** Last day to take the current N−1 balance. */
export const n1Deadline = () => `31 mai ${periodOf(today()) + 1}`;

/** Days acquired on a job during a month. The hiring month is prorated on the calendar days left, start date included. */
export function accrualForMonth(job: Job, month: Date) {
  const hired = parseISO(job.startDate);
  const daysInMonth = getDaysInMonth(month);
  const remaining = daysInMonth - hired.getDate() + 1;
  const prorated = isSameMonth(month, hired) && hired.getDate() > 1;
  return {
    amount: prorated ? (job.accrual * remaining) / daysInMonth : job.accrual,
    prorated,
    remaining,
    daysInMonth,
  };
}

export type Buckets = { n1: number; n: number };

export type LedgerStep = {
  kind: "start" | "accrual" | "rollover" | "leave";
  date: string;
  /** Accrual steps: consecutive months are merged, this is the last one. */
  toDate?: string;
  months?: number;
  delta: number;
  /** Rollover steps: N−1 days lost on 31 May. */
  expired?: number;
  leave?: Leave;
  fromN1?: number;
  fromN?: number;
  period: number;
  after: Buckets;
};

/** How a leave was taken out of the balances. */
export type LeaveAlloc = {
  leave: Leave;
  /** Past leaves are assumed to be already deducted from the entered balances. */
  past: boolean;
  before: Buckets;
  after: Buckets;
  fromN1: number;
  fromN: number;
  period: number;
  /** Days missing when the leave starts (taken in advance). */
  shortfall: number;
  /** Index of the leave step in `Ledger.steps`, -1 for past leaves. */
  stepIndex: number;
};

export type Ledger = {
  job: Job;
  steps: LedgerStep[];
  allocs: Map<string, LeaveAlloc>;
  startPeriod: number;
};

/**
 * Replays a job's counters chronologically from today. The entered balances are the starting point
 * (past leaves are assumed to be already deducted there), accrual is credited at each month end
 * (prorated on the hiring month), a leave consumes N−1 first then N, and on 31 May the remaining
 * N−1 expires while N becomes the new N−1.
 */
export function buildLedger(job: Job, leaves: Leave[]): Ledger {
  const start = today();
  const startIso = iso(start);
  const hired = parseISO(job.startDate);
  const own = leaves.filter((l) => l.jobId === job.id).sort((a, b) => a.start.localeCompare(b.start));
  const future = own.filter((l) => l.start >= startIso);

  let n1 = job.balanceN1;
  let n = job.balanceN;
  let period = periodOf(start);
  const startPeriod = period;
  const steps: LedgerStep[] = [{ kind: "start", date: startIso, delta: 0, period, after: { n1, n } }];
  const allocs = new Map<string, LeaveAlloc>();

  for (const leave of own.filter((l) => l.start < startIso)) {
    allocs.set(leave.id, {
      leave,
      past: true,
      before: { n1, n },
      after: { n1, n },
      fromN1: 0,
      fromN: 0,
      period: periodOf(parseISO(leave.start)),
      shortfall: 0,
      stepIndex: -1,
    });
  }

  const credit = (date: string, amount: number) => {
    n += amount;
    const previous = steps.at(-1)!;
    if (previous.kind === "accrual") {
      previous.delta += amount;
      previous.toDate = date;
      previous.months = (previous.months || 1) + 1;
      previous.after = { n1, n };
    } else {
      steps.push({ kind: "accrual", date, toDate: date, months: 1, delta: amount, period, after: { n1, n } });
    }
  };

  const rollover = (date: string) => {
    const expired = Math.max(0, n1);
    n1 = n;
    n = 0;
    period += 1;
    steps.push({ kind: "rollover", date, delta: 0, expired, period, after: { n1, n } });
  };

  const take = (leave: Leave) => {
    const before = { n1, n };
    const fromN1 = Math.min(Math.max(0, n1), leave.days);
    const fromN = leave.days - fromN1;
    n1 -= fromN1;
    n -= fromN;
    steps.push({ kind: "leave", date: leave.start, delta: -leave.days, leave, fromN1, fromN, period, after: { n1, n } });
    allocs.set(leave.id, {
      leave,
      past: false,
      before,
      after: { n1, n },
      fromN1,
      fromN,
      period,
      shortfall: Math.max(0, leave.days - Math.max(0, before.n1) - Math.max(0, before.n)),
      stepIndex: steps.length - 1,
    });
  };

  // On the same date, a leave is taken before the month's accrual, and the accrual before the rollover.
  const events: { date: string; rank: number; apply: () => void }[] = [];

  const lastLeaveStart = future.at(-1)?.start;
  if (lastLeaveStart) {
    for (let monthEnd = endOfMonth(start); iso(monthEnd) < lastLeaveStart; monthEnd = endOfMonth(addMonths(monthEnd, 1))) {
      if (isBefore(monthEnd, hired)) continue;
      const date = iso(monthEnd);
      const { amount } = accrualForMonth(job, monthEnd);
      events.push({ date, rank: 1, apply: () => credit(date, amount) });
      if (monthEnd.getMonth() === 4) events.push({ date, rank: 2, apply: () => rollover(date) });
    }
  }
  for (const leave of future) events.push({ date: leave.start, rank: 0, apply: () => take(leave) });

  events.sort((a, b) => a.date.localeCompare(b.date) || a.rank - b.rank).forEach((event) => event.apply());

  return { job, steps, allocs, startPeriod };
}

export const groupKey = (leave: Leave) => leave.groupId || leave.id;

/** A leave period as the user sees it, possibly spread over several jobs. */
export type LeaveGroup = {
  key: string;
  label: string;
  start: string;
  end: string;
  status: Leave["status"];
  items: Leave[];
};

export function leaveGroups(leaves: Leave[]): LeaveGroup[] {
  const map = new Map<string, LeaveGroup>();
  for (const leave of leaves) {
    const key = groupKey(leave);
    const group = map.get(key);
    if (group) group.items.push(leave);
    else map.set(key, { key, label: leave.label, start: leave.start, end: leave.end, status: leave.status, items: [leave] });
  }
  return [...map.values()].sort((a, b) => a.start.localeCompare(b.start) || a.end.localeCompare(b.end));
}

/** Where a job stands today: N−1 not yet covered by a planned leave before the period ends, and leave still to come. */
export function jobOutlook(ledger: Ledger, leaves: Leave[]) {
  const todayIso = iso(today());
  const upcoming = leaves.filter((l) => l.jobId === ledger.job.id && l.end >= todayIso);
  const futureAllocs = [...ledger.allocs.values()].filter((a) => !a.past);
  const n1Planned = sumBy(
    futureAllocs.filter((a) => a.period === ledger.startPeriod),
    (a) => a.fromN1,
  );

  return {
    n1Left: Math.max(0, ledger.job.balanceN1 - n1Planned),
    upcomingDays: sumBy(upcoming, (l) => l.days),
    upcomingCount: upcoming.length,
    shortCount: futureAllocs.filter((a) => a.shortfall > 0).length,
  };
}
