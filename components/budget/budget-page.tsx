"use client";

import { useApp } from "@/components/app/app-context";
import { PageHead } from "@/components/shared/page-head";
import { budgetSummary, type UpdateBudget } from "@/lib/budget";
import { MonthlyLedger } from "./monthly-ledger";
import { OutlookSection } from "./outlook-section";

export function BudgetPage() {
  const { data, setData } = useApp();
  const summary = budgetSummary(data);

  const updateBudget: UpdateBudget = (key, value) =>
    setData((d) => ({ ...d, budget: { ...d.budget, [key]: value } }));

  return (
    <div className="page">
      <PageHead title="Mon budget" />
      <MonthlyLedger summary={summary} updateBudget={updateBudget} />
      <OutlookSection summary={summary} updateBudget={updateBudget} />
    </div>
  );
}
