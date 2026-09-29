import type { AppState } from "./types";

export const JOB_COLORS = ["#F7C948", "#FF7D66", "#69D2C7", "#90A8FF", "#D398FF"];

/** Demo data shown until the user saves their own. */
export const initialState: AppState = {
  jobs: [
    {
      id: "job-weekend",
      name: "CDI week-end",
      company: "Emploi actuel",
      type: "partial",
      startDate: "2024-09-07",
      countMode: "forfait",
      accrual: 2.5,
      balanceN: 8.5,
      balanceN1: 12,
      color: "#F7C948",
      salary: 860,
      workDays: [6, 0],
      partialRule: "week",
      weekendCost: 6,
      dayCost: 1,
    },
    {
      id: "job-alt",
      name: "Alternance",
      company: "Nouvel employeur",
      type: "totalTime",
      startDate: "2026-10-05",
      countMode: "ouvres",
      accrual: 2.08,
      balanceN: 0,
      balanceN1: 0,
      color: "#69D2C7",
      salary: 1280,
    },
  ],
  leaves: [
    { id: "leave-1", jobId: "job-weekend", start: "2026-10-17", end: "2026-10-18", days: 6, label: "Week-end à Lyon", status: "valide" },
    { id: "leave-2", jobId: "job-alt", start: "2026-12-28", end: "2026-12-31", days: 4, label: "Fin d’année", status: "planifie" },
  ],
  budget: {
    currentAccount: 1240,
    savings: 6840,
    monthlyExpenses: 1160,
    expenses: [
      { id: "expense-rent", name: "Loyer", amount: 650 },
      { id: "expense-food", name: "Courses", amount: 260 },
      { id: "expense-transport", name: "Transport", amount: 110 },
      { id: "expense-subs", name: "Abonnements", amount: 140 },
    ],
    monthlyTransfer: 620,
    goal: 10000,
    goalLabel: "Matelas de sécurité",
  },
};

/** Upgrades data saved by an older version of the app. */
export function normalizeState(saved: AppState): AppState {
  // Older saves only had a single `monthlyExpenses` total.
  const expenses = saved.budget.expenses ?? [
    { id: "expense-migrated", name: "Dépenses existantes", amount: saved.budget.monthlyExpenses || 0 },
  ];
  return { ...saved, budget: { ...saved.budget, expenses } };
}
