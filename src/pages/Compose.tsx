// src/pages/Compose.tsx
import { useEffect, useMemo, useState } from "react";
import { saveHistory } from "../lib/history";
import mjml2html from "mjml-browser";
import {
  type SimpleTemplate,
  buildMJMLFromSimpleTemplate,
} from "../lib/simpleTemplate";
import { buildMimeEmail, toBase64Url } from "../lib/mime";
import { getGoogleAccessToken } from "./Settings";

const MODELS_KEY = "models";
const SIMPLE_TEMPLATES_KEY = "simple_templates";
const GMAIL_SEND =
  "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

// ----- Types for models (match your Models page) -----
type Pricing =
  | { kind: "purchase"; price?: number }
  | { kind: "lease"; monthly: number; termMonths: number; upfront?: number };

type Model = {
  id: string;
  name: string;
  skuInternal?: string;
  hideSku?: boolean;
  pricing: Pricing;
  notesInternal?: string;
};

// ----- Local loaders -----
function loadModels(): Model[] {
  try {
    const raw = localStorage.getItem(MODELS_KEY);
    return raw ? (JSON.parse(raw) as Model[]) : [];
  } catch {
    return [];
  }
}

function loadSimpleTemplates(): SimpleTemplate[] {
  try {
    const raw = localStorage.getItem(SIMPLE_TEMPLATES_KEY);
    return raw ? (JSON.parse(raw) as SimpleTemplate[]) : [];
  } catch {
    return [];
  }
}

