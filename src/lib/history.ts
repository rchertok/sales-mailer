// src/lib/history.ts
export type SendRecord = {
  id: string;
  at: string;            // ISO timestamp
  to: string;
  subject: string;
  templateTitle: string;
  modelNames: string[];
};

export const HISTORY_KEY = "send_history";

export function loadHistory(): SendRecord[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as SendRecord[]) : [];
  } catch {
    return [];
  }
}

export function saveHistory(rec: SendRecord) {
  const arr = loadHistory();
  localStorage.setItem(HISTORY_KEY, JSON.stringify([rec, ...arr]));
}

export function clearHistory() {
  localStorage.removeItem(HISTORY_KEY);
}
