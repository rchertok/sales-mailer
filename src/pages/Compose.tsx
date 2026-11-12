// src/pages/Compose.tsx
import { useEffect, useMemo, useState } from "react";
import { Send, Copy, Star } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { saveHistory } from "../lib/history";
import mjml2html from "mjml-browser";
import {
  type SimpleTemplate,
  buildMJMLFromSimpleTemplate,
  FONT_OPTIONS,
} from "../lib/simpleTemplate";
import type { Model } from "../types";
import { buildMimeEmail, toBase64Url } from "../lib/mime";
import { getSendToken } from "../lib/account";
import { userStorage } from "../lib/storage";
import { loadRepProfile } from "../lib/repProfile";

const MODELS_KEY = "models";
const SIMPLE_TEMPLATES_KEY = "simple_templates";
const DRAFT_KEY = "compose_draft";
const GMAIL_SEND =
  "https://gmail.googleapis.com/gmail/v1/users/me/messages/send";

function loadModels(): Model[] {
  try {
    const raw = userStorage.getItem(MODELS_KEY);
    return raw ? (JSON.parse(raw) as Model[]) : [];
  } catch {
    return [];
  }
}

function loadSimpleTemplates(): SimpleTemplate[] {
  try {
    const raw = userStorage.getItem(SIMPLE_TEMPLATES_KEY);
    return raw ? (JSON.parse(raw) as SimpleTemplate[]) : [];
  } catch {
    return [];
  }
}

type ComposeDraft = {
  selectedModelIds: string[];
  templateId: string;
  recipientFirstName: string;
  note: string;
  recommendedId: string;
  validUntil: string;
  subject: string;
  toEmail: string;
  fontFamily: string;
};

function loadDraft(): Partial<ComposeDraft> {
  try {
    const raw = userStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Partial<ComposeDraft>) : {};
  } catch {
    return {};
  }
}

