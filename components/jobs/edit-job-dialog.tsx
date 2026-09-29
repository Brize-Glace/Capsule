"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { partialConfig } from "@/lib/leave-rules";
import type { Job, WorkType } from "@/lib/types";
import { ContractTypeSelect, CountModeSelect, NumberField, PartialRuleFields, TextField } from "./job-fields";

type EditJobDialogProps = {
  job: Job;
  onClose: () => void;
  onSave: (job: Job) => void;
};

/** Edits a copy of the job; nothing changes until "Enregistrer". */
export function EditJobDialog({ job, onClose, onSave }: EditJobDialogProps) {
  const [draft, setDraft] = useState<Job>(() => ({ ...job }));
  const isPartial = draft.type === "partial";
  const canSave = draft.name.trim() !== "" && draft.startDate !== "" && (!isPartial || partialConfig(draft).workDays.length > 0);

  const update = <K extends keyof Job>(key: K, value: Job[K]) => setDraft((d) => ({ ...d, [key]: value }));

  // Switching contract type resets the counting mode; partial settings are filled with their defaults.
  function changeType(type: WorkType) {
    setDraft((d) => {
      if (type !== "partial") return { ...d, type, countMode: "ouvres" };
      const config = partialConfig(d);
      return {
        ...d,
        type,
        countMode: "forfait",
        workDays: config.workDays,
        partialRule: config.rule,
        weekendCost: config.weekCost,
        dayCost: config.dayCost,
      };
    });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="dialog-card sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Modifier {job.name}</DialogTitle>
          <DialogDescription>Les congés déjà enregistrés restent liés à cet emploi.</DialogDescription>
        </DialogHeader>

        <div className="dialog-form">
          <div className="two-fields">
            <TextField label="Nom de l’emploi" value={draft.name} onChange={(v) => update("name", v)} />
            <TextField label="Employeur" value={draft.company} onChange={(v) => update("company", v)} />
          </div>
          <div className="two-fields">
            <ContractTypeSelect value={draft.type} onChange={changeType} />
            <TextField label="Date de début" type="date" value={draft.startDate} onChange={(v) => update("startDate", v)} />
          </div>

          {isPartial ? (
            <PartialRuleFields job={draft} onChange={(patch) => setDraft((d) => ({ ...d, ...patch }))} />
          ) : (
            <CountModeSelect
              value={draft.countMode}
              onChange={(mode) => update("countMode", mode)}
              help="Ouvrés : généralement lundi–vendredi. Ouvrables : généralement lundi–samedi."
            />
          )}

          <div className="two-fields">
            <NumberField
              label="Acquisition mensuelle (jours)"
              min="0"
              step="0.01"
              value={draft.accrual}
              onChange={(v) => update("accrual", v)}
            />
            <NumberField
              label="Salaire net mensuel (€)"
              min="0"
              value={draft.salary}
              onChange={(v) => update("salary", v)}
            />
          </div>
          <div className="two-fields">
            <NumberField label="Solde N−1" step="0.5" value={draft.balanceN1} onChange={(v) => update("balanceN1", v)} />
            <NumberField label="Solde N" step="0.5" value={draft.balanceN} onChange={(v) => update("balanceN", v)} />
          </div>

          <div className="dialog-actions">
            <Button variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button className="primary-action" disabled={!canSave} onClick={() => onSave(draft)}>
              Enregistrer les modifications
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
