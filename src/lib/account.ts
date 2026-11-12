// src/lib/account.ts
// The signed-in Google account. Everything in the app requires one.
import {
  requestGoogleAccessToken,
  saveTokens,
  clearTokens,
  getValidAccessToken,
  revokeGoogleToken,
} from "./googleAuth";

export type Account = {
  id: string;      // Google's stable account id
  email: string;
  name?: string;
  picture?: string;
};

const ACCOUNT_KEY = "account_v1";
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.send",
];

// Data saved before accounts existed; handed to the first account that signs in.
const LEGACY_KEYS = ["models", "simple_templates", "compose_draft", "send_history"];
const LEGACY_CLAIMED_KEY = "legacy_data_claimed";

export function getAccount(): Account | null {
  try {
    const raw = localStorage.getItem(ACCOUNT_KEY);
    return raw ? (JSON.parse(raw) as Account) : null;
  } catch {
    return null;
  }
}

function claimLegacyData(account: Account) {
  if (localStorage.getItem(LEGACY_CLAIMED_KEY)) return;
  for (const key of LEGACY_KEYS) {
    const old = localStorage.getItem(key);
    const mine = `${account.id}:${key}`;
    if (old !== null && localStorage.getItem(mine) === null) {
      localStorage.setItem(mine, old);
    }
    localStorage.removeItem(key);
  }
  localStorage.setItem(LEGACY_CLAIMED_KEY, account.id);
}

export async function signInWithGoogle(): Promise<Account> {
  if (!CLIENT_ID) throw new Error("missing_client_id");
  const tokens = await requestGoogleAccessToken({ clientId: CLIENT_ID, scopes: SCOPES });
  saveTokens(tokens);

  const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!res.ok) throw new Error("userinfo_failed");
  const info = await res.json();

  const account: Account = {
    id: info.sub,
    email: info.email,
    name: info.name,
    picture: info.picture,
  };
  localStorage.setItem(ACCOUNT_KEY, JSON.stringify(account));
  claimLegacyData(account);
  return account;
}

export function signOut() {
  revokeGoogleToken();
  clearTokens();
  localStorage.removeItem(ACCOUNT_KEY);
}

/**
 * A Gmail access token for sending. Google's tokens last about an hour, so if
 * the current one has run out this quietly asks Google for a new one.
 */
export async function getSendToken(): Promise<string> {
  const existing = getValidAccessToken();
  if (existing) return existing;
  const account = getAccount();
  const tokens = await requestGoogleAccessToken({
    clientId: CLIENT_ID,
    scopes: SCOPES,
    prompt: "",
    hint: account?.email,
  });
  saveTokens(tokens);
  return tokens.access_token;
}
