import { useEffect, useState } from "react";
import type { SimpleTemplate } from "../lib/simpleTemplate";

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
  const [ctaText, setCtaText] = useState("View details");
  const [signature, setSignature] = useState("Best,\nYour Sales Rep");
  const [themeColor, setThemeColor] = useState("#0ea5e9");
  const [logoUrl, setLogoUrl] = useState("");

  useEffect(() => setTemplates(loadTemplates()), []);
  useEffect(() => saveTemplates(templates), [templates]);

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
    };
    setTemplates((prev) => [t, ...prev]);
    // clear just the title so it's obvious it saved
    setTitle("");
  }
  function deleteTemplate(id: string) {
    setTemplates((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1>Templates (Simple)</h1>

      <form
        onSubmit={addTemplate}
        style={{ display: "grid", gap: 12, marginBottom: 20 }}
      >
        <label>
          Title*
          <br />
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: "100%", padding: 8 }}
            required
          />
        </label>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <label>
            Greeting
            <br />
            <input
              value={greeting}
              onChange={(e) => setGreeting(e.target.value)}
              placeholder="Hi"
              style={{ width: "100%", padding: 8 }}
            />
          </label>
          <label>
            Theme Color
            <br />
            <input
              type="color"
              value={themeColor}
              onChange={(e) => setThemeColor(e.target.value)}
            />
          </label>
        </div>

        <label>
          Intro
          <br />
          <textarea
            value={intro}
            onChange={(e) => setIntro(e.target.value)}
            rows={2}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}
        >
          <label>
            CTA Button Text (optional)
            <br />
            <input
              value={ctaText}
              onChange={(e) => setCtaText(e.target.value)}
              placeholder="View details"
              style={{ width: "100%", padding: 8 }}
            />
          </label>
          <label>
            Logo URL (optional)
            <br />
            <input
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://..."
              style={{ width: "100%", padding: 8 }}
            />
          </label>
        </div>

        <label>
          Signature
          <br />
          <textarea
            value={signature}
            onChange={(e) => setSignature(e.target.value)}
            rows={3}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <button type="submit" style={{ padding: "10px 14px" }}>
          Save Template
        </button>
      </form>

      {templates.length === 0 ? (
        <p>No templates yet. Add one above!</p>
      ) : (
        <table
          width="100%"
          cellPadding={8}
          style={{ borderCollapse: "collapse" }}
        >
          <thead>
            <tr style={{ background: "#f7f7f7" }}>
              <th align="left">Title</th>
              <th align="left">Greeting</th>
              <th align="left">CTA</th>
              <th align="left">Theme</th>
              <th align="left">Logo</th>
              <th align="left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {templates.map((t) => (
              <tr key={t.id} style={{ borderTop: "1px solid #eee" }}>
                <td>{t.title}</td>
                <td>{t.greeting}</td>
                <td>{t.ctaText || "—"}</td>
                <td>{t.themeColor || "—"}</td>
                <td>{t.logoUrl ? "Yes" : "—"}</td>
                <td>
                  <button
                    onClick={() => deleteTemplate(t.id)}
                    style={{ padding: "6px 10px" }}
                  >
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
