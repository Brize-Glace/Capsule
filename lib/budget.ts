import { addMonths, endOfMonth, startOfMonth } from "date-fns";
import { formatFr, iso, money, today } from "./format";
import type { AppState, Budget } from "./types";
import { sumBy } from "./utils";

export const BUDGET_COLORS = {
  account: "#3d5a99",
  savings: "#1f9e8f",
  expenses: "#aab4c1",
};

/** Monthly totals shown on the overview and the budget page. */
export function budgetSummary(data: AppState) {
  const { budget } = data;
  const jobsIncome = sumBy(data.jobs, (job) => job.salary);
  const totalIncome = budget.incomeMode === "manual" ? (budget.manualIncome ?? jobsIncome) : jobsIncome;
  const totalExpenses = budget.expenses ? sumBy(budget.expenses, (e) => e.amount) : budget.monthlyExpenses;
  const deductSavings = budget.deductSavings ?? true;

  return {
    jobsIncome,
    totalIncome,
    totalExpenses,
    deductSavings,
    /** What is left each month, after the savings transfer when `deductSavings` is on. */
    monthlyCapacity: totalIncome - totalExpenses - (deductSavings ? budget.monthlyTransfer : 0),
    savingsAfterYear: budget.savings + budget.monthlyTransfer * 12,
  };
}

export type BudgetSummary = ReturnType<typeof budgetSummary>;

/** Setter for one budget field. */
export type UpdateBudget = <K extends keyof Budget>(key: K, value: Budget[K]) => void;

/** Months needed to reach the savings goal with the current monthly transfer, counted from next month. */
function goalEta(budget: Budget) {
  const toGoal = Math.max(0, budget.goal - budget.savings);
  if (toGoal === 0) return { months: 0, date: null };
  if (budget.monthlyTransfer <= 0) return { months: null, date: null };

  const months = Math.ceil(toGoal / budget.monthlyTransfer);
  const nextMonth = startOfMonth(addMonths(today(), 1));
  return { months, date: endOfMonth(addMonths(nextMonth, months - 1)) };
}

export function goalSentence(budget: Budget) {
  const { months, date } = goalEta(budget);
  if (months === 0) return "Objectif atteint.";
  if (months === null || !date) return "Aucun virement prévu : objectif hors d’atteinte à ce rythme.";
  return `Atteint en ${formatFr(date, "MMMM yyyy")}, dans ${months} mois, à ${money(budget.monthlyTransfer)} par mois.`;
}

export type ProjectionRow = {
  month: Date;
  income: number;
  expenses: number;
  transfer: number;
  /** Balances at the end of the month. */
  account: number;
  savings: number;
};

/** Next 12 calendar months. In "jobs" mode a job's salary only counts from the month it starts. */
export function budgetProjection(data: AppState, expenses: number): ProjectionRow[] {
  const { budget } = data;
  const first = startOfMonth(addMonths(today(), 1));
  let account = budget.currentAccount;
  let savings = budget.savings;

  return Array.from({ length: 12 }, (_, i) => {
    const month = addMonths(first, i);
    const monthEnd = iso(endOfMonth(month));
    const income =
      budget.incomeMode === "manual"
        ? (budget.manualIncome ?? 0)
        : sumBy(
            data.jobs.filter((job) => job.startDate <= monthEnd),
            (job) => job.salary,
          );
    account += income - expenses - budget.monthlyTransfer;
    savings += budget.monthlyTransfer;
    return { month, income, expenses, transfer: budget.monthlyTransfer, account, savings };
  });
}

/** Round axis values (1, 2, 2.5, 5 × 10ⁿ) covering [min, max] in about `count` steps. */
export function niceTicks(min: number, max: number, count: number) {
  const raw = (max - min) / count;
  const power = 10 ** Math.floor(Math.log10(raw || 1));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * power).find((s) => s >= raw) || power * 10;
  const ticks: number[] = [];
  for (let value = Math.ceil(min / step) * step; value <= max; value += step) ticks.push(value);
  return ticks;
}
