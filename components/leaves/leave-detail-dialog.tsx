"use client";

import { useState } from "react";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { PenLine, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { fmtDays, rangeLabel } from "@/lib/format";
import { buildLedger, leaveGroups } from "@/lib/ledger";
import type { AppState } from "@/lib/types";
import { sumBy } from "@/lib/utils";
import { LeaveAllocSection } from "./leave-alloc-section";

type LeaveDetailDialogProps = {
  /** Key of the leave group to show, null when closed. */
  groupKey: string | null;
  data: AppState;
  onClose: () => void;
  onDelete: (key: string) => void;
  onEdit: (key: string) => void;
};

/** How a leave is counted on each of its jobs, with delete and edit actions. */
export function LeaveDetailDialog({ groupKey, data, onClose, onDelete, onEdit }: LeaveDetailDialogProps) {
  const [confirming, setConfirming] = useState(false);
  const group = groupKey ? leaveGroups(data.leaves).find((g) => g.key === groupKey) : undefined;
  if (!group) return null;

  const calendarDays = differenceInCalendarDays(parseISO(group.end), parseISO(group.start)) + 1;
  const total = sumBy(group.items, (l) => l.days);
  const description = [
    rangeLabel(group.start, group.end),
    `${calendarDays} jour${calendarDays > 1 ? "s" : ""} calendaire${calendarDays > 1 ? "s" : ""}`,
    `${fmtDays(total)} j décomptés`,
    group.status === "valide" ? "validé par l’employeur" : "planifié",
  ].join(" · ");

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="dialog-card sm:max-w-[680px]">
        <DialogHeader>
          <DialogTitle>{group.label}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="alloc-list">
          {group.items.map((leave) => {
            const job = data.jobs.find((j) => j.id === leave.jobId);
            if (!job) return null;
            const ledger = buildLedger(job, data.leaves);
            const alloc = ledger.allocs.get(leave.id);
            return alloc ? <LeaveAllocSection key={leave.id} job={job} ledger={ledger} alloc={alloc} /> : null;
          })}
        </div>

        <p className="footnote">
          Simulation à partir des soldes saisis aujourd’hui : l’acquisition est créditée en fin de mois, un congé est
          pris d’abord sur le N−1 puis sur le N, et au 31 mai le N−1 non posé est considéré comme perdu (sauf report
          accordé par l’employeur) tandis que le N devient le nouveau N−1.
        </p>

        <div className="dialog-actions">
          {confirming ? (
            <>
              <p className="confirm-text">Retirer ce congé du calendrier et des soldes ?</p>
              <Button variant="outline" onClick={() => setConfirming(false)}>
                Garder
              </Button>
              <Button variant="destructive" onClick={() => onDelete(group.key)}>
                <Trash2 /> Supprimer le congé
              </Button>
            </>
          ) : (
            <>
              <Button variant="ghost" className="danger-ghost" onClick={() => setConfirming(true)}>
                Supprimer
              </Button>
              <Button variant="outline" onClick={onClose}>
                Fermer
              </Button>
              <Button className="primary-action" onClick={() => onEdit(group.key)}>
                <PenLine /> Modifier
              </Button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
