// src/lib/repProfile.ts
// The rep's contact card details, saved per account.
import type { RepProfile } from "./simpleTemplate";
import { userStorage } from "./storage";
import { getAccount } from "./account";

const KEY = "rep_profile";

export function loadRepProfile(): RepProfile {
  const account = getAccount();
  const defaults: RepProfile = {
    name: account?.name,
    email: account?.email,
    photoUrl: account?.picture,
  };
  try {
    const raw = userStorage.getItem(KEY);
    return raw ? { ...defaults, ...(JSON.parse(raw) as RepProfile) } : defaults;
  } catch {
    return defaults;
  }
}

export function saveRepProfile(p: RepProfile) {
  userStorage.setItem(KEY, JSON.stringify(p));
}
