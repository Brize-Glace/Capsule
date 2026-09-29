"use client";

import { Fragment, useState } from "react";
import { parseISO } from "date-fns";
import { ChevronRight } from "lucide-react";
import { useApp } from "@/components/app/app-context";
import { JobTag } from "@/components/shared/job-tag";
import { dayFmt, fmtDays, iso, rangeLabel, today } from "@/lib/format";
import { buildLedger, leaveGroups, periodLabel, periodOf, type LeaveAlloc, type Ledger, type LeaveGroup } from "@/lib/ledger";
import { ruleLabel } from "@/lib/leave-rules";
import type { AppState } from "@/lib/types";

/** "Récapitulatif et calculs" tab: balances per job, then every leave in date order. */
export function LeaveRecap() {
  const { data, openLeaveDetail, openNewLeave } = useApp();
  const [showPast, setShowPast] = useState(false);
  const todayIso = iso(today());
  const ledgers = data.jobs.map((job) => buildLedger(job, data.leaves));

  const all = leaveGroups(data.leaves);
  const groups = all.filter((g) => showPast || g.end >= todayIso);
  const pastCount = all.filter((g) => g.end < todayIso).length;

  return (
    <div className="recap">
      <BalancesSheet ledgers={ledgers} />

      <section className="sheet" aria-labelledby="chrono-title">
        <div className="block-head">
          <div>
            <h2 id="chrono-title" className="sheet-title">
              Chronologie
            </h2>
            <p className="hint">
              Les congés sont rejoués dans l’ordre des dates, quel que soit l’ordre de saisie. Ouvrez une ligne pour
              voir le calcul complet.
            </p>
          </div>
          {pastCount > 0 && (
            <button className="text-button" onClick={() => setShowPast((v) => !v)}>
              {showPast ? "Masquer" : "Afficher"} les congés passés ({pastCount})
            </button>
          )}
        </div>

        {groups.length === 0 ? (
          <p className="empty">
            Aucun congé à venir.{" "}
            <button className="link-button" onClick={() => openNewLeave()}>
              Planifier une pause
            </button>
          </p>
        ) : (
          <ol className="recap-list">
            {groups.map((group, i) => {
              const period = periodOf(parseISO(group.start));
              const startsPeriod = i === 0 || periodOf(parseISO(groups[i - 1].start)) !== period;
              return (
                <Fragment key={group.key}>
                  {startsPeriod && <PeriodDivider period={period} ledgers={ledgers} />}
                  <li>
                    <RecapRow group={group} data={data} ledgers={ledgers} onOpen={() => openLeaveDetail(group.key)} />
                  </li>
                </Fragment>
              );
            })}
          </ol>
        )}
      </section>
    </div>
  );
}

