"use client";

import { useState } from "react";
import { NewLeaveButton } from "@/components/shared/new-leave-button";
import { PageHead } from "@/components/shared/page-head";
import { CalendarView } from "./calendar-view";
import { LeaveRecap } from "./leave-recap";
import { LeaveYearView } from "./leave-year-view";

type Tab = "calendrier" | "recap";

const TABS: { id: Tab; label: string }[] = [
  { id: "calendrier", label: "Calendrier" },
  { id: "recap", label: "Récapitulatif et calculs" },
];

export function LeavesPage() {
  const [tab, setTab] = useState<Tab>("calendrier");

  return (
    <div className="page">
      <PageHead title="Mes congés">
        <NewLeaveButton />
      </PageHead>

      <div className="view-tabs" role="tablist" aria-label="Affichage des congés">
        {TABS.map(({ id, label }) => (
          <button
            key={id}
            role="tab"
            id={`tab-${id}`}
            aria-controls="panel-conges"
            aria-selected={tab === id}
            onClick={() => setTab(id)}
          >
            {label}
          </button>
        ))}
      </div>

      <div id="panel-conges" role="tabpanel" aria-labelledby={`tab-${tab}`} className="tab-panel">
        {tab === "recap" ? (
          <LeaveRecap />
        ) : (
          <>
            <CalendarView />
            <LeaveYearView />
          </>
        )}
      </div>
    </div>
  );
}
