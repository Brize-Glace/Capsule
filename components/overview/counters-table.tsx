import { JobTag } from "@/components/shared/job-tag";
import { dayFmt, fmtDays, iso, today } from "@/lib/format";
import { jobOutlook, n1Deadline, type Ledger } from "@/lib/ledger";
import { ruleLabel } from "@/lib/leave-rules";
import type { Leave } from "@/lib/types";

/** Leave balances of every job: N−1, N and leave still to come. */
export function CountersTable({ ledgers, leaves }: { ledgers: Ledger[]; leaves: Leave[] }) {
  const todayIso = iso(today());
  const deadline = n1Deadline();

  return (
    <table className="counters-table">
      <thead>
        <tr>
          <th scope="col">
            <span className="sr-only">Emploi</span>
          </th>
          <th scope="col">Reliquat N−1</th>
          <th scope="col">En cours N</th>
          <th scope="col">Posés à venir</th>
        </tr>
      </thead>
      <tbody>
        {ledgers.map((ledger) => {
          const { job } = ledger;
          const outlook = jobOutlook(ledger, leaves);

          let n1Note = "Entièrement planifié";
          if (job.balanceN1 <= 0) n1Note = "Aucun reliquat";
          else if (outlook.n1Left > 0) n1Note = `${fmtDays(outlook.n1Left)} j à poser avant le ${deadline}`;

          return (
            <tr key={job.id}>
              <th scope="row">
                <JobTag job={job} />
                <small>
                  {ruleLabel(job)}
                  {job.startDate > todayIso && ` · à partir du ${dayFmt(job.startDate, "d MMMM")}`}
                </small>
              </th>
              <td data-label="Reliquat N−1">
                <strong>{fmtDays(job.balanceN1)} j</strong>
                <small className={outlook.n1Left > 0 ? "warn" : ""}>{n1Note}</small>
              </td>
              <td data-label="En cours N">
                <strong>{fmtDays(job.balanceN)} j</strong>
                <small>+{fmtDays(job.accrual)} j par mois</small>
              </td>
              <td data-label="Posés à venir">
                <strong>{fmtDays(outlook.upcomingDays)} j</strong>
                <small>
                  {outlook.upcomingCount
                    ? `${outlook.upcomingCount} congé${outlook.upcomingCount > 1 ? "s" : ""}`
                    : "Aucun congé"}
                </small>
                {outlook.shortCount > 0 && (
                  <small className="short">
                    {outlook.shortCount > 1
                      ? `${outlook.shortCount} au-delà du solde disponible`
                      : "1 au-delà du solde disponible"}
                  </small>
                )}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
