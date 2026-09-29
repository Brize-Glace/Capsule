"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseISO } from "date-fns";
import { TooltipProvider } from "@/components/ui/tooltip";
import { LeaveDetailDialog } from "@/components/leaves/leave-detail-dialog";
import { LeaveDialog } from "@/components/leaves/leave-dialog";
import { downloadBackup, readBackup } from "@/lib/backup";
import { today } from "@/lib/format";
import { groupKey, leaveGroups } from "@/lib/ledger";
import { initialState } from "@/lib/state";
import { useAppState } from "@/lib/store";
import type { Leave } from "@/lib/types";
import { AppContext, type DateSelection } from "./app-context";
import { MobileDataMenu, SidebarDataActions } from "./data-actions";
import { Logo } from "./logo";
import { MainNav } from "./main-nav";
import { ResetDialog } from "./reset-dialog";

/** Layout shared by every page, plus the dialogs that can be opened from several pages. */
export function AppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [data, setData] = useAppState();

  const [notice, setNotice] = useState("");
  const noticeTimer = useRef<number | undefined>(undefined);
  const importInput = useRef<HTMLInputElement>(null);
  const [resetOpen, setResetOpen] = useState(false);

  // Leave dialog (new or edited period) and leave detail dialog
  const [leaveOpen, setLeaveOpen] = useState(false);
  const [leaveSession, setLeaveSession] = useState(0);
  const [editingKey, setEditingKey] = useState<string | null>(null);
  const [detailKey, setDetailKey] = useState<string | null>(null);
  const [activeJobIds, setActiveJobIds] = useState<string[]>([initialState.jobs[0].id]);
  const [selection, setSelection] = useState<DateSelection>({ start: null, end: null });
  const editingGroup = editingKey ? leaveGroups(data.leaves).find((g) => g.key === editingKey) : undefined;

  function flash(message: string) {
    window.clearTimeout(noticeTimer.current);
    setNotice(message);
    noticeTimer.current = window.setTimeout(() => setNotice(""), 2800);
  }

  function updateSelection(patch: Partial<DateSelection>) {
    setSelection((current) => ({ ...current, ...patch }));
  }

  function openNewLeave(start?: Date, end?: Date) {
    const from = start || today();
    setEditingKey(null);
    setSelection({ start: from, end: end || from });
    setLeaveSession((n) => n + 1);
    setLeaveOpen(true);
  }

  function openLeaveEdit(key: string) {
    const group = leaveGroups(data.leaves).find((g) => g.key === key);
    if (!group) return;
    setEditingKey(key);
    setSelection({ start: parseISO(group.start), end: parseISO(group.end) });
    setActiveJobIds(group.items.map((l) => l.jobId));
    setDetailKey(null);
    setLeaveSession((n) => n + 1);
    setLeaveOpen(true);
  }

  function saveLeaves(leaves: Leave[]) {
    setData((d) => ({
      ...d,
      leaves: [...d.leaves.filter((l) => !editingGroup || groupKey(l) !== editingGroup.key), ...leaves],
    }));
    setLeaveOpen(false);
    if (editingGroup) {
      setDetailKey(editingGroup.key);
      flash("Congé modifié");
    } else {
      flash(leaves.length > 1 ? `Congés ajoutés sur ${leaves.length} emplois` : "Congés ajoutés au calendrier");
    }
  }

  function deleteLeaveGroup(key: string) {
    setData((d) => ({ ...d, leaves: d.leaves.filter((l) => groupKey(l) !== key) }));
    setDetailKey(null);
    flash("Congé supprimé");
  }

  function exportData() {
    downloadBackup(data);
    flash("Sauvegarde téléchargée");
  }

  async function importData(file?: File) {
    if (!file) return;
    try {
      setData(await readBackup(file));
      flash("Données restaurées");
    } catch {
      flash("Ce fichier n’est pas une sauvegarde Capsule valide");
    }
  }

  function resetData() {
    setData(initialState);
    router.push("/");
    setResetOpen(false);
    flash("Données réinitialisées");
  }

  const dataActions = {
    onExport: exportData,
    onImport: () => importInput.current?.click(),
    onReset: () => setResetOpen(true),
  };

  const context = {
    data,
    setData,
    flash,
    openNewLeave,
    openLeaveDetail: setDetailKey,
    selection,
    updateSelection,
  };

  return (
    <AppContext.Provider value={context}>
      <TooltipProvider>
        <div className="app-shell">
          <aside className="sidebar">
            <Logo />
            <MainNav />
            <SidebarDataActions {...dataActions} />
          </aside>
          <header className="mobile-bar">
            <Logo />
            <MobileDataMenu {...dataActions} />
          </header>

          <main className="main">{children}</main>

          <MainNav className="tabbar" short />
          <input
            ref={importInput}
            className="sr-only"
            type="file"
            accept="application/json"
            tabIndex={-1}
            aria-hidden="true"
            onChange={(e) => {
              importData(e.target.files?.[0]);
              e.target.value = "";
            }}
          />
          <div className="toast-region" role="status" aria-live="polite">
            {notice && <div className="toast">{notice}</div>}
          </div>

          <LeaveDialog
            key={`${editingKey ?? "new"}-${leaveSession}`}
            open={leaveOpen}
            setOpen={setLeaveOpen}
            jobs={data.jobs}
            leaves={data.leaves}
            editing={editingGroup}
            activeJobIds={activeJobIds}
            setActiveJobIds={setActiveJobIds}
            start={selection.start}
            end={selection.end}
            onStartChange={(start) => updateSelection({ start })}
            onEndChange={(end) => updateSelection({ end })}
            onSave={saveLeaves}
          />
          <LeaveDetailDialog
            key={detailKey ?? "none"}
            groupKey={detailKey}
            data={data}
            onClose={() => setDetailKey(null)}
            onDelete={deleteLeaveGroup}
            onEdit={openLeaveEdit}
          />
          <ResetDialog
            open={resetOpen}
            setOpen={setResetOpen}
            onReset={resetData}
            onBackupAndReset={() => {
              exportData();
              window.setTimeout(resetData, 120);
            }}
          />
        </div>
      </TooltipProvider>
    </AppContext.Provider>
  );
}
