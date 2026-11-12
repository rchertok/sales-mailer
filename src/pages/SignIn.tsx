import { useState } from "react";
import Landing from "./Landing";
import { signInWithGoogle } from "../lib/account";
import { useAccount } from "../lib/AccountContext";

function friendlyError(e: unknown): string {
  const code = e instanceof Error ? e.message : String(e);
  if (code === "popup_closed" || code === "access_denied")
    return "Sign-in was cancelled. Please try again.";
  if (code === "popup_failed_to_open")
    return "Your browser blocked the Google sign-in window. Allow pop-ups for this site and try again.";
  if (code.includes("not loaded"))
    return "Google sign-in is still loading. Wait a moment and try again.";
  if (code === "missing_client_id")
    return "Google sign-in isn't set up for this app yet.";
  return "Couldn't sign in with Google. Please try again.";
}

export default function SignIn() {
  const { setAccount } = useAccount();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSignIn() {
    setBusy(true);
    setError(null);
    try {
      setAccount(await signInWithGoogle());
    } catch (e) {
      console.error(e);
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Landing
      actions={
        <>
          {error && <div className="alert alert-danger py-2 mb-3" style={{ maxWidth: 560 }}>{error}</div>}
          <button onClick={onSignIn} disabled={busy} className="btn btn-primary px-4">
            {busy ? "Signing in…" : "Sign in with Google"}
          </button>
          <p className="text-muted mt-3 mb-0">
            Use the Google account you send work email from.
          </p>
        </>
      }
    />
  );
}
