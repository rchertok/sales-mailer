// src/lib/history.ts
import type { SendRecord } from "../types";
export type { SendRecord } from "../types";
import { userStorage } from "./storage";

export const HISTORY_KEY = "send_history";

export function loadHistory(): SendRecord[] {
  try {
    const raw = userStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as SendRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveHistory(rec: SendRecord) {
  const arr = loadHistory();
  userStorage.setItem(HISTORY_KEY, JSON.stringify([rec, ...arr]));
}

export function clearHistory() {
  userStorage.removeItem(HISTORY_KEY);
}
