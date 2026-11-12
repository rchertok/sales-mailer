// src/lib/storage.ts
// localStorage, but kept separate for each signed-in account.
import { getAccount } from "./account";

function scoped(key: string) {
  const account = getAccount();
  if (!account) throw new Error("Not signed in");
  return `${account.id}:${key}`;
}

export const userStorage = {
  getItem: (key: string) => localStorage.getItem(scoped(key)),
  setItem: (key: string, value: string) => localStorage.setItem(scoped(key), value),
  removeItem: (key: string) => localStorage.removeItem(scoped(key)),
};
