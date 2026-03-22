import { useEffect, useRef, useState } from "react";
import { FileText, Trash2, LayoutList, Table2 } from "lucide-react";
import { type SimpleTemplate } from "../lib/simpleTemplate";

const STORAGE_KEY = "simple_templates";

function loadTemplates(): SimpleTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SimpleTemplate[]) : [];
  } catch {
    return [];
  }
}

function saveTemplates(t: SimpleTemplate[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(t));
}

export default function Templates() {
  const [templates, setTemplates] = useState<SimpleTemplate[]>([]);
  const [title, setTitle] = useState("");
  const [greeting, setGreeting] = useState("Hi");
  const [intro, setIntro] = useState("Here are the options we discussed:");
  const [ctaText, setCtaText] = useState("");
  const [signature, setSignature] = useState("Best,\nYour Sales Rep");
  const [themeColor, setThemeColor] = useState("#0ea5e9");
  const [logoUrl, setLogoUrl] = useState("");
  const [displayMode, setDisplayMode] = useState<"cards" | "table">("cards");

  const mounted = useRef(false);

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
      signature: signature.trim(),
      themeColor: themeColor.trim() || undefined,
      logoUrl: logoUrl.trim() || undefined,
      displayMode,
    };
    setTemplates((prev) => [t, ...prev]);
    setTitle("");
  }

  function deleteTemplate(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="page-enter" style={{ maxWidth: 900, margin: "0 auto" }}>
      <div className="page-title">
        <FileText size={24} className="page-title-icon" />
        <h1 className="mb-0">Email Templates</h1>
      </div>

      <form onSubmit={addTemplate} className="mb-4">
        {/* Row 1: name */}
        <div className="mb-3">
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

        {/* Row 2: greeting / brand color */}
        <div className="row g-3 mb-3">
          <div className="col-sm-6">
            <label htmlFor="greeting">Opening Greeting</label>
            <input
              id="greeting"
              className="form-control"
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="Hi"
            />
            <div className="form-text">e.g. "Hi Alex,"</div>
          </div>
          <div className="col-sm-6">
            <label htmlFor="themeColor">Brand Color</label>
            <div className="d-flex align-items-center gap-2">
              <input
                id="themeColor"
                type="color"
                className="form-control form-control-color"
                value={themeColor}
                onChange={(e) => setThemeColor(e.target.value)}
                title="Pick a brand color"
              />
              <span className="text-muted small">{themeColor}</span>
            </div>
          </div>
        </div>

        {/* Row 3: intro */}
        <div className="mb-3">
          <label htmlFor="intro">Intro Line</label>
          <textarea
            id="intro"
            className="form-control"
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            rows={2}
            placeholder="Here are the options we discussed:"
          />
          <div className="form-text">Appears above the product list in the email.</div>
        </div>

        {/* Row 4: display mode */}
        <div className="mb-3">
          <label className="d-block mb-2">Product Display</label>
          <div className="d-flex gap-2">
            <button
              type="button"
              onClick={() => setDisplayMode("cards")}
              className={`btn btn-sm d-flex align-items-center gap-2 ${displayMode === "cards" ? "btn-primary" : "btn-outline-secondary"}`}
            >
              <LayoutList size={15} />
              Individual Cards
            </button>
            <button
              type="button"
              onClick={() => setDisplayMode("table")}
              className={`btn btn-sm d-flex align-items-center gap-2 ${displayMode === "table" ? "btn-primary" : "btn-outline-secondary"}`}
            >
              <Table2 size={15} />
              Comparison Table
            </button>
          </div>
          <div className="form-text">
            {displayMode === "table"
              ? "Products appear side-by-side in a comparison table."
              : "Each product appears as its own block with pricing."}
          </div>
        </div>

        {/* Row 5: CTA + logo */}
        <div className="row g-3 mb-3">
          <div className="col-sm-6">
            <label htmlFor="ctaText">Button Text (optional)</label>
            <input
              id="ctaText"
              className="form-control"
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="View details"
            />
            <div className="form-text">
              {displayMode === "table"
                ? "Adds a single CTA button below the table."
                : "Adds a button under each product card."}
            </div>
          </div>
          <div className="col-sm-6">
            <label htmlFor="logoUrl">Logo URL (optional)</label>
            <input
              id="logoUrl"
              className="form-control"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://yourcompany.com/logo.png"
            />
          </div>
        </div>

        {/* Row 6: signature */}
        <div className="mb-3">
          <label htmlFor="signature">Email Signature</label>
          <textarea
            id="signature"
            className="form-control"
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            rows={3}
            placeholder={"Best,\nYour Name"}
          />
        </div>

        <button type="submit" className="btn btn-primary">
          Save Template
        </button>
      </form>

      {templates.length === 0 ? (
        <p className="text-muted">No templates yet. Create one above to use when composing emails.</p>
      ) : (
        <table className="table table-hover align-middle">
          <thead className="table-light">
            <tr>
              <th>Name</th>
              <th>Layout</th>
              <th>Button Text</th>
              <th>Brand Color</th>
              <th>Logo</th>
              <th className="text-end">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id}>
                <td className="fw-semibold">{t.title}</td>
                <td>
                  {t.displayMode === "table"
                    ? <span className="d-flex align-items-center gap-1 text-muted"><Table2 size={13} /> Table</span>
                    : <span className="d-flex align-items-center gap-1 text-muted"><LayoutList size={13} /> Cards</span>}
                </td>
                <td className="text-muted">{t.ctaText || "—"}</td>
                <td>
                  {t.themeColor ? (
                    <span className="d-flex align-items-center gap-2">
                      <span style={{
                        display: "inline-block", width: 16, height: 16,
                        borderRadius: 3, background: t.themeColor,
                        border: "1px solid #dee2e6",
                      }} />
                      <span className="text-muted small">{t.themeColor}</span>
                    </span>
                  ) : "—"}
                </td>
                <td className="text-muted">{t.logoUrl ? "Yes" : "—"}</td>
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
      )}
    </div>
  );
}