function BalancesSheet({ ledgers }: { ledgers: Ledger[] }) {
  return (
    <section className="sheet" aria-labelledby="balances-title">
      <h2 id="balances-title" className="sheet-title">
        Soldes par emploi
      </h2>
      <table className="recap-table">
        <thead>
          <tr>
            <th scope="col">
              <span className="sr-only">Emploi</span>
            </th>
            <th scope="col">Aujourd’hui</th>
            <th scope="col">Après le dernier congé prévu</th>
          </tr>
        </thead>
        <tbody>
          {ledgers.map(({ job, steps, startPeriod }) => {
            const last = steps.at(-1)!;
            return (
              <tr key={job.id}>
                <th scope="row">
                  <JobTag job={job} />
                  <small>
                    {ruleLabel(job)} · +{fmtDays(job.accrual)} j par mois
                  </small>
                </th>
                <td data-label="Aujourd’hui">
                  <Balances n1={job.balanceN1} n={job.balanceN} period={startPeriod} />
                </td>
                <td data-label="Après le dernier congé prévu">
                  {steps.length > 1 ? (
                    <>
                      <Balances n1={last.after.n1} n={last.after.n} period={last.period} />
                      <small>au {dayFmt(last.date, "d MMMM yyyy")}</small>
                    </>
                  ) : (
                    <small>Aucun congé à venir</small>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </section>
  );
}

function Balances({ n1, n, period }: { n1: number; n: number; period: number }) {
  return (
    <span className="balances">
      <span>
        N−1 <em>{periodLabel(period - 1)}</em>
        <b>{fmtDays(n1)} j</b>
      </span>
      <span>
        N <em>{periodLabel(period)}</em>
        <b className={n < 0 ? "negative" : ""}>{fmtDays(n)} j</b>
      </span>
    </span>
  );
}

/** Heading of a June → May period, with the N−1 days lost when it started. */
function PeriodDivider({ period, ledgers }: { period: number; ledgers: Ledger[] }) {
  const expiries = ledgers
    .map((ledger) => ({
      job: ledger.job,
      expired: ledger.steps.find((step) => step.kind === "rollover" && step.date === `${period}-05-31`)?.expired,
    }))
    .filter((x) => x.expired);

  return (
    <li className="period">
      <h3>
        Juin {period} → mai {period + 1}
      </h3>
      <span>
        N−1 = {periodLabel(period - 1)} · N = {periodLabel(period)}
      </span>
      {expiries.map(({ job, expired }) => (
        <small key={job.id}>
          {job.name} : {fmtDays(expired!)} j de N−1 {periodLabel(period - 2)} non posés au 31 mai {period} (perdus
          sauf report)
        </small>
      ))}
    </li>
  );
}

type RecapRowProps = { group: LeaveGroup; data: AppState; ledgers: Ledger[]; onOpen: () => void };

function RecapRow({ group, data, ledgers, onOpen }: RecapRowProps) {
  const items = group.items.map((leave) => ({
    leave,
    alloc: ledgers.find((l) => l.job.id === leave.jobId)?.allocs.get(leave.id),
    job: data.jobs.find((j) => j.id === leave.jobId),
  }));
  const short = items.some(({ alloc }) => alloc && alloc.shortfall > 0);
  const past = group.end < iso(today());
  const status = rowStatus(group, past, short);

  return (
    <button className={`recap-row ${past ? "past" : ""}`} onClick={onOpen}>
      <time className="date-mark" dateTime={group.start}>
        <b>{dayFmt(group.start, "d")}</b>
        {dayFmt(group.start, "MMM yy")}
      </time>
      <div className="recap-main">
        <div className="recap-title">
          <strong>{group.label}</strong>
          <span className={`status ${status.className}`}>{status.label}</span>
        </div>
        <small>{rangeLabel(group.start, group.end)}</small>
        <ul>
          {items.map(({ leave, alloc, job }) => (
            <li key={leave.id}>
              <JobTag job={job} />
              <b>{fmtDays(leave.days)} j</b>
              <em>{allocSummary(alloc)}</em>
            </li>
          ))}
        </ul>
      </div>
      <ChevronRight className="chevron" aria-hidden="true" />
    </button>
  );
}

function rowStatus(group: LeaveGroup, past: boolean, short: boolean) {
  if (past) return { className: "past", label: "Passé" };
  if (short) return { className: "short", label: "Solde insuffisant" };
  return { className: group.status, label: group.status === "valide" ? "Validé" : "Planifié" };
}

/** "N−1 2025-26 : 4 j + N 2026-27 : 2 j · reste 10 j" */
function allocSummary(alloc?: LeaveAlloc) {
  if (!alloc || alloc.past) return "déjà déduit des soldes saisis";
  const parts = [
    alloc.fromN1 > 0 && `N−1 ${periodLabel(alloc.period - 1)} : ${fmtDays(alloc.fromN1)} j`,
    alloc.fromN > 0 && `N ${periodLabel(alloc.period)} : ${fmtDays(alloc.fromN)} j`,
  ];
  return `${parts.filter(Boolean).join(" + ")} · reste ${fmtDays(alloc.after.n1 + alloc.after.n)} j`;
}
