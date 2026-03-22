import { useEffect, useState } from "react";
import { Settings2 } from "lucide-react";
import {
  requestGoogleAccessToken,
  saveTokens,
  loadTokens,
  clearTokens,
  getValidAccessToken,
  revokeGoogleToken,
} from "../lib/googleAuth";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string;
const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.send",
];

export default function Settings() {
  const [signedIn, setSignedIn] = useState<boolean>(!!getValidAccessToken());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = loadTokens();
    if (t && Date.now() < t.expires_at - 5_000) setSignedIn(true);
  }, []);

  async function signIn() {
    setError(null);
    try {
      const tokens = await requestGoogleAccessToken({ clientId: CLIENT_ID, scopes: SCOPES });
      saveTokens(tokens);
      setSignedIn(true);
    } catch (e: any) {
      setError("Sign-in failed: " + (e?.message || String(e)));
    }
  }

  function signOut() {
    revokeGoogleToken();
    clearTokens();
    setSignedIn(false);
  }

  return (
    <div className="page-enter" style={{ maxWidth: 560, margin: "0 auto" }}>
      <div className="page-title">
        <Settings2 size={24} className="page-title-icon" />
        <h1 className="mb-0">Settings</h1>
      </div>

      <div className="card">
        <div className="card-body">
          <h2 className="card-title" style={{ fontSize: "1.1rem" }}>Google Account</h2>
          <p className="card-text text-muted small">
            Connect your Gmail account so Sales Mailer can send emails on your behalf.
            Your credentials stay in this browser tab only.
          </p>

          {signedIn ? (
            <div>
              <div className="alert alert-success py-2 small mb-3">
                Connected — you can now send emails from Compose.
              </div>
              <button onClick={signOut} className="btn btn-outline-secondary">
                Disconnect Google Account
              </button>
            </div>
          ) : (
            <div>
              {error && <div className="alert alert-danger py-2 small mb-3">{error}</div>}
              <button onClick={signIn} className="btn btn-primary">
                Connect Google Account
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Export a function Compose uses
export function getGoogleAccessToken(): string | null {
  return getValidAccessToken();
}
