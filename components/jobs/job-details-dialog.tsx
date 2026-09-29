"use client";

import { addMonths, isBefore, parseISO, startOfMonth } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtDays, formatFr, iso, money, today } from "@/lib/format";
import { accrualForMonth } from "@/lib/ledger";
import { ruleLabel } from "@/lib/leave-rules";
import type { Job } from "@/lib/types";

type JobDetailsDialogProps = { job: Job; onClose: () => void; onEdit: () => void };

/** Accrual of the 12 months starting at `from`, with the running total. */
function accrualSchedule(job: Job, from: Date) {
  let cumulative = 0;
  return Array.from({ length: 12 }, (_, i) => {
    const month = addMonths(from, i);
    const accrual = accrualForMonth(job, month);
    cumulative += accrual.amount;
    return { month, ...accrual, cumulative };
  });
}

// Shows the coming 12 months of accrual — from the hiring month for a new job, from the current month otherwise.
export function JobDetailsDialog({ job, onClose, onEdit }: JobDetailsDialogProps) {
  const start = parseISO(job.startDate);
  const thisMonth = startOfMonth(today());
  const months = accrualSchedule(job, isBefore(start, thisMonth) ? thisMonth : startOfMonth(start));

  const description = [
    job.company,
    job.type === "partial" ? "temps partiel" : "temps plein",
    `${job.startDate > iso(today()) ? "commence" : "commencé"} le ${formatFr(start, "d MMMM yyyy")}`,
  ].join(" · ");

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="dialog-card sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>{job.name}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <dl className="facts">
          <div>
            <dt>Décompte</dt>
            <dd>{ruleLabel(job)}</dd>
          </div>
          <div>
            <dt>Solde actuel</dt>
            <dd>{fmtDays(job.balanceN + job.balanceN1)} j</dd>
          </div>
          <div>
            <dt>Salaire net</dt>
            <dd>{money(job.salary)}</dd>
          </div>
        </dl>

        <section className="dialog-section">
          <h3>
            Acquisition des 12 prochains mois <span>+{fmtDays(job.accrual)} j par mois</span>
          </h3>
          <div className="table-scroll capped">
            <table className="data-table">
              <thead>
                <tr>
                  <th scope="col">Mois</th>
                  <th scope="col">Acquis</th>
                  <th scope="col">Cumul</th>
                </tr>
              </thead>
              <tbody>
                {months.map((row) => (
                  <tr key={iso(row.month)}>
                    <th scope="row">
                      {formatFr(row.month, "MMMM yyyy")}
                      {row.prorated && (
                        <small>
                          prorata {row.remaining}/{row.daysInMonth} jours
                        </small>
                      )}
                    </th>
                    <td>+{fmtDays(row.amount)} j</td>
                    <td>{fmtDays(row.cumulative)} j</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <p className="footnote">
          Le mois d’embauche est estimé au prorata des jours calendaires restants, date de début incluse. La méthode
          réelle dépend de la convention ou de la paie : votre bulletin et votre service RH restent la référence.
        </p>

        <div className="dialog-actions">
          <Button variant="outline" onClick={onClose}>
            Fermer
          </Button>
          <Button className="primary-action" onClick={onEdit}>
            Modifier cet emploi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
