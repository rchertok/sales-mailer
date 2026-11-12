import { useEffect, useRef, useState } from "react";
import { Trash2, LayoutList, Table2, Plus } from "lucide-react";
import { Modal } from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import { type SimpleTemplate } from "../lib/simpleTemplate";
import { userStorage } from "../lib/storage";

const STORAGE_KEY = "simple_templates";

function loadTemplates(): SimpleTemplate[] {
  try {
    const raw = userStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SimpleTemplate[]) : [];
  } catch {
    return [];
  }
}

function saveTemplates(t: SimpleTemplate[]) {
  userStorage.setItem(STORAGE_KEY, JSON.stringify(t));
}

export default function Templates() {
  const [templates, setTemplates] = useState<SimpleTemplate[]>([]);
  const [title, setTitle] = useState("");
  const [greeting, setGreeting] = useState("Hi");
  const [intro, setIntro] = useState("Here are the options we discussed:");
  const [ctaText, setCtaText] = useState("");
  const [ctaUrl, setCtaUrl] = useState("");
  const [signature, setSignature] = useState("Best,");
  const [themeColor, setThemeColor] = useState("#1e4b7a");
  const [logoUrl, setLogoUrl] = useState("");
  const [displayMode, setDisplayMode] = useState<"cards" | "table">("cards");

  const mounted = useRef(false);

  // ?new=1 opens the form right away (used by the links on Compose)
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const fromCompose = params.get("from") === "compose";
  const [showForm, setShowForm] = useState(params.get("new") === "1");

  function closeForm() {
    setShowForm(false);
    if (params.has("new")) setParams({}, { replace: true });
  }

  useEffect(() => setTemplates(loadTemplates()), []);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    saveTemplates(templates);
  }, [templates]);

  function addTemplate(e: React.FormEvent) {
    e.preventDefault();
    const t: SimpleTemplate = {
      id: crypto.randomUUID(),
      title: title.trim() || "Untitled",
      greeting: greeting.trim() || "Hi",
      intro: intro.trim(),
      ctaText: ctaText.trim() || undefined,
      ctaUrl: ctaUrl.trim() || undefined,
      signature: signature.trim(),
      themeColor: themeColor.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
      displayMode,
    };
    // Save now, not just in the effect: we may leave this page before it runs.
    const next = [t, ...templates];
    saveTemplates(next);
    setTemplates(next);
    setTitle("");
    setShowForm(false);
    if (fromCompose) navigate("/compose", { state: { newTemplateId: t.id } });
    else if (params.has("new")) setParams({}, { replace: true });
  }

  function deleteTemplate(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="page page-enter">
      <div className="page-title">
        <h1>Email Templates</h1>
      </div>

      <Modal show={showForm} onHide={closeForm} size="xl" centered>
      <form onSubmit={addTemplate}>
        <Modal.Header closeButton>
          <Modal.Title as="h1">New Template</Modal.Title>
        </Modal.Header>
        <Modal.Body>

        <div className="row g-4 mb-4">
          <div className="col-lg-4">
            <label htmlFor="templateTitle">Template Name*</label>
            <input
              id="templateTitle"
              className="form-control"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Standard Proposal"
              required
            />
          </div>
          <div className="col-lg-4">
            <label htmlFor="greeting">Opening Greeting</label>
            <input
              id="greeting"
              className="form-control"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="Hi"
            />
            <div className="form-text">Just the greeting word. The customer's name is added for you, so "Hi" becomes "Hi Alex,".</div>
          </div>
          <div className="col-lg-4">
            <label htmlFor="themeColor">Brand Color</label>
            <input
              id="themeColor"
              type="color"
              className="form-control form-control-color"
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
              title="Pick a brand color"
            />
          </div>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-lg-6">
            <label htmlFor="intro">Intro Line</label>
            <textarea
              id="intro"
              className="form-control"
              value={intro}
              onChange={(e) => setIntro(e.target.value)}
              rows={3}
              placeholder="Here are the options we discussed:"
            />
            <div className="form-text">Shows above the products. No need to include the customer's name.</div>
          </div>
          <div className="col-lg-6">
            <label htmlFor="signature">Sign-off</label>
            <textarea
              id="signature"
              className="form-control"
              value={signature}
              onChange={(e) => setSignature(e.target.value)}
              rows={3}
              placeholder="Best,"
            />
            <div className="form-text">Goes right above your contact card, which has your name and phone number. You set that up in Settings.</div>
          </div>
        </div>

        <div className="row g-4 mb-4">
          <div className="col-lg-4">
            <label>How Products Appear</label>
            <div className="d-flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setDisplayMode("cards")}
                className={`btn d-flex align-items-center gap-2 ${displayMode === "cards" ? "btn-primary" : "btn-outline-secondary"}`}
              >
                <LayoutList size={15} />
                One by One
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode("table")}
                className={`btn d-flex align-items-center gap-2 ${displayMode === "table" ? "btn-primary" : "btn-outline-secondary"}`}
              >
                <Table2 size={15} />
                Side by Side
              </button>
            </div>
            <div className="form-text">
              {displayMode === "table"
                ? "Products are compared side by side in a table."
                : "Each product gets its own box with its price and details."}
            </div>
          </div>
          <div className="col-lg-4">
            <label htmlFor="ctaText">Extra Button (optional)</label>
            <input
              id="ctaText"
              className="form-control"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="e.g., Book a Call"
            />
            <div className="form-text">
              Most emails don't need one, since customers can just reply. Useful for something like a booking link.
            </div>
            {ctaText.trim() && (
              <>
                <input
                  className="form-control mt-2"
                  value={ctaUrl}
                  onChange={(e) => setCtaUrl(e.target.value)}
                  placeholder="https://yourcompany.com/learn-more"
                  aria-label="Button link"
                />
                <div className="form-text">The web page the button opens.</div>
              </>
            )}
          </div>
          <div className="col-lg-4">
            <label htmlFor="logoUrl">Logo (optional)</label>
            <input
              id="logoUrl"
              className="form-control"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://yourcompany.com/logo.png"
            />
            <div className="form-text">Paste a link to your logo image.</div>
          </div>
        </div>

        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-outline-secondary" onClick={closeForm}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {fromCompose ? "Save and Go Back to Compose" : "Save Template"}
          </button>
        </Modal.Footer>
      </form>
      </Modal>

      <div className="panel">
        <div className="panel-head">
          <h2>Your Templates</h2>
          <button type="button" className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={() => setShowForm(true)}>
            <Plus size={16} />
            Create New Template
          </button>
        </div>
        {templates.length === 0 ? (
          <p className="text-muted mb-0">No templates yet. Create one to use when composing emails.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Products Shown</th>
                  <th>Button</th>
                  <th>Brand Color</th>
                  <th>Logo</th>
                  <th className="text-end"></th>
                </tr>
              </thead>
              <tbody>
                {templates.map((t) => (
                  <tr key={t.id}>
                    <td className="fw-semibold">{t.title}</td>
                    <td>
                      {t.displayMode === "table"
                        ? <span className="d-flex align-items-center gap-1 text-muted"><Table2 size={14} /> Side by side</span>
                        : <span className="d-flex align-items-center gap-1 text-muted"><LayoutList size={14} /> One by one</span>}
                    </td>
                    <td className="text-muted">{t.ctaText || "None"}</td>
                    <td>
                      {t.themeColor ? (
                        <span
                          title="Brand color"
                          style={{
                            display: "inline-block", width: 20, height: 20,
                            borderRadius: 4, background: t.themeColor,
                            border: "1px solid #dee2e6", verticalAlign: "middle",
                          }}
                        />
                      ) : <span className="text-muted">None</span>}
                    </td>
                    <td className="text-muted">{t.logoUrl ? "Yes" : "No"}</td>
                    <td className="text-end">
                      <button
                        onClick={() => deleteTemplate(t.id)}
                        className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1"
                      >
                        <Trash2 size={14} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
