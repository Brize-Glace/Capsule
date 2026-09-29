"use client";

import { useState } from "react";
import { addDays, addMonths, getDay, isAfter, isBefore, isSameDay, isSameMonth, startOfMonth, subMonths } from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useApp } from "@/components/app/app-context";
import { formatFr, iso, today } from "@/lib/format";
import { isHoliday } from "@/lib/holidays";
import { groupKey } from "@/lib/ledger";
import { orderedRange } from "@/lib/leave-rules";
import type { AppState } from "@/lib/types";
import { cn } from "@/lib/utils";
import { CalendarAside } from "./calendar-aside";

const WEEK_LABELS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];

/** Month grid where leave can be selected by dragging over days, next to the reminders and upcoming leave. */
export function CalendarView() {
  const { data, selection, updateSelection, openNewLeave, openLeaveDetail } = useApp();
  const [month, setMonth] = useState(() => startOfMonth(today()));
  const [dragging, setDragging] = useState(false);
  const now = today();

  // 6 weeks starting on the Monday on or before the 1st
  const first = startOfMonth(month);
  const gridStart = addDays(first, -((getDay(first) + 6) % 7));
  const days = Array.from({ length: 42 }, (_, i) => addDays(gridStart, i));

  const isSelected = (day: Date) => {
    if (!selection.start || !selection.end) return false;
    const [from, to] = orderedRange(selection.start, selection.end);
    return !isBefore(day, from) && !isAfter(day, to);
  };

  const startDrag = (day: Date) => {
    setDragging(true);
    updateSelection({ start: day, end: day });
  };
  const extendDrag = (day: Date) => {
    if (dragging) updateSelection({ end: day });
  };
  const endDrag = () => {
    if (dragging && selection.start && selection.end) openNewLeave(selection.start, selection.end);
    setDragging(false);
  };

  return (
    <div className="calendar-layout">
      <section
        className="sheet calendar"
        aria-label="Calendrier des congés"
        onMouseLeave={() => {
          if (dragging) endDrag();
        }}
      >
        <div className="calendar-head">
          <h2>{formatFr(month, "MMMM yyyy")}</h2>
          <div className="calendar-nav">
            <button className="icon-button" aria-label="Mois précédent" onClick={() => setMonth(subMonths(month, 1))}>
              <ChevronLeft />
            </button>
            <button className="text-button" disabled={isSameMonth(month, now)} onClick={() => setMonth(startOfMonth(now))}>
              Aujourd’hui
            </button>
            <button className="icon-button" aria-label="Mois suivant" onClick={() => setMonth(addMonths(month, 1))}>
              <ChevronRight />
            </button>
          </div>
        </div>

        <div className="week-labels" aria-hidden="true">
          {WEEK_LABELS.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className="month-grid" onMouseUp={endDrag} onTouchEnd={endDrag}>
          {days.map((day) => (
            <DayCell
              key={iso(day)}
              day={day}
              data={data}
              outside={!isSameMonth(day, month)}
              isToday={isSameDay(day, now)}
              selected={isSelected(day)}
              onDragStart={startDrag}
              onDragOver={extendDrag}
              onOpenLeave={openNewLeave}
              onOpenDetail={openLeaveDetail}
            />
          ))}
        </div>

        <div className="calendar-foot">
          <p>
            Glissez sur plusieurs jours pour poser une absence. Chaque emploi est décompté selon ses propres règles,
            jours fériés exclus.
          </p>
          <ul className="legend">
            {data.jobs.map((job) => (
              <li key={job.id}>
                <i style={{ background: job.color }} />
                {job.name}
              </li>
            ))}
            <li>
              <i className="legend-holiday" />
              Férié
            </li>
          </ul>
        </div>
      </section>

      <CalendarAside />
    </div>
  );
}

type DayCellProps = {
  day: Date;
  data: AppState;
  outside: boolean;
  isToday: boolean;
  selected: boolean;
  onDragStart: (day: Date) => void;
  onDragOver: (day: Date) => void;
  onOpenLeave: (start: Date, end: Date) => void;
  onOpenDetail: (key: string) => void;
};

function DayCell({ day, data, outside, isToday, selected, onDragStart, onDragOver, onOpenLeave, onOpenDetail }: DayCellProps) {
  const dayIso = iso(day);
  const holiday = isHoliday(day);
  const dayLeaves = data.leaves.filter((l) => dayIso >= l.start && dayIso <= l.end);
  const weekend = getDay(day) === 0 || getDay(day) === 6;

  const label = [
    formatFr(day, "EEEE d MMMM"),
    holiday && ", férié",
    dayLeaves.length > 0 && `, ${dayLeaves.map((l) => l.label).join(", ")}`,
    " : poser des congés",
  ]
    .filter(Boolean)
    .join("");

  // Clicking a leave chip opens it instead of starting a new selection.
  const stop = (e: React.SyntheticEvent) => e.stopPropagation();

  return (
    <button
      className={cn("day-cell", outside && "outside", weekend && "weekend", selected && "selecting")}
      aria-label={label}
      onMouseDown={(e) => {
        e.preventDefault();
        onDragStart(day);
      }}
      onMouseEnter={() => onDragOver(day)}
      onTouchStart={() => onDragStart(day)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onOpenLeave(day, day);
        }
      }}
    >
      <span className={isToday ? "today" : undefined}>{formatFr(day, "d")}</span>
      {holiday && <small>Férié</small>}
      {dayLeaves.map((leave) => (
        <i
          key={leave.id}
          className="leave-chip"
          title={`${leave.label} · voir le détail`}
          style={{ background: data.jobs.find((j) => j.id === leave.jobId)?.color }}
          onMouseDown={stop}
          onTouchStart={stop}
          onClick={() => onOpenDetail(groupKey(leave))}
        >
          {leave.label}
        </i>
      ))}
    </button>
  );
}
