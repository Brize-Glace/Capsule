"use client";

import { parseISO } from "date-fns";
import { useApp } from "@/components/app/app-context";
import { JobTag } from "@/components/shared/job-tag";
import { dayFmt, fmtDays, iso, today } from "@/lib/format";
import { buildLedger, jobOutlook, leaveGroups, n1Deadline, type LeaveGroup } from "@/lib/ledger";

/** N−1 still to plan, and the list of upcoming leave. */
export function CalendarAside() {
  const { data, openLeaveDetail } = useApp();
  const now = today();
  const upcoming = leaveGroups(data.leaves).filter((g) => g.end >= iso(now));
  const ledgers = data.jobs.map((job) => buildLedger(job, data.leaves));

  const reminders = ledgers
    .map((ledger) => ({ job: ledger.job, left: jobOutlook(ledger, data.leaves).n1Left }))
    .filter((r) => r.left > 0);

  const isShort = (group: LeaveGroup) =>
    group.items.some((leave) => {
      const ledger = ledgers.find((l) => l.job.id === leave.jobId);
      return (ledger?.allocs.get(leave.id)?.shortfall ?? 0) > 0;
    });

  return (
    <aside className="calendar-aside">
      {reminders.length > 0 && (
        <section className="reminder">
          <h2>À poser avant le {n1Deadline()}</h2>
          <ul className="job-days">
            {reminders.map((r) => (
              <li key={r.job.id}>
                <JobTag job={r.job} />
                <b>{fmtDays(r.left)} j</b>
              </li>
            ))}
          </ul>
          <p>Reliquat N−1 pas encore planifié. Selon votre convention, il peut être perdu après cette date.</p>
        </section>
      )}

      <section className="upcoming" aria-labelledby="upcoming-title">
        <h2 id="upcoming-title">
          À venir{upcoming.length > 0 && <span> · {upcoming.length}</span>}
        </h2>
        {upcoming.length ? (
          <ol>
            {upcoming.map((group) => {
              const thisYear = parseISO(group.start).getFullYear() === now.getFullYear();
              const perJob = group.items
                .map((l) => `${data.jobs.find((j) => j.id === l.jobId)?.name} ${fmtDays(l.days)} j`)
                .join(" · ");
              return (
                <li key={group.key}>
                  <button onClick={() => openLeaveDetail(group.key)}>
                    <time className="date-mark" dateTime={group.start}>
                      <b>{dayFmt(group.start, "d")}</b>
                      {dayFmt(group.start, thisYear ? "MMM" : "MMM yy")}
                    </time>
                    <span>
                      <strong>{group.label}</strong>
                      <small>{perJob}</small>
                      {isShort(group) && <small className="short">Solde insuffisant à cette date</small>}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        ) : (
          <p className="empty">Rien de prévu pour l’instant.</p>
        )}
      </section>
    </aside>
  );
}
