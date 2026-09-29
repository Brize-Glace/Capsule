"use client";

import { createContext, useContext, type SetStateAction } from "react";
import type { AppState } from "@/lib/types";

/** Period selected on the calendar, shared with the leave dialog. */
export type DateSelection = { start: Date | null; end: Date | null };

type AppContextValue = {
  data: AppState;
  setData: (action: SetStateAction<AppState>) => void;
  /** Shows a short message at the bottom of the screen. */
  flash: (message: string) => void;
  /** Opens the leave dialog on a new period (today by default). */
  openNewLeave: (start?: Date, end?: Date) => void;
  /** Opens the detail of a leave group. */
  openLeaveDetail: (key: string) => void;
  selection: DateSelection;
  updateSelection: (patch: Partial<DateSelection>) => void;
};

export const AppContext = createContext<AppContextValue | null>(null);

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error("useApp must be used inside <AppShell>");
  return context;
}
