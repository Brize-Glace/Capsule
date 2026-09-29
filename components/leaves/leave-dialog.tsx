"use client";

import { useState } from "react";
import { isValid, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { dayFmt, fmtDays, formatFr, iso, safeIso } from "@/lib/format";
import { buildLedger, groupKey, periodLabel, type LeaveAlloc, type LeaveGroup } from "@/lib/ledger";
import { countLeaveDays, leaveSpanOk, MAX_LEAVE_SPAN, orderedRange, ruleLabel, ruleSentence } from "@/lib/leave-rules";
import type { Job, Leave, LeaveStatus } from "@/lib/types";
import { sumBy } from "@/lib/utils";

type LeaveDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  jobs: Job[];
  leaves: Leave[];
  /** The leave being edited, undefined for a new one. */
  editing?: LeaveGroup;
  activeJobIds: string[];
  setActiveJobIds: (ids: string[]) => void;
  start: Date | null;
  end: Date | null;
  onStartChange: (date: Date | null) => void;
  onEndChange: (date: Date | null) => void;
  onSave: (leaves: Leave[]) => void;
};

/** New or edited leave period, counted separately on each selected job. */
export function LeaveDialog({
  open,
  setOpen,
  jobs,
  leaves,
  editing,
  activeJobIds,
  setActiveJobIds,
  start,
  end,
  onStartChange,
  onEndChange,
  onSave,
}: LeaveDialogProps) {
  const [label, setLabel] = useState(editing?.label ?? "");
  const [status, setStatus] = useState<LeaveStatus>(editing?.status ?? "planifie");
  // Days set by hand, per job id
  const [overrides, setOverrides] = useState<Record<string, number>>(() =>
    Object.fromEntries((editing?.items ?? []).filter((l) => l.adjusted).map((l) => [l.jobId, l.days])),
  );

  // When editing, the period being edited must not count against itself in the projections.
  const others = editing ? leaves.filter((l) => groupKey(l) !== editing.key) : leaves;
  const selectedJobs = jobs.filter((job) => activeJobIds.includes(job.id));
  const spanOk = leaveSpanOk(start, end);
  const tooLong = !!start && !!end && isValid(start) && isValid(end) && !spanOk;
  const range = spanOk && end ? orderedRange(start, end) : null;

  const rows = selectedJobs.map((job) => simulateLeave(job, others, range, overrides[job.id]));
  const counted = rows.filter((row) => row.days > 0);
  const total = sumBy(counted, (row) => row.days);
  const allEnough = rows.every((row) => row.enough);
  const datesChanged = editing && range && (editing.start !== iso(range[0]) || editing.end !== iso(range[1]));
  const removedFrom = editing
    ? editing.items
        .filter((leave) => !counted.some((row) => row.job.id === leave.jobId))
        .map((leave) => jobs.find((job) => job.id === leave.jobId)?.name)
        .filter(Boolean)
    : [];

  function toggleJob(id: string) {
    setActiveJobIds(activeJobIds.includes(id) ? activeJobIds.filter((x) => x !== id) : [...activeJobIds, id]);
  }

  function setOverride(jobId: string, days: number | undefined) {
    setOverrides((current) => {
      const next = { ...current };
      if (days === undefined) delete next[jobId];
      else next[jobId] = days;
      return next;
    });
  }

  function hint() {
    if (tooLong) return `Période trop longue : limitez-la à ${MAX_LEAVE_SPAN} jours.`;
    if (!spanOk) return "Renseignez des dates valides.";
    if (!selectedJobs.length) return "Sélectionnez au moins un emploi.";
    if (selectedJobs.length > 1) return "Total cumulé sur les emplois sélectionnés.";
    return ruleSentence(selectedJobs[0]);
  }

  function save() {
    if (!range) return;
    const [from, to] = range;
    const groupId = editing?.key ?? crypto.randomUUID();
    onSave(
      counted.map((row) => ({
        id: editing?.items.find((l) => l.jobId === row.job.id)?.id ?? crypto.randomUUID(),
        groupId,
        jobId: row.job.id,
        start: iso(from),
        end: iso(to),
        days: row.days,
        label: label.trim() || "Congés",
        status,
        ...(row.adjusted !== undefined ? { adjusted: true } : {}),
      })),
    );
  }

  const boxState = total === 0 ? "neutral" : allEnough ? "ok" : "not-enough";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="dialog-card sm:max-w-[620px]">
        <DialogHeader>
          <DialogTitle>{editing ? `Modifier « ${editing.label} »` : "Poser des congés"}</DialogTitle>
          <DialogDescription>
            {editing
              ? "Le décompte et les soldes sont recalculés à chaque changement."
              : "Le décompte est calculé séparément pour chaque emploi coché."}
          </DialogDescription>
        </DialogHeader>

        <div className="dialog-form">
          <div className="two-fields">
            <DateField label="Du" value={start} onChange={onStartChange} />
            <DateField label="Au" value={end} onChange={onEndChange} />
          </div>

          {editing && datesChanged && (
            <p className="edit-diff">
              Avant : du {dayFmt(editing.start)} au {dayFmt(editing.end)} ·{" "}
              {fmtDays(sumBy(editing.items, (l) => l.days))} j décomptés
            </p>
          )}

          <fieldset className="field">
            <legend>Emplois concernés</legend>
            <div className="job-picker">
              {jobs.map((job) => (
                <button
                  type="button"
                  key={job.id}
                  aria-pressed={activeJobIds.includes(job.id)}
                  onClick={() => toggleJob(job.id)}
                  style={{ "--job-color": job.color } as React.CSSProperties}
                >
                  <i aria-hidden="true" />
                  {job.name}
                  <small>{ruleLabel(job)}</small>
                </button>
              ))}
            </div>
          </fieldset>

          <div className={`calculation-box ${boxState}`} aria-live="polite">
            <div>
              <small>{rows.some((row) => row.adjusted !== undefined) ? "Décompte ajusté" : "Décompte estimé"}</small>
              <strong>
                {fmtDays(total)} jour{total > 1 ? "s" : ""}
              </strong>
            </div>
            <p>{hint()}</p>
            {range && rows.length > 0 && (
              <ul className="calc-rows">
                {rows.map((row) => (
                  <CalculationRow
                    key={row.job.id}
                    row={row}
                    from={range[0]}
                    onAdjust={(days) => setOverride(row.job.id, days)}
                  />
                ))}
              </ul>
            )}
          </div>

          {removedFrom.length > 0 && (
            <p className="alloc-note">Ce congé ne sera plus décompté sur : {removedFrom.join(", ")}.</p>
          )}

          <div className="two-fields label-status">
            <label className="field">
              <span>Nom de la pause</span>
              <input
                className="form-input"
                value={label}
                placeholder="Ex. Week-end à Lyon"
                onChange={(e) => setLabel(e.target.value)}
              />
            </label>
            <label className="field">
              <span>Statut</span>
              <Select value={status} onValueChange={(v) => setStatus(v as LeaveStatus)}>
                <SelectTrigger className="select-trigger">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planifie">Planifié</SelectItem>
                  <SelectItem value="valide">Validé par l’employeur</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>

          <div className="dialog-actions">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button className="primary-action" disabled={!spanOk || total === 0} onClick={save}>
              {editing ? "Enregistrer les modifications" : "Ajouter au calendrier"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function DateField({ label, value, onChange }: { label: string; value: Date | null; onChange: (d: Date | null) => void }) {
  return (
    <label className="field">
      <span>{label}</span>
      <input
        className="form-input"
        type="date"
        value={safeIso(value)}
        onChange={(e) => {
          const date = parseISO(e.target.value);
          onChange(e.target.value && isValid(date) ? date : null);
        }}
      />
    </label>
  );
}

const DRAFT_ID = "__new";

/** What the leave does on one job. */
type LeaveRow = {
  job: Job;
  /** Days counted by the job's rules. */
  computed: number;
  /** Days set by hand, if any. */
  adjusted?: number;
  days: number;
  alloc: LeaveAlloc | null;
  /** Later leaves this one would leave without enough balance. */
  newlyShort: Leave[];
  enough: boolean;
};

/** Replays the job's balances with and without the leave to see what it takes and what it breaks. */
function simulateLeave(job: Job, others: Leave[], range: [Date, Date] | null, override?: number): LeaveRow {
  const computed = range ? countLeaveDays(job, range[0], range[1]) : 0;
  const adjusted = range ? override : undefined;
  const days = adjusted ?? computed;
  if (!range || days <= 0) {
    return { job, computed, adjusted, days: Math.max(0, days), alloc: null, newlyShort: [], enough: true };
  }

  const draft: Leave = { id: DRAFT_ID, jobId: job.id, start: iso(range[0]), end: iso(range[0]), days, label: "", status: "planifie" };
  const without = buildLedger(job, others);
  const withDraft = buildLedger(job, [...others, draft]);
  const alloc = withDraft.allocs.get(DRAFT_ID)!;
  const newlyShort = [...withDraft.allocs.values()]
    .filter((a) => a.leave.id !== DRAFT_ID && a.shortfall > 0 && !without.allocs.get(a.leave.id)?.shortfall)
    .map((a) => a.leave);

  return { job, computed, adjusted, days, alloc, newlyShort, enough: alloc.shortfall === 0 };
}

type CalculationRowProps = {
  row: LeaveRow;
  from: Date;
  /** New number of days, or undefined to go back to the computed one. */
  onAdjust: (days: number | undefined) => void;
};

function CalculationRow({ row, from, onAdjust }: CalculationRowProps) {
  const { job, alloc } = row;
  const isAdjusted = row.adjusted !== undefined;

  let rule = "Aucun jour travaillé sur la période";
  if (isAdjusted) rule = `Ajusté à la main · calcul automatique : ${fmtDays(row.computed)} j`;
  else if (row.computed > 0) rule = ruleSentence(job);

  return (
    <li>
      <i style={{ background: job.color }} />
      <span>
        <b>{job.name}</b>
        <small>{rule}</small>
      </span>
      <span className="days-adjust">
        <button
          type="button"
          aria-label={`Retirer un demi-jour pour ${job.name}`}
          onClick={() => onAdjust(Math.max(0, row.days - 0.5))}
        >
          −
        </button>
        <strong>{fmtDays(row.days)} j</strong>
        <button type="button" aria-label={`Ajouter un demi-jour pour ${job.name}`} onClick={() => onAdjust(row.days + 0.5)}>
          +
        </button>
      </span>
      {isAdjusted && (
        <button type="button" className="link-button reset-adjust" onClick={() => onAdjust(undefined)}>
          Revenir au calcul automatique
        </button>
      )}
      {alloc && <AllocDetail alloc={alloc} from={from} enough={row.enough} />}
      {row.newlyShort.length > 0 && (
        <em className="short">
          Rendrait insuffisant : {row.newlyShort.map((l) => `${l.label} (${dayFmt(l.start)})`).join(", ")}
        </em>
      )}
    </li>
  );
}

function AllocDetail({ alloc, from, enough }: { alloc: LeaveAlloc; from: Date; enough: boolean }) {
  if (alloc.past) {
    return <small className="calc-detail">Date passée : considéré comme déjà déduit des soldes saisis.</small>;
  }

  const p = alloc.period;
  const takenFrom = [
    alloc.fromN1 > 0 && `N−1 ${fmtDays(alloc.fromN1)} j`,
    alloc.fromN > 0 && `N ${fmtDays(alloc.fromN)} j`,
  ]
    .filter(Boolean)
    .join(" + ");
  const detail =
    `Au ${formatFr(from, "d MMM yyyy")} : ` +
    `N−1 (${periodLabel(p - 1)}) ${fmtDays(alloc.before.n1)} j · N (${periodLabel(p)}) ${fmtDays(alloc.before.n)} j` +
    ` → pris sur ${takenFrom}`;

  return (
    <>
      <small className="calc-detail">{detail}</small>
      <em className={enough ? "" : "short"}>
        {enough
          ? `${fmtDays(alloc.after.n1 + alloc.after.n)} j restants ensuite`
          : `Il manque ${fmtDays(alloc.shortfall)} j à cette date`}
      </em>
    </>
  );
}
