"use client";

import { useState } from "react";
import { useApp } from "@/components/app/app-context";
import { MoneyInput } from "@/components/shared/money-input";
import { BUDGET_COLORS, budgetProjection, goalSentence, type BudgetSummary, type UpdateBudget } from "@/lib/budget";
import { formatFr, money } from "@/lib/format";
import { ProjectionChart } from "./projection-chart";
import { ProjectionTable } from "./projection-table";

type OutlookSectionProps = { summary: BudgetSummary; updateBudget: UpdateBudget };

/** "Dans 12 mois": current account, savings and goal, then the projection as a chart or a table. */
export function OutlookSection({ summary, updateBudget }: OutlookSectionProps) {
  const { data } = useApp();
  const [mode, setMode] = useState<"chart" | "table">("chart");
  const budget = data.budget;
  const rows = budgetProjection(data, summary.totalExpenses);
  const last = rows[rows.length - 1];
  const lastMonth = formatFr(last.month, "MMMM yyyy");
  const netFlow = summary.totalIncome - summary.totalExpenses - budget.monthlyTransfer;
  const goal = Math.max(1, budget.goal);
  const progress = (savings: number) => Math.min(100, (savings / goal) * 100);

  return (
    <section className="sheet outlook" aria-labelledby="outlook-title">
      <div className="block-head">
        <h2 id="outlook-title" className="sheet-title">
          Dans 12 mois
        </h2>
        <div className="segmented small" role="radiogroup" aria-label="Affichage de la projection">
          <button role="radio" aria-checked={mode === "chart"} onClick={() => setMode("chart")}>
            Graphique
          </button>
          <button role="radio" aria-checked={mode === "table"} onClick={() => setMode("table")}>
            Tableau
          </button>
        </div>
      </div>

      <div className="outlook-figures">
        <div className="outlook-figure">
          <h3>
            <i style={{ background: BUDGET_COLORS.account }} />
            Compte courant
          </h3>
          <strong className={`figure-l ${last.account < 0 ? "negative" : ""}`}>{money(last.account)}</strong>
          <p>
            fin {lastMonth} · {netFlow >= 0 ? "+" : "−"} {money(Math.abs(netFlow))} par mois
          </p>
          <MoneyInput
            label="Solde aujourd’hui"
            value={budget.currentAccount}
            onChange={(v) => updateBudget("currentAccount", v)}
          />
        </div>

        <div className="outlook-figure">
          <h3>
            <i style={{ background: BUDGET_COLORS.savings }} />
            Épargne
          </h3>
          <strong className="figure-l">{money(last.savings)}</strong>
          <p>
            fin {lastMonth} · + {money(budget.monthlyTransfer)} par mois
          </p>
          <MoneyInput label="Épargne aujourd’hui" value={budget.savings} onChange={(v) => updateBudget("savings", v)} />
        </div>

        <div className="outlook-figure goal">
          <h3>
            <i className="goal-swatch" />
            Objectif
          </h3>
          <div className="goal-fields">
            <label className="field">
              <span>Nom</span>
              <input
                className="form-input"
                value={budget.goalLabel}
                onChange={(e) => updateBudget("goalLabel", e.target.value)}
              />
            </label>
            <MoneyInput label="Montant visé" value={budget.goal} onChange={(v) => updateBudget("goal", v)} />
          </div>
          <div
            className="goal-track"
            role="progressbar"
            aria-label="Épargne actuelle par rapport à l’objectif"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(progress(budget.savings))}
          >
            <span className="later" style={{ width: `${progress(last.savings)}%` }} />
            <span style={{ width: `${progress(budget.savings)}%` }} />
          </div>
          <p>{goalSentence(budget)}</p>
        </div>
      </div>

      {mode === "table" ? (
        <ProjectionTable rows={rows} startAccount={budget.currentAccount} startSavings={budget.savings} />
      ) : (
        <ProjectionChart
          rows={rows}
          startAccount={budget.currentAccount}
          startSavings={budget.savings}
          goal={budget.goal}
          goalLabel={budget.goalLabel}
        />
      )}

      <p className="footnote">
        Soldes estimés en fin de mois, après dépenses et virement d’épargne, en supposant que rien d’autre que les
        postes listés n’est dépensé.
      </p>
    </section>
  );
}
