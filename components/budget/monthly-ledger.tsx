"use client";

import { ShieldAlert } from "lucide-react";
import { useApp } from "@/components/app/app-context";
import { JobTag } from "@/components/shared/job-tag";
import { MoneyInput } from "@/components/shared/money-input";
import { BUDGET_COLORS, type BudgetSummary, type UpdateBudget } from "@/lib/budget";
import { dayFmt, iso, money, today } from "@/lib/format";
import { cn } from "@/lib/utils";
import { ExpensesEditor } from "./expenses-editor";

type MonthlyLedgerProps = {
  summary: BudgetSummary;
  updateBudget: UpdateBudget;
};

// The monthly budget is laid out as the calculation it is: each term carries its own inputs, the result closes the sum.
export function MonthlyLedger({ summary, updateBudget }: MonthlyLedgerProps) {
  const { data } = useApp();
  const budget = data.budget;
  const { totalIncome, totalExpenses, deductSavings, monthlyCapacity } = summary;
  const resultLabel = deductSavings ? "Reste à vivre" : "Reste avant épargne";

  return (
    <section className="sheet ledger" aria-labelledby="month-title">
      <h2 id="month-title" className="sheet-title">
        Chaque mois
      </h2>

      <LedgerTerm title="Revenus nets" amount={totalIncome}>
        <IncomeEditor jobsIncome={summary.jobsIncome} updateBudget={updateBudget} />
      </LedgerTerm>

      <LedgerTerm op="−" title="Dépenses" amount={totalExpenses}>
        <ExpensesEditor />
      </LedgerTerm>

      <LedgerTerm
        op={deductSavings ? "−" : ""}
        title="Épargne"
        amount={budget.monthlyTransfer}
        className={deductSavings ? "" : "set-aside"}
      >
        <MoneyInput
          label="Virement mensuel vers l’épargne"
          value={budget.monthlyTransfer}
          onChange={(v) => updateBudget("monthlyTransfer", v)}
          help="Le montant que vous transférez chaque mois du compte courant vers l’épargne."
        />
        <label className="switch-row">
          <input
            type="checkbox"
            checked={deductSavings}
            onChange={(e) => updateBudget("deductSavings", e.target.checked)}
          />
          <span className="switch" aria-hidden="true" />
          Déduire du reste à vivre
        </label>
      </LedgerTerm>

      <LedgerTerm
        op="="
        title={resultLabel}
        amount={monthlyCapacity}
        className={cn("result", monthlyCapacity < 0 && "negative")}
      >
        <p className="hint">
          {deductSavings
            ? "Ce qui reste pour les loisirs, les imprévus et les courses en plus."
            : "Ce que vous pourriez épargner au maximum chaque mois."}
        </p>
        <FlowBar summary={summary} resultLabel={resultLabel} />
        {monthlyCapacity < 0 && (
          <p className="alert">
            <ShieldAlert aria-hidden="true" />
            Vos sorties dépassent vos revenus de {money(-monthlyCapacity)} par mois.
          </p>
        )}
      </LedgerTerm>
    </section>
  );
}

type LedgerTermProps = {
  /** Operator shown in the margin: "−", "=" or nothing. */
  op?: string;
  title: string;
  amount: number;
  className?: string;
  children: React.ReactNode;
};

function LedgerTerm({ op, title, amount, className, children }: LedgerTermProps) {
  return (
    <div className={cn("ledger-term", className)}>
      <div className="term-head">
        <span className="op" aria-hidden="true">
          {op}
        </span>
        <h3>{title}</h3>
        <strong>{money(amount)}</strong>
      </div>
      <div className="term-body">{children}</div>
    </div>
  );
}

/** Income comes either from the jobs' salaries or from a manual amount. */
function IncomeEditor({ jobsIncome, updateBudget }: { jobsIncome: number; updateBudget: UpdateBudget }) {
  const { data, setData } = useApp();
  const budget = data.budget;
  const todayIso = iso(today());
  const manual = budget.incomeMode === "manual";

  const switchToManual = () =>
    setData((d) => ({
      ...d,
      budget: { ...d.budget, incomeMode: "manual", manualIncome: d.budget.manualIncome ?? jobsIncome },
    }));

  const setSalary = (jobId: string, salary: number) =>
    setData((d) => ({ ...d, jobs: d.jobs.map((job) => (job.id === jobId ? { ...job, salary } : job)) }));

  return (
    <>
      <div className="segmented" role="radiogroup" aria-label="Source des revenus">
        <button role="radio" aria-checked={!manual} onClick={() => updateBudget("incomeMode", "jobs")}>
          Depuis mes emplois
        </button>
        <button role="radio" aria-checked={manual} onClick={switchToManual}>
          Montant manuel
        </button>
      </div>

      {manual ? (
        <>
          <MoneyInput
            label="Revenu net mensuel total"
            value={budget.manualIncome ?? 0}
            onChange={(v) => updateBudget("manualIncome", v)}
            help="Tout ce qui arrive sur votre compte chaque mois : salaires, aides, pensions…"
          />
          <p className="hint">
            Vos fiches emploi déclarent {money(jobsIncome)} par mois.{" "}
            <button className="link-button" onClick={() => updateBudget("manualIncome", jobsIncome)}>
              Reprendre ce montant
            </button>
          </p>
        </>
      ) : (
        <>
          <ul className="rows">
            {data.jobs.map((job) => (
              <li key={job.id} className="row income-row">
                <span>
                  <JobTag job={job} />
                  <small>
                    {job.startDate > todayIso ? `Compté à partir de ${dayFmt(job.startDate, "MMMM yyyy")}` : job.company}
                  </small>
                </span>
                <span className="money-field compact">
                  <input
                    aria-label={`Salaire net ${job.name}`}
                    type="number"
                    min="0"
                    value={job.salary}
                    onChange={(e) => setSalary(job.id, Number(e.target.value))}
                  />
                  <b>€</b>
                </span>
              </li>
            ))}
          </ul>
          <p className="hint">Modifier un salaire ici met aussi à jour la fiche emploi.</p>
        </>
      )}
    </>
  );
}

/** Stacked bar splitting the income into expenses, savings and what is left. */
function FlowBar({ summary, resultLabel }: { summary: BudgetSummary; resultLabel: string }) {
  const { data } = useApp();
  const { totalIncome, totalExpenses, deductSavings, monthlyCapacity } = summary;

  const segments = [
    { label: "Dépenses", value: totalExpenses, color: BUDGET_COLORS.expenses },
    ...(deductSavings ? [{ label: "Épargne", value: data.budget.monthlyTransfer, color: BUDGET_COLORS.savings }] : []),
    { label: resultLabel, value: Math.max(0, monthlyCapacity), color: BUDGET_COLORS.account },
  ].filter((s) => s.value > 0);

  const scale = Math.max(1, totalIncome, segments.reduce((sum, s) => sum + s.value, 0));
  const percent = (value: number) => (totalIncome > 0 ? `${Math.round((value / totalIncome) * 100)} %` : "—");

  return (
    <>
      <div className="flow-bar" role="img" aria-label={segments.map((s) => `${s.label} ${money(s.value)}`).join(", ")}>
        {segments.map((s) => (
          <span
            key={s.label}
            style={{ width: `${(s.value / scale) * 100}%`, background: s.color }}
            title={`${s.label} · ${money(s.value)}`}
          />
        ))}
      </div>
      <ul className="legend">
        {segments.map((s) => (
          <li key={s.label}>
            <i style={{ background: s.color }} />
            {s.label}
            <b>{percent(s.value)}</b>
          </li>
        ))}
      </ul>
    </>
  );
}
