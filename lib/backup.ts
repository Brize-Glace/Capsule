import { format } from "date-fns";
import { normalizeState } from "./state";
import type { AppState } from "./types";

/** Downloads the data as a JSON file. */
export function downloadBackup(data: AppState) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `capsule-sauvegarde-${format(new Date(), "yyyy-MM-dd")}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

/** Reads a file made by `downloadBackup`. Rejects if it is not a Capsule backup. */
export async function readBackup(file: File): Promise<AppState> {
  const parsed = JSON.parse(await file.text());
  if (!parsed.jobs || !parsed.leaves || !parsed.budget) throw new Error("Not a Capsule backup");
  return normalizeState(parsed);
}