export default function Compose() {
  // Data
  const [models, setModels] = useState<Model[]>([]);
  const [templates, setTemplates] = useState<SimpleTemplate[]>([]);

  // Selections / inputs
  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [recipientFirstName, setRecipientFirstName] = useState("");
  const [repName, setRepName] = useState("");
  const [subject, setSubject] = useState("Your options");
  const [toEmail, setToEmail] = useState("");

  // Derived
  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId) || null,
    [templates, templateId]
  );

  const selectedModels = useMemo(() => {
    const map = new Map(models.map((m) => [m.id, m]));
    return selectedModelIds.map((id) => map.get(id)).filter(Boolean) as Model[];
  }, [models, selectedModelIds]);

  // Load data once
  useEffect(() => {
    setModels(loadModels());
    setTemplates(loadSimpleTemplates());
  }, []);

  // Build final HTML (SimpleTemplate -> MJML -> HTML)
  const html = useMemo(() => {
    if (!selectedTemplate) return "<p>Select a template.</p>";
    const mjml = buildMJMLFromSimpleTemplate(selectedTemplate, {
      recipient: { firstName: recipientFirstName || "there" },
      rep: { name: repName || "Your Sales Rep" },
      models: selectedModels,
    });
    const out = mjml2html(mjml, { minify: true });
    if (out.errors?.length) {
      return `<pre style="color:red">${out.errors
        .map((e) => e.formattedMessage)
        .join("\n")}</pre>`;
    }
    return out.html;
  }, [selectedTemplate, recipientFirstName, repName, selectedModels]);

  // Toggle model checkbox
  function toggleModel(id: string) {
    setSelectedModelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  // Copy as rich HTML (so Gmail pastes styled)
  function copyHtml() {
    const type = "text/html";
    const blob = new Blob([html], { type });
    const data = [new ClipboardItem({ [type]: blob })];
    navigator.clipboard.write(data).then(
      () => alert("Rich HTML copied! Paste it into Gmail."),
      (err) => alert("Failed to copy: " + err)
    );
  }
  type SendRecord = {
    id: string;
    at: string;
    to: string;
    subject: string;
    templateTitle: string;
    modelNames: string[];
  };
  const HISTORY_KEY = "send_history";

  function saveHistory(rec: SendRecord) {
    const raw = localStorage.getItem(HISTORY_KEY);
    const arr = raw ? (JSON.parse(raw) as SendRecord[]) : [];
    localStorage.setItem(HISTORY_KEY, JSON.stringify([rec, ...arr]));
  }

  // Send via Gmail API
  async function sendEmail() {
    const token = getGoogleAccessToken();
    if (!token) {
      alert("Please sign in with Google on the Settings page first.");
      return;
    }
    if (!templateId) return alert("Choose a template.");
    if (!toEmail.trim()) return alert("Enter a recipient email.");
    if (!html) return alert("No HTML generated yet.");

    const mime = buildMimeEmail({
      from: "", // Gmail sets From: me
      to: toEmail.trim(),
      subject: subject.trim() || "Your options",
      html,
    });
    const raw = toBase64Url(mime);

    const res = await fetch(GMAIL_SEND, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ raw }),
    });

    if (!res.ok) {
      const errText = await res.text();
      alert("Send failed: " + errText);
      return;
    }
    saveHistory({
      id: crypto.randomUUID(),
      at: new Date().toISOString(),
      to: toEmail.trim(),
      subject: subject.trim(),
      templateTitle: selectedTemplate?.title || "(untitled)",
      modelNames: selectedModels.map((m) => m.name),
    });

    alert("Sent! Check your Sent folder.");
  }

  return (
    <div style={{ display: "grid", gridTemplateColumns: "360px 1fr", gap: 16 }}>
      {/* LEFT: controls */}
      <div>
        <h2>Compose</h2>

        <label>
          Template
          <br />
          <select
            value={templateId}
            onChange={(e) => setTemplateId(e.target.value)}
            style={{ width: "100%", padding: 8, marginBottom: 12 }}
          >
            <option value="">-- Choose template --</option>
            {templates.map((t) => (
              <option key={t.id} value={t.id}>
                {t.title}
              </option>
            ))}
          </select>
        </label>

        <label>
          To
          <br />
          <input
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
            placeholder="customer@example.com"
            style={{ width: "100%", padding: 8, marginBottom: 12 }}
          />
        </label>

        <label>
          Subject
          <br />
          <input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Your options"
            style={{ width: "100%", padding: 8, marginBottom: 12 }}
          />
        </label>

        <label>
          Recipient first name
          <br />
          <input
            value={recipientFirstName}
            onChange={(e) => setRecipientFirstName(e.target.value)}
            placeholder="e.g., Alex"
            style={{ width: "100%", padding: 8, marginBottom: 12 }}
          />
        </label>

        <label>
          Your name (rep)
          <br />
          <input
            value={repName}
            onChange={(e) => setRepName(e.target.value)}
            placeholder="e.g., Sam Rivera"
            style={{ width: "100%", padding: 8, marginBottom: 12 }}
          />
        </label>

        <div
          style={{
            border: "1px solid #ddd",
            padding: 8,
            borderRadius: 6,
            marginBottom: 12,
          }}
        >
          <b>Pick models</b>
          <div style={{ maxHeight: 240, overflow: "auto", marginTop: 8 }}>
            {models.length === 0 ? (
              <p style={{ color: "#999" }}>
                No models yet. Add some on the Models page.
              </p>
            ) : (
              models.map((m) => (
                <label
                  key={m.id}
                  style={{ display: "flex", gap: 8, alignItems: "center" }}
                >
                  <input
                    type="checkbox"
                    checked={selectedModelIds.includes(m.id)}
                    onChange={() => toggleModel(m.id)}
                  />
                  <span>{m.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={sendEmail} style={{ padding: "10px 14px" }}>
            Send (Gmail)
          </button>
          <button onClick={copyHtml} style={{ padding: "10px 14px" }}>
            Copy as Rich
          </button>
        </div>
      </div>

      {/* RIGHT: preview */}
      <div>
        <div style={{ marginBottom: 8, color: "#666" }}>
          <b>Preview</b> (generated from your simple template)
        </div>
        <iframe
          title="preview"
          style={{
            width: "100%",
            height: "80vh",
            border: "1px solid #ddd",
            borderRadius: 6,
            background: "#fff",
          }}
          srcDoc={html}
        />
      </div>
    </div>
  );
}
