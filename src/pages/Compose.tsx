// src/pages/Compose.tsx
import { useEffect, useMemo, useState } from "react";
import { Send } from "lucide-react";
import { Link } from "react-router-dom";
import { saveHistory } from "../lib/history";
import mjml2html from "mjml-browser";
import {
  type SimpleTemplate,
  buildMJMLFromSimpleTemplate,
  FONT_OPTIONS,
} from "../lib/simpleTemplate";
import type { Model } from "../types";
import { buildMimeEmail, toBase64Url } from "../lib/mime";
import { getGoogleAccessToken } from "./Settings";

const MODELS_KEY = "models";
const SIMPLE_TEMPLATES_KEY = "simple_templates";
const GMAIL_SEND =
  "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

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
  const [models, setModels] = useState<Model[]>([]);
  const [templates, setTemplates] = useState<SimpleTemplate[]>([]);

  const [selectedModelIds, setSelectedModelIds] = useState<string[]>([]);
  const [templateId, setTemplateId] = useState<string>("");
  const [recipientFirstName, setRecipientFirstName] = useState("");
  const [repName, setRepName] = useState("");
  const [subject, setSubject] = useState("Your options");
  const [toEmail, setToEmail] = useState("");

  const [fontFamily, setFontFamily] = useState("Inter");
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: "success" | "error"; msg: string } | null>(null);

  const selectedTemplate = useMemo(
    () => templates.find((t) => t.id === templateId) || null,
    [templates, templateId]
  );

  const selectedModels = useMemo(() => {
    const map = new Map(models.map((m) => [m.id, m]));
    return selectedModelIds.map((id) => map.get(id)).filter(Boolean) as Model[];
  }, [models, selectedModelIds]);

  useEffect(() => {
    setModels(loadModels());
    setTemplates(loadSimpleTemplates());
  }, []);

  const html = useMemo(() => {
    if (!selectedTemplate) return "<p style='font-family:sans-serif;color:#999;padding:2rem'>Select a template to see a preview.</p>";
    const mjml = buildMJMLFromSimpleTemplate(selectedTemplate, {
      recipient: { firstName: recipientFirstName || "there" },
      rep: { name: repName || "Your Sales Rep" },
      models: selectedModels,
      fontFamily,
    });
    const out = mjml2html(mjml, { minify: true });
    if (out.errors?.length) {
      return `<pre style="color:red">${out.errors.map((e) => e.formattedMessage).join("\n")}</pre>`;
    }
    return out.html;
  }, [selectedTemplate, recipientFirstName, repName, selectedModels, fontFamily]);

  function toggleModel(id: string) {
    setSelectedModelIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  }

  async function copyHtml() {
    try {
      const blob = new Blob([html], { type: "text/html" });
      await navigator.clipboard.write([new ClipboardItem({ "text/html": blob })]);
      setStatus({ type: "success", msg: "Copied! Paste it directly into Gmail." });
    } catch (err) {
      setStatus({ type: "error", msg: "Failed to copy: " + err });
    }
  }

  async function sendEmail() {
    const token = getGoogleAccessToken();
    if (!token) {
      setStatus({ type: "error", msg: "Please sign in with Google on the Settings page first." });
      return;
    }
    if (!templateId) { setStatus({ type: "error", msg: "Please choose a template." }); return; }
    if (!toEmail.trim()) { setStatus({ type: "error", msg: "Please enter a customer email address." }); return; }

    setSending(true);
    setStatus(null);

    try {
      const mime = buildMimeEmail({
        from: "",
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
        setStatus({ type: "error", msg: "Send failed: " + errText });
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

      setStatus({ type: "success", msg: `Email sent to ${toEmail.trim()}. Check your Sent folder.` });
    } catch (err) {
      setStatus({ type: "error", msg: "Unexpected error: " + err });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="row g-4 page-enter">
      {/* LEFT: controls */}
      <div className="col-md-4">
        <h2>Compose Email</h2>

        <div className="mb-3">
          <div className="d-flex align-items-center justify-content-between mb-1">
            <label htmlFor="templateSelect" className="mb-0">Email Template</label>
            {templates.length === 0 && (
              <Link to="/templates" className="small text-decoration-none" style={{ color: "var(--brand-primary)" }}>
                + Add template
              </Link>
            )}
          </div>
          {templates.length === 0 ? (
            <div className="border rounded p-3 text-muted small"
              style={{ background: "#fafafa", borderStyle: "dashed !important" }}>
              No templates yet.{" "}
              <Link to="/templates" className="text-decoration-none fw-semibold">
                Create one on the Templates page
              </Link>{" "}
              to get started.
            </div>
          ) : (
            <select
              id="templateSelect"
              className="form-select"
              value={templateId}
              onChange={(e) => setTemplateId(e.target.value)}
            >
              <option value="">— Choose a template —</option>
              {templates.map((t) => (
                <option key={t.id} value={t.id}>{t.title}</option>
              ))}
            </select>
          )}
        </div>

        <div className="mb-3">
          <label htmlFor="fontSelect">Email Font</label>
          <select
            id="fontSelect"
            className="form-select"
            value={fontFamily}
            onChange={(e) => setFontFamily(e.target.value)}
          >
            {FONT_OPTIONS.map((f) => (
              <option key={f.value} value={f.value}>{f.label}</option>
            ))}
          </select>
        </div>

        <div className="mb-3">
          <label htmlFor="toEmail">Customer Email</label>
          <input
            id="toEmail"
            type="email"
            className="form-control"
            value={toEmail}
            onChange={(e) => setToEmail(e.target.value)}
            placeholder="customer@example.com"
          />
        </div>

        <div className="mb-3">
          <label htmlFor="subject">Subject Line</label>
          <input
            id="subject"
            className="form-control"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Your options"
          />
        </div>

        <div className="row g-3 mb-3">
          <div className="col-6">
            <label htmlFor="recipientFirstName">Customer First Name</label>
            <input
              id="recipientFirstName"
              className="form-control"
              value={recipientFirstName}
              onChange={(e) => setRecipientFirstName(e.target.value)}
              placeholder="e.g., Alex"
            />
          </div>
          <div className="col-6">
            <label htmlFor="repName">Your Name</label>
            <input
              id="repName"
              className="form-control"
              value={repName}
              onChange={(e) => setRepName(e.target.value)}
              placeholder="e.g., Sam Rivera"
            />
          </div>
        </div>

        <div className="mb-3">
          <label className="d-block mb-1">Products to Include</label>
          <div className="model-picker">
            {models.length === 0 ? (
              <p className="text-muted small mb-0 p-1">
                No products yet — add some on the Products page.
              </p>
            ) : (
              models.map((m) => (
                <label key={m.id} className="d-flex align-items-center gap-2 mb-0">
                  <input
                    type="checkbox"
                    className="form-check-input flex-shrink-0"
                    checked={selectedModelIds.includes(m.id)}
                    onChange={() => toggleModel(m.id)}
                  />
                  <span>{m.name}</span>
                </label>
              ))
            )}
          </div>
        </div>

        {status && (
          <div className={`alert ${status.type === "success" ? "alert-success" : "alert-danger"} py-2 small mb-3`}>
            {status.msg}
          </div>
        )}

        <div className="d-flex gap-2">
          <button
            onClick={sendEmail}
            disabled={sending}
            className="btn btn-primary"
          >
            {sending ? (
              <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Sending…</>
            ) : <><Send size={15} className="me-2" />Send Email</>}
          </button>
          <button onClick={copyHtml} className="btn btn-outline-secondary">
            Copy HTML
          </button>
        </div>
      </div>

      {/* RIGHT: preview */}
      <div className="col-md-8">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <label className="mb-0 fw-semibold text-muted">Live Preview</label>
          {selectedModels.length > 0 && (
            <span className="badge bg-secondary">{selectedModels.length} product{selectedModels.length !== 1 ? "s" : ""}</span>
          )}
        </div>
        <iframe
          title="Email preview"
          className="email-preview-frame"
          srcDoc={html}
        />
      </div>
    </div>
  );
}
