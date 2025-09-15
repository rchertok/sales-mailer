import { useEffect, useState } from "react";
import {
  requestGoogleAccessToken,
  saveTokens,
  loadTokens,
  clearTokens,
  getValidAccessToken,
  revokeGoogleToken,
} from "../lib/googleAuth";

const CLIENT_ID =
  "652859050425-32ct4r1145u50btmbgfes2l5uol1jovm.apps.googleusercontent.com"; // paste from Google Cloud
const SCOPES = [
  "openid",
  "email",
  "profile",
  "https://www.googleapis.com/auth/gmail.send",
];

export default function Settings() {
  const [signedIn, setSignedIn] = useState<boolean>(!!getValidAccessToken());

  useEffect(() => {
    // Poll once on mount in case the token is near expiry
    const t = loadTokens();
    if (t && Date.now() < t.expires_at - 5_000) setSignedIn(true);
  }, []);

  async function signIn() {
    try {
      const tokens = await requestGoogleAccessToken({
        clientId: CLIENT_ID,
        scopes: SCOPES,
      });
      saveTokens(tokens);
      setSignedIn(true);
      alert("Google sign-in complete. You can send emails now.");
    } catch (e: any) {
      alert("Sign-in failed: " + (e?.message || String(e)));
    }
  }

  function signOut() {
    revokeGoogleToken(); // optional revoke
    clearTokens();
    setSignedIn(false);
  }

  return (
    <div style={{ maxWidth: 700, margin: "0 auto" }}>
      <h1>Settings</h1>
      {!signedIn ? (
        <>
          <p>Sign in to send email from your Gmail account.</p>
          <button onClick={signIn} style={{ padding: "10px 14px" }}>
            Sign in with Google
          </button>
        </>
      ) : (
        <>
          <p>Signed in with Google (token stored for this tab).</p>
          <button onClick={signOut} style={{ padding: "10px 14px" }}>
            Sign out
          </button>
        </>
      )}
    </div>
  );
}

// Export a function Compose uses
export function getGoogleAccessToken(): string | null {
  return getValidAccessToken();
}
