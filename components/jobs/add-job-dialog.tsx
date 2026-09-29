"use client";

import { useState } from "react";
import { FieldHelp } from "@/components/shared/field-help";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { iso, today } from "@/lib/format";
import { JOB_COLORS } from "@/lib/state";
import type { CountMode, Job, PartialFields, WorkType } from "@/lib/types";
import { ContractTypeSelect, CountModeSelect, NumberField, PartialRuleFields, TextField } from "./job-fields";

type AddJobDialogProps = {
  open: boolean;
  setOpen: (open: boolean) => void;
  /** Picks the new job's color. */
  colorIndex: number;
  onSave: (job: Job) => void;
};

export function AddJobDialog({ open, setOpen, colorIndex, onSave }: AddJobDialogProps) {
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [type, setType] = useState<WorkType>("totalTime");
  const [countMode, setCountMode] = useState<CountMode>("ouvres");
  const [startDate, setStartDate] = useState(() => iso(today()));
  const [salary, setSalary] = useState(0);
  const [balanceN, setBalanceN] = useState(0);
  const [balanceN1, setBalanceN1] = useState(0);
  const [partial, setPartial] = useState<PartialFields>({ workDays: [6, 0], partialRule: "week", weekendCost: 6, dayCost: 1 });
  const isPartial = type === "partial";

  function create() {
    onSave({
      id: crypto.randomUUID(),
      name: name.trim() || "Nouvel emploi",
      company: company || "Employeur",
      type,
      startDate,
      countMode: isPartial ? "forfait" : countMode,
      // Legal accrual: 2.5 working days (ouvrables) or 2.08 business days (ouvrés) per month
      accrual: countMode === "ouvrables" || isPartial ? 2.5 : 2.08,
      balanceN,
      balanceN1,
      color: JOB_COLORS[colorIndex % JOB_COLORS.length],
      salary,
      ...(isPartial ? partial : {}),
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="dialog-card sm:max-w-[640px]">
        <DialogHeader>
          <DialogTitle>Ajouter un emploi</DialogTitle>
          <DialogDescription>Les soldes restent modifiables plus tard, à partir de vos bulletins de paie.</DialogDescription>
        </DialogHeader>

        <div className="dialog-form">
          <div className="two-fields">
            <TextField label="Nom de l’emploi" value={name} placeholder="Ex. Alternance" onChange={setName} />
            <TextField label="Employeur" value={company} placeholder="Facultatif" onChange={setCompany} />
          </div>
          <div className="two-fields">
            <ContractTypeSelect value={type} onChange={setType} />
            <TextField label="Date de début" type="date" value={startDate} onChange={setStartDate} />
          </div>

          {isPartial ? (
            <PartialRuleFields job={partial} onChange={(patch) => setPartial((p) => ({ ...p, ...patch }))} />
          ) : (
            <CountModeSelect
              value={countMode}
              onChange={setCountMode}
              help="Ouvrés : généralement lundi–vendredi. Ouvrables : généralement lundi–samedi. Le bon choix dépend de l’employeur."
            />
          )}

          <NumberField
            label={
              <>
                Salaire net mensuel (€){" "}
                <FieldHelp text="Utilisé par le budget pour calculer vos revenus, à partir du mois de début." />
              </>
            }
            min="0"
            value={salary}
            onChange={setSalary}
          />
          <div className="two-fields">
            <NumberField label="Solde initial N−1" step="0.5" value={balanceN1} onChange={setBalanceN1} />
            <NumberField label="Solde initial N" step="0.5" value={balanceN} onChange={setBalanceN} />
          </div>

          <div className="dialog-actions">
            <Button variant="outline" onClick={() => setOpen(false)}>
              Annuler
            </Button>
            <Button
              className="primary-action"
              onClick={create}
              disabled={!startDate || (isPartial && !partial.workDays?.length)}
            >
              Créer l’emploi
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
