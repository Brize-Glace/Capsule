"use client";

import Link from "next/link";
import { useApp } from "@/components/app/app-context";
import { budgetSummary, goalSentence } from "@/lib/budget";
import { money } from "@/lib/format";

/** Monthly leftover and savings goal, on the overview. */
export function MoneySummary() {
  const { data } = useApp();
  const budget = data.budget;
  const { totalIncome, totalExpenses, deductSavings, monthlyCapacity, savingsAfterYear } = budgetSummary(data);
  const goalPct = Math.min(100, (budget.savings / Math.max(1, budget.goal)) * 100);

  return (
    <section className="overview-money" aria-label="Budget">
      <div>
        <h2>{deductSavings ? "Reste à vivre ce mois-ci" : "Reste avant épargne ce mois-ci"}</h2>
        <strong className={`figure-l ${monthlyCapacity < 0 ? "negative" : ""}`}>{money(monthlyCapacity)}</strong>
        <p>
          {money(totalIncome)} de revenus − {money(totalExpenses)} de dépenses
          {deductSavings && ` − ${money(budget.monthlyTransfer)} d’épargne`}
        </p>
      </div>
      <div>
        <h2>{budget.goalLabel || "Objectif d’épargne"}</h2>
        <strong className="figure-l">
          {money(budget.savings)}
          <small> sur {money(budget.goal)}</small>
        </strong>
        <div
          className="goal-track"
          role="progressbar"
          aria-label="Progression vers l’objectif"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(goalPct)}
        >
          <span style={{ width: `${goalPct}%` }} />
        </div>
        <p>
          {goalSentence(budget)} {money(savingsAfterYear)} dans 12 mois.
        </p>
      </div>
      <Link className="link-button" href="/budget">
        Ouvrir le budget
      </Link>
    </section>
  );
}
