"use client";

import { useApp } from "@/components/app/app-context";
import { FieldHelp } from "@/components/shared/field-help";
import { Button } from "@/components/ui/button";
import { dayFmt, fmtDays, iso, money, today } from "@/lib/format";
import { partialConfig, ruleLabel } from "@/lib/leave-rules";
import type { Job } from "@/lib/types";
import { NumberField, WorkDaysBadges } from "./job-fields";

type JobCardProps = {
  job: Job;
  leaveCount: number;
  canDelete: boolean;
  onShowDetails: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

export function JobCard({ job, leaveCount, canDelete, onShowDetails, onEdit, onDelete }: JobCardProps) {
  const { setData } = useApp();
  const started = job.startDate <= iso(today());
  const subtitle = [
    job.company,
    job.type === "partial" ? "Temps partiel" : "Temps plein",
    `${started ? "depuis" : "commence"} le ${dayFmt(job.startDate, "d MMMM yyyy")}`,
  ].join(" · ");

  const setBalance = (key: "balanceN" | "balanceN1", value: number) =>
    setData((d) => ({ ...d, jobs: d.jobs.map((j) => (j.id === job.id ? { ...j, [key]: value } : j)) }));

  return (
    <article className="sheet job" style={{ "--job-color": job.color } as React.CSSProperties}>
      <header className="job-head">
        <div>
          <h2>
            <i className="swatch" aria-hidden="true" />
            {job.name}
          </h2>
          <p>{subtitle}</p>
        </div>
        <div className="job-actions">
          <Button variant="outline" className="secondary-action" onClick={onShowDetails}>
            Voir la fiche
          </Button>
          <Button variant="outline" className="secondary-action" onClick={onEdit}>
            Modifier
          </Button>
        </div>
      </header>

      <dl className="job-rules">
        <div>
          <dt>Décompte</dt>
          <dd>
            {ruleLabel(job)}
            {job.type === "partial" && <WorkDaysBadges days={partialConfig(job).workDays} />}
          </dd>
        </div>
        <div>
          <dt>Acquisition</dt>
          <dd>+{fmtDays(job.accrual)} j par mois</dd>
        </div>
        <div>
          <dt>Salaire net</dt>
          <dd>{money(job.salary)}</dd>
        </div>
        <div>
          <dt>Congés enregistrés</dt>
          <dd>{leaveCount || "Aucun"}</dd>
        </div>
      </dl>

      <div className="job-balances">
        <NumberField
          className="form-input figure-input"
          label={
            <>
              Solde N−1 <FieldHelp text="Reliquat de la période précédente, généralement à utiliser avant le 31 mai." />
            </>
          }
          step="0.5"
          value={job.balanceN1}
          onChange={(v) => setBalance("balanceN1", v)}
        />
        <NumberField
          className="form-input figure-input"
          label={
            <>
              Solde N{" "}
              <FieldHelp text="Congés acquis sur la période en cours. Vérifiez votre bulletin de paie en cas de doute." />
            </>
          }
          step="0.5"
          value={job.balanceN}
          onChange={(v) => setBalance("balanceN", v)}
        />
      </div>

      <footer className="job-foot">
        {canDelete ? (
          <button className="danger-link" onClick={onDelete}>
            Supprimer cet emploi
          </button>
        ) : (
          <small>Le dernier emploi ne peut pas être supprimé : le calendrier en a besoin.</small>
        )}
      </footer>
    </article>
  );
}
