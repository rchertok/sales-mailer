import { useState } from "react";
import { useAccount } from "../lib/AccountContext";
import { loadRepProfile, saveRepProfile } from "../lib/repProfile";
import type { RepProfile } from "../lib/simpleTemplate";

export default function Settings() {
  const { account, signOut } = useAccount();
  const [profile, setProfile] = useState<RepProfile>(loadRepProfile);
  const [saved, setSaved] = useState(false);

  function set<K extends keyof RepProfile>(key: K, value: string) {
    setProfile((p) => ({ ...p, [key]: value }));
    setSaved(false);
  }

  function onSave(e: React.FormEvent) {
    e.preventDefault();
    const clean: RepProfile = Object.fromEntries(
      Object.entries(profile).map(([k, v]) => [k, typeof v === "string" ? v.trim() : v])
    );
    saveRepProfile(clean);
    setProfile(clean);
    setSaved(true);
  }

  return (
    <div className="page page-enter">
      <div className="page-title">
        <h1>Settings</h1>
      </div>

      <div className="row g-4">
        <div className="col-lg-7">
          <form className="panel" onSubmit={onSave}>
            <h2>Your Contact Card</h2>
            <p className="text-muted">
              This goes at the bottom of every email so customers know who you are and how to reach you.
            </p>
            <div className="row g-3 mb-3">
              <div className="col-sm-6">
                <label htmlFor="repName">Your Name</label>
                <input id="repName" className="form-control" value={profile.name ?? ""}
                  onChange={(e) => set("name", e.target.value)} placeholder="Sam Rivera" />
              </div>
              <div className="col-sm-6">
                <label htmlFor="repTitle">Job Title</label>
                <input id="repTitle" className="form-control" value={profile.title ?? ""}
                  onChange={(e) => set("title", e.target.value)} placeholder="Account Manager" />
              </div>
              <div className="col-sm-6">
                <label htmlFor="repCompany">Company</label>
                <input id="repCompany" className="form-control" value={profile.company ?? ""}
                  onChange={(e) => set("company", e.target.value)} placeholder="Acme Office Supply" />
              </div>
              <div className="col-sm-6">
                <label htmlFor="repPhone">Phone</label>
                <input id="repPhone" type="tel" className="form-control" value={profile.phone ?? ""}
                  onChange={(e) => set("phone", e.target.value)} placeholder="(555) 201-3344" />
                <div className="form-text">If you add one, emails say "or call me at" this number.</div>
              </div>
              <div className="col-sm-6">
                <label htmlFor="repEmail">Email</label>
                <input id="repEmail" type="email" className="form-control" value={profile.email ?? ""}
                  onChange={(e) => set("email", e.target.value)} placeholder="sam@acmeoffice.com" />
              </div>
              <div className="col-sm-6">
                <label htmlFor="repPhoto">Photo</label>
                <input id="repPhoto" className="form-control" value={profile.photoUrl ?? ""}
                  onChange={(e) => set("photoUrl", e.target.value)} placeholder="Link to a photo of you" />
                <div className="form-text">Starts as your Google photo. Clear it to leave the photo out.</div>
              </div>
            </div>
            <div className="d-flex align-items-center gap-3">
              <button type="submit" className="btn btn-primary">Save Contact Card</button>
              {saved && <span className="text-muted">Saved.</span>}
            </div>
          </form>
        </div>

        <div className="col-lg-5">
          <div className="panel">
            <h2>Your Account</h2>
            <div className="d-flex align-items-center gap-3 mb-3">
              {account?.picture && (
                <img src={account.picture} alt="" width={44} height={44}
                  style={{ borderRadius: "50%" }} referrerPolicy="no-referrer" />
              )}
              <div>
                {account?.name && <div className="fw-semibold">{account.name}</div>}
                <div className="text-muted">{account?.email}</div>
              </div>
            </div>
            <p className="text-muted">
              Emails you send from Compose go out from this Gmail account. Your products,
              templates and sent emails are saved for this account on this computer.
            </p>
            <button onClick={signOut} className="btn btn-outline-secondary">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
