// src/lib/googleAuth.ts
export type GoogleTokenBundle = {
  access_token: string;
  expires_at: number; // epoch ms
  scope: string;
  token_type: "Bearer";
};

declare global {
  interface Window {
    google?: any;
  }
}

const STORAGE_KEY = "google_tokens_v1";

export function saveTokens(t: GoogleTokenBundle) {
  sessionStorage.setItem(STORAGE_KEY, JSON.stringify(t));
}
export function loadTokens(): GoogleTokenBundle | null {
  const raw = sessionStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try { return JSON.parse(raw) as GoogleTokenBundle; } catch { return null; }
}
export function clearTokens() {
  sessionStorage.removeItem(STORAGE_KEY);
}

export function getValidAccessToken(): string | null {
  const t = loadTokens();
  if (!t) return null;
  if (Date.now() >= t.expires_at - 5_000) return null; // expired/expiring
  return t.access_token;
}

/** Start a GIS token request (popup) and resolve with tokens */
export function requestGoogleAccessToken({
  clientId,
  scopes,
}: {
  clientId: string;
  scopes: string[];
}): Promise<GoogleTokenBundle> {
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.oauth2) {
      reject(new Error("Google Identity Services not loaded"));
      return;
    }

    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: scopes.join(" "),
      prompt: "consent", // ensures the account chooser the first time
      callback: (response: any) => {
        if (response.error) {
          reject(new Error(response.error));
          return;
        }
        // GIS returns access_token and expires_in (seconds)
        const token: GoogleTokenBundle = {
          access_token: response.access_token,
          expires_at: Date.now() + (response.expires_in ?? 3600) * 1000,
          scope: response.scope,
          token_type: "Bearer",
        };
        resolve(token);
      },
    });

    client.requestAccessToken();
  });
}

/** Optional revoke */
export function revokeGoogleToken() {
  const t = loadTokens();
  if (!t || !window.google?.accounts?.oauth2) return;
  window.google.accounts.oauth2.revoke(t.access_token, () => {});
  clearTokens();
}
