export type WorkType = "partial" | "totalTime";
export type CountMode = "ouvres" | "ouvrables" | "forfait";
export type PartialRule = "week" | "day";
export type LeaveStatus = "planifie" | "valide";

export type Job = {
  id: string;
  name: string;
  company: string;
  type: WorkType;
  /** "yyyy-MM-dd" */
  startDate: string;
  countMode: CountMode;
  /** Days acquired per month. */
  accrual: number;
  balanceN: number;
  balanceN1: number;
  color: string;
  salary: number;
  // Partial-time settings (see `partialConfig` for their defaults)
  workDays?: number[];
  partialRule?: PartialRule;
  /** Days removed per worked week touched by a leave (field name kept for saved data). */
  weekendCost?: number;
  /** Days removed per worked day taken. */
  dayCost?: number;
};

export type PartialFields = Pick<Job, "workDays" | "partialRule" | "weekendCost" | "dayCost">;

/** One leave on one job. A leave spanning several jobs is a group of leaves sharing a `groupId`. */
export type Leave = {
  id: string;
  groupId?: string;
  jobId: string;
  start: string;
  end: string;
  days: number;
  label: string;
  status: LeaveStatus;
  /** The number of days was set by hand instead of computed. */
  adjusted?: boolean;
};

export type Expense = { id: string; name: string; amount: number };

export type Budget = {
  currentAccount: number;
  savings: number;
  /** Legacy single total, replaced by `expenses`. */
  monthlyExpenses: number;
  expenses: Expense[];
  monthlyTransfer: number;
  goal: number;
  goalLabel: string;
  incomeMode?: "jobs" | "manual";
  manualIncome?: number;
  deductSavings?: boolean;
};

export type AppState = { jobs: Job[]; leaves: Leave[]; budget: Budget };
