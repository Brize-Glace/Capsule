"use client";

import { differenceInCalendarDays, parseISO } from "date-fns";
import { useApp } from "@/components/app/app-context";
import { JobTag } from "@/components/shared/job-tag";
import { dayFmt, fmtDays, iso, rangeLabel, today } from "@/lib/format";
import { leaveGroups } from "@/lib/ledger";

/** The next (or current) leave period. */
export function NextBreak() {
  const { data, openNewLeave, openLeaveDetail } = useApp();
  const now = today();
  const next = leaveGroups(data.leaves).find((g) => g.end >= iso(now));

  if (!next) {
    return (
      <div className="next-break">
        <p className="next-when">Aucune pause prévue</p>
        <h2>Le calendrier est libre</h2>
        <button className="link-button" onClick={() => openNewLeave()}>
          Planifier une pause
        </button>
      </div>
    );
  }

  const daysUntil = differenceInCalendarDays(parseISO(next.start), now);
  let when = `Prochaine pause dans ${daysUntil} jours`;
  if (daysUntil <= 0) when = `En cours, jusqu’au ${dayFmt(next.end, "EEEE d MMMM")}`;
  else if (daysUntil === 1) when = "Prochaine pause demain";

  return (
    <div className="next-break">
      <p className="next-when">{when}</p>
      <h2>{next.label}</h2>
      <p className="next-dates">{rangeLabel(next.start, next.end)}</p>
      <ul className="job-days">
        {next.items.map((leave) => (
          <li key={leave.id}>
            <JobTag job={data.jobs.find((j) => j.id === leave.jobId)} />
            <b>{fmtDays(leave.days)} j</b>
          </li>
        ))}
      </ul>
      <p className={`next-status ${next.status}`}>
        {next.status === "valide" ? "Validé par l’employeur" : "Pas encore validé"}
      </p>
      <button className="link-button" onClick={() => openLeaveDetail(next.key)}>
        Voir le décompte
      </button>
    </div>
  );
}
