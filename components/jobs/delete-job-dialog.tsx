"use client";

import { ShieldAlert, Trash2 } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogMedia,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { dayFmt, fmtDays } from "@/lib/format";
import type { Job, Leave } from "@/lib/types";

type DeleteJobDialogProps = {
  job: Job;
  /** Leaves of the job, deleted with it. */
  leaves: Leave[];
  onClose: () => void;
  onDelete: () => void;
};

export function DeleteJobDialog({ job, leaves, onClose, onDelete }: DeleteJobDialogProps) {
  const count = leaves.length;
  const plural = count > 1;

  const description =
    count > 0
      ? `${count} congé${plural ? "s sont liés" : " est lié"} à cet emploi. Pour éviter des données incohérentes, ${plural ? "ils seront supprimés" : "il sera supprimé"} en même temps.`
      : "Cet emploi n’a aucun congé associé. Sa suppression retirera aussi ses compteurs et son revenu du budget.";

  return (
    <AlertDialog open onOpenChange={(open) => !open && onClose()}>
      <AlertDialogContent className="reset-dialog">
        <AlertDialogHeader>
          <AlertDialogMedia>
            <ShieldAlert />
          </AlertDialogMedia>
          <AlertDialogTitle>Supprimer « {job.name} » ?</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>

        {count > 0 && (
          <ul className="linked-leaves">
            {leaves.map((leave) => (
              <li key={leave.id}>
                <strong>{leave.label}</strong>
                <small>
                  Du {dayFmt(leave.start)} au {dayFmt(leave.end)} · {fmtDays(leave.days)} j
                </small>
              </li>
            ))}
          </ul>
        )}

        <AlertDialogFooter>
          <AlertDialogCancel>Annuler, tout conserver</AlertDialogCancel>
          <AlertDialogAction variant="destructive" onClick={onDelete}>
            <Trash2 /> Supprimer{count > 0 ? ` l’emploi et ${count} congé${plural ? "s" : ""}` : " l’emploi"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
