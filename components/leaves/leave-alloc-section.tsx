import { ShieldAlert } from "lucide-react";
import { JobTag } from "@/components/shared/job-tag";
import { dayFmt, fmtDays } from "@/lib/format";
import { periodLabel, type LeaveAlloc, type Ledger, type LedgerStep } from "@/lib/ledger";
import { ruleSentence } from "@/lib/leave-rules";
import type { Job } from "@/lib/types";

type LeaveAllocSectionProps = { job: Job; ledger: Ledger; alloc: LeaveAlloc };

/** Balances before and after a leave on one job, and the steps that lead there. */
export function LeaveAllocSection({ job, ledger, alloc }: LeaveAllocSectionProps) {
  const p = alloc.period;

  return (
    <section className="alloc">
      <header>
        <h3>
          <JobTag job={job} />
        </h3>
        <b>{fmtDays(alloc.leave.days)} j</b>
        <small>{alloc.leave.adjusted ? "Nombre de jours ajusté à la main" : ruleSentence(job)}</small>
      </header>

      {alloc.past ? (
        <p className="alloc-note">
          Congé passé : il est considéré comme déjà déduit des soldes saisis (votre bulletin de paie fait foi).
        </p>
      ) : (
        <>
          <table className="alloc-table">
            <thead>
              <tr>
                <th scope="col">
                  <span className="sr-only">Compteur</span>
                </th>
                <th scope="col">Avant</th>
                <th scope="col">Pris</th>
                <th scope="col">Après</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <th scope="row">
                  N−1 · {periodLabel(p - 1)}
                  <small>à poser avant le 31 mai {p + 1}</small>
                </th>
                <td>{fmtDays(alloc.before.n1)} j</td>
                <TakenCell days={alloc.fromN1} />
                <td>{fmtDays(alloc.after.n1)} j</td>
              </tr>
              <tr>
                <th scope="row">
                  N · {periodLabel(p)}
                  <small>en cours d’acquisition</small>
                </th>
                <td>{fmtDays(alloc.before.n)} j</td>
                <TakenCell days={alloc.fromN} />
                <td className={alloc.after.n < 0 ? "negative" : ""}>{fmtDays(alloc.after.n)} j</td>
              </tr>
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Total</th>
                <td>{fmtDays(alloc.before.n1 + alloc.before.n)} j</td>
                <td className="taken">−{fmtDays(alloc.leave.days)} j</td>
                <td>{fmtDays(alloc.after.n1 + alloc.after.n)} j</td>
              </tr>
            </tfoot>
          </table>

          {alloc.shortfall > 0 && (
            <p className="alert">
              <ShieldAlert aria-hidden="true" />
              Il manque {fmtDays(alloc.shortfall)} j à cette date : ce congé serait pris par anticipation sur des jours
              pas encore acquis.
            </p>
          )}
          {alloc.after.n1 > 0 && (
            <p className="alloc-note">
              Il restera {fmtDays(alloc.after.n1)} j de N−1 ({periodLabel(p - 1)}) à poser avant le 31 mai {p + 1}.
            </p>
          )}

          <details className="ledger-trail">
            <summary>
              Comment on arrive à ce solde · {alloc.stepIndex + 1} étape{alloc.stepIndex > 0 ? "s" : ""}
            </summary>
            <ol>
              {ledger.steps.slice(0, alloc.stepIndex + 1).map((step, i) => (
                <LedgerStepRow key={i} step={step} current={step.leave?.id === alloc.leave.id} />
              ))}
            </ol>
          </details>
        </>
      )}
    </section>
  );
}

function TakenCell({ days }: { days: number }) {
  return <td className={days > 0 ? "taken" : ""}>{days > 0 ? `−${fmtDays(days)}` : "0"} j</td>;
}

/** One line of the ledger trail: starting balances, accrual, 31 May rollover or leave. */
function LedgerStepRow({ step, current }: { step: LedgerStep; current?: boolean }) {
  const p = step.period;
  const after = (
    <span className="step-after">
      N−1 {fmtDays(step.after.n1)} · N {fmtDays(step.after.n)}
    </span>
  );

  if (step.kind === "start") {
    return (
      <li className="step-start">
        <time>{dayFmt(step.date)}</time>
        <div>
          <b>Soldes saisis (point de départ)</b>
          <small>
            N−1 ({periodLabel(p - 1)}) {fmtDays(step.after.n1)} j · N ({periodLabel(p)}) {fmtDays(step.after.n)} j
          </small>
        </div>
        {after}
      </li>
    );
  }

  if (step.kind === "accrual") {
    const months =
      step.months && step.months > 1
        ? `${dayFmt(step.date, "MMM yy")} → ${dayFmt(step.toDate || step.date, "MMM yy")}`
        : dayFmt(step.date, "MMMM yyyy");
    return (
      <li className="step-accrual">
        <time>{months}</time>
        <div>
          <b>+{fmtDays(step.delta)} j acquis</b>
          <small>
            Crédités sur le N ({periodLabel(p)}) · {step.months} mois
          </small>
        </div>
        {after}
      </li>
    );
  }

  if (step.kind === "rollover") {
    const lost = step.expired
      ? `${fmtDays(step.expired)} j de N−1 (${periodLabel(p - 2)}) non posés : perdus sauf report. `
      : "Aucun N−1 perdu. ";
    return (
      <li className="step-rollover">
        <time>{dayFmt(step.date)}</time>
        <div>
          <b>Changement de période</b>
          <small>
            {lost}Le N ({periodLabel(p - 1)}) devient N−1, un nouveau N ({periodLabel(p)}) démarre à 0.
          </small>
        </div>
        {after}
      </li>
    );
  }

  const takenFrom = [
    step.fromN1 && `N−1 (${periodLabel(p - 1)}) ${fmtDays(step.fromN1)} j`,
    step.fromN && `N (${periodLabel(p)}) ${fmtDays(step.fromN)} j`,
  ]
    .filter(Boolean)
    .join(" + ");

  return (
    <li className={`step-leave ${current ? "current" : ""}`}>
      <time>{dayFmt(step.date)}</time>
      <div>
        <b>
          {current ? "Ce congé" : step.leave?.label} · −{fmtDays(-step.delta)} j
        </b>
        <small>Pris sur {takenFrom}</small>
      </div>
      {after}
    </li>
  );
}
