"use client";

import { addMonths, endOfMonth, startOfMonth } from "date-fns";
import { useApp } from "@/components/app/app-context";
import { fmtDays, formatFr, iso, today } from "@/lib/format";
import { buildLedger, jobOutlook } from "@/lib/ledger";
import { sumBy } from "@/lib/utils";

/** Bar chart of leave acquired, taken and at risk over the next 12 months. */
export function LeaveYearView() {
  const { data } = useApp();
  const months = Array.from({ length: 12 }, (_, i) => addMonths(startOfMonth(today()), i));
  const atRisk = sumBy(data.jobs, (job) => jobOutlook(buildLedger(job, data.leaves), data.leaves).n1Left);

  const rows = months.map((month) => {
    const key = formatFr(month, "yyyy-MM");
    const monthEnd = iso(endOfMonth(month));
    return {
      month,
      acquired: sumBy(
        data.jobs.filter((job) => job.startDate <= monthEnd),
        (job) => job.accrual,
      ),
      taken: sumBy(
        data.leaves.filter((l) => l.start.startsWith(key)),
        (l) => l.days,
      ),
      // Unplanned N−1 is lost at the end of May.
      lost: month.getMonth() === 4 ? atRisk : 0,
    };
  });

  const max = Math.max(1, ...rows.flatMap((r) => [r.acquired, r.taken, r.lost]));
  const bar = (value: number) => ({ height: value > 0 ? `${Math.max(2, (value / max) * 100)}%` : "0" });

  return (
    <section className="year" aria-labelledby="year-title">
      <div className="block-head">
        <h2 id="year-title">Sur les 12 prochains mois</h2>
        <ul className="legend">
          <li>
            <i className="k-acquired" />
            Acquis
          </li>
          <li>
            <i className="k-taken" />
            Posés
          </li>
          <li>
            <i className="k-risk" />
            Reliquat à risque
          </li>
        </ul>
      </div>

      <div className="year-bars">
        {rows.map((row) => (
          <div
            className="year-month"
            key={iso(row.month)}
            role="img"
            aria-label={`${formatFr(row.month, "MMMM yyyy")} : ${fmtDays(row.acquired)} j acquis, ${fmtDays(row.taken)} j posés${row.lost ? `, ${fmtDays(row.lost)} j à risque` : ""}`}
          >
            <div className="year-values">
              <i className="k-acquired" style={bar(row.acquired)} />
              <i className="k-taken" style={bar(row.taken)} />
              <i className="k-risk" style={bar(row.lost)} />
            </div>
            <small>{formatFr(row.month, "MMM")}</small>
          </div>
        ))}
      </div>

      <p className="footnote">
        Le reliquat à risque est le N−1 encore non planifié au 31 mai. Il n’est perdu que si votre employeur n’en
        autorise pas le report.
      </p>
    </section>
  );
}