export default function Compose() {
  // Read the saved draft once so in-progress work survives switching pages.
  const [draft] = useState(loadDraft);

  const [models, setModels] = useState<Model[]>([]);
  const [templates, setTemplates] = useState<SimpleTemplate[]>([]);

  const [selectedModelIds, setSelectedModelIds] = useState<string[]>(draft.selectedModelIds ?? []);
  const [templateId, setTemplateId] = useState<string>(draft.templateId ?? "");
  const [recipientFirstName, setRecipientFirstName] = useState(draft.recipientFirstName ?? "");
  const [note, setNote] = useState(draft.note ?? "");
  const [recommendedId, setRecommendedId] = useState(draft.recommendedId ?? "");
  const [validUntil, setValidUntil] = useState(draft.validUntil ?? "");
  const [rep] = useState(loadRepProfile);
  const [subject, setSubject] = useState(draft.subject ?? "Your options");
  const [toEmail, setToEmail] = useState(draft.toEmail ?? "");

  const [fontFamily, setFontFamily] = useState(draft.fontFamily ?? "Inter");
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

  // Coming back after creating a product or template from here: select it.
  const location = useLocation();
  const navigate = useNavigate();
  useEffect(() => {
    const st = location.state as { newProductId?: string; newTemplateId?: string } | null;
    if (!st) return;
    if (st.newTemplateId) setTemplateId(st.newTemplateId);
    if (st.newProductId) {
      const id = st.newProductId;
      setSelectedModelIds((prev) => (prev.includes(id) ? prev : [...prev, id]));
    }
    navigate(location.pathname, { replace: true, state: null });
  }, [location, navigate]);

  useEffect(() => {
    const d: ComposeDraft = {
      selectedModelIds,
      templateId,
      recipientFirstName,
      note,
      recommendedId,
      validUntil,
      subject,
      toEmail,
      fontFamily,
    };
    try {
      userStorage.setItem(DRAFT_KEY, JSON.stringify(d));
    } catch {
      // storage full or unavailable; draft just won't persist
    }
  }, [selectedModelIds, templateId, recipientFirstName, note, recommendedId, validUntil, subject, toEmail, fontFamily]);

  const html = useMemo(() => {
    if (!selectedTemplate) return "<p style='font-family:sans-serif;color:#999;padding:2rem'>Select a template to see a preview.</p>";
    const mjml = buildMJMLFromSimpleTemplate(selectedTemplate, {
      recipient: { firstName: recipientFirstName || "there" },
      rep,
      models: selectedModels,
      fontFamily,
      note,
      recommendedId,
      validUntil,
    });
    const out = mjml2html(mjml, { minify: true });
    if (out.errors?.length) {
      return `<pre style="color:red">${out.errors.map((e) => e.formattedMessage).join("\n")}</pre>`;
    }
    return out.html;
  }, [selectedTemplate, recipientFirstName, rep, selectedModels, fontFamily, note, recommendedId, validUntil]);

  function toggleModel(id: string) {
    setSelectedModelIds((prev) => {
      if (prev.includes(id)) {
        if (recommendedId === id) setRecommendedId("");
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  }

  async function copyHtml() {
    try {
      const blob = new Blob([html], { type: "text/html" });
      await navigator.clipboard.write([new ClipboardItem({ "text/html": blob })]);
      setStatus({ type: "success", msg: "Copied. Paste it straight into a new Gmail message." });
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", msg: "Couldn't copy the email. Please try again." });
    }
  }

  async function sendEmail() {
    if (!templateId) { setStatus({ type: "error", msg: "Please choose a template." }); return; }
    if (!toEmail.trim()) { setStatus({ type: "error", msg: "Please enter a customer email address." }); return; }

    setSending(true);
    setStatus(null);

    let token: string;
    try {
      token = await getSendToken();
    } catch (err) {
      console.error(err);
      setStatus({ type: "error", msg: "Google needs you to sign in again before sending. Please try again." });
      setSending(false);
      return;
    }

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
        console.error(await res.text());
        setStatus({
          type: "error",
          msg: res.status === 401
            ? "Your Google sign-in has expired. Sign out and back in, then try again."
            : "The email couldn't be sent. Please try again.",
        });
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
      console.error(err);
      setStatus({ type: "error", msg: "Something went wrong while sending. Please try again." });
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="page page-enter">
      <div className="page-title">
        <h1>Compose Email</h1>
      </div>

      <div className="row g-4">
        {/* LEFT: email details */}
        <div className="col-lg-5 col-xl-4">
          <div className="panel mb-0">
            <div className="mb-3">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label htmlFor="templateSelect" className="mb-0">Email Template</label>
                <Link to="/templates?new=1&from=compose" className="text-decoration-none fw-semibold">
                  + New template
                </Link>
              </div>
              {templates.length === 0 ? (
                <div className="border rounded p-3 text-muted" style={{ background: "#fff" }}>
                  No templates yet.{" "}
                  <Link to="/templates?new=1&from=compose" className="fw-semibold">
                    Create your first one
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
                  <option value="">Choose a template</option>
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
              <div className="col-sm-6">
                <label htmlFor="recipientFirstName">Customer First Name</label>
                <input
                  id="recipientFirstName"
                  className="form-control"
                  value={recipientFirstName}
                  onChange={(e) => setRecipientFirstName(e.target.value)}
                  placeholder="e.g., Alex"
                />
              </div>
              <div className="col-sm-6">
                <label htmlFor="validUntil">Prices Good Through</label>
                <input
                  id="validUntil"
                  type="date"
                  className="form-control"
                  value={validUntil}
                  onChange={(e) => setValidUntil(e.target.value)}
                />
              </div>
            </div>

            <div className="mb-3">
              <label htmlFor="note">Personal Note (optional)</label>
              <textarea
                id="note"
                className="form-control"
                rows={3}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="e.g., Great talking with you Tuesday. Here's what we went over."
              />
            </div>

            <div className="mb-3">
              <div className="d-flex align-items-center justify-content-between mb-1">
                <label className="mb-0">Products to Include</label>
                <Link to="/models?new=1&from=compose" className="text-decoration-none fw-semibold">
                  + New product
                </Link>
              </div>
              <div className="model-picker">
                {models.length === 0 ? (
                  <p className="text-muted mb-0 p-1">
                    No products yet.{" "}
                    <Link to="/models?new=1&from=compose" className="fw-semibold">Create your first one</Link>.
                  </p>
                ) : (
                  models.map((m) => {
                    const checked = selectedModelIds.includes(m.id);
                    const pick = recommendedId === m.id;
                    return (
                      <div key={m.id} className="d-flex align-items-center">
                        <label className="d-flex align-items-center gap-2 mb-0 flex-grow-1">
                          <input
                            type="checkbox"
                            className="form-check-input flex-shrink-0"
                            checked={checked}
                            onChange={() => toggleModel(m.id)}
                          />
                          <span>{m.name}</span>
                        </label>
                        {checked && (
                          <button
                            type="button"
                            className="btn btn-link p-1 d-inline-flex align-items-center gap-1 text-decoration-none"
                            style={{ color: pick ? "var(--red)" : "var(--ink-soft)" }}
                            onClick={() => setRecommendedId(pick ? "" : m.id)}
                            aria-pressed={pick}
                            title={pick ? "Remove your recommendation" : "Mark as your recommendation"}
                          >
                            <Star size={16} fill={pick ? "currentColor" : "none"} />
                            {pick ? "My pick" : ""}
                          </button>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
              <div className="form-text">Click the star next to a product to mark it as your recommendation.</div>
            </div>

            <div className="form-text mb-3">
              Your contact card at the bottom of the email comes from{" "}
              <Link to="/settings">Settings</Link>.
            </div>

            {status && (
              <div className={`alert ${status.type === "success" ? "alert-success" : "alert-danger"} py-2 mb-3`}>
                {status.msg}
              </div>
            )}

            <div className="d-flex gap-2 flex-wrap">
              <button
                onClick={sendEmail}
                disabled={sending}
                className="btn btn-primary d-inline-flex align-items-center"
              >
                {sending ? (
                  <><span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true" />Sending…</>
                ) : <><Send size={15} className="me-2" />Send Email</>}
              </button>
              <button onClick={copyHtml} className="btn btn-outline-secondary d-inline-flex align-items-center">
                <Copy size={15} className="me-2" />Copy Email
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT: preview */}
        <div className="col-lg-7 col-xl-8">
          <div className="d-flex align-items-center justify-content-between mb-2">
            <h2 className="mb-0">Preview</h2>
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
    </div>
  );
}
