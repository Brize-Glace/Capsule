import { useSyncExternalStore, type SetStateAction } from "react";
import { initialState, normalizeState } from "./state";
import type { AppState } from "./types";

// All the app data lives in the browser's localStorage, under a single key.
const STORAGE_KEY = "capsule-budget-conges-v1";

let current: AppState | null = null;
const listeners = new Set<() => void>();

function load(): AppState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return normalizeState(JSON.parse(saved));
  } catch {
    // Unreadable or blocked storage: start from the demo data.
  }
  return initialState;
}

function getSnapshot() {
  current ??= load();
  return current;
}

// The server has no localStorage: pages are prerendered with the demo data, then hydrated.
const getServerSnapshot = () => initialState;

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function setAppState(action: SetStateAction<AppState>) {
  current = typeof action === "function" ? action(getSnapshot()) : action;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  } catch {
    // Storage full or blocked: the data stays in memory for this session.
  }
  listeners.forEach((listener) => listener());
}

export function useAppState() {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return [state, setAppState] as const;
}
