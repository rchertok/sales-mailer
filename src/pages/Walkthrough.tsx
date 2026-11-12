// Animated walkthrough on the home page: a mock app window that plays through
// adding a product, making a template, composing, and the customer receiving it.
import { useEffect, useMemo, useState } from "react";
import { Check, Pause, Play } from "lucide-react";
import mjml2html from "mjml-browser";
import { buildMJMLFromSimpleTemplate, type SimpleTemplate, type RepProfile } from "../lib/simpleTemplate";
import type { Model } from "../types";

// ── Sample data ───────────────────────────────────────────────────────────────

const SAMPLE_PRODUCTS: Model[] = [
  {
    id: "s1",
    name: "OfficeJet 200",
    pricing: { kind: "purchase", price: 1299 },
    specs: [
      { id: "a", key: "Pages per minute", value: "30" },
      { id: "b", key: "Color printing", value: "Yes" },
      { id: "c", key: "Paper tray", value: "250 sheets" },
    ],
  },
  {
    id: "s2",
    name: "OfficeJet 400",
    pricing: { kind: "lease", monthly: 89, termMonths: 36 },
    specs: [
      { id: "a", key: "Pages per minute", value: "45" },
      { id: "b", key: "Color printing", value: "Yes" },
      { id: "c", key: "Paper tray", value: "500 sheets" },
    ],
  },
  {
    id: "s3",
    name: "OfficeJet 600",
    pricing: { kind: "lease", monthly: 129, termMonths: 36, upfront: 250 },
    specs: [
      { id: "a", key: "Pages per minute", value: "60" },
      { id: "b", key: "Color printing", value: "Yes" },
      { id: "c", key: "Paper tray", value: "1,000 sheets" },
    ],
  },
];

const BRAND_COLORS = ["#5d574c", "#2f6b3f", "#1e4b7a", "#c4401c"];
const CHOSEN_COLOR = "#1e4b7a";

const SAMPLE_REP: RepProfile = {
  name: "Sam Rivera",
  title: "Account Manager",
  company: "Acme Office Supply",
  phone: "(555) 201-3344",
  email: "sam@acmeoffice.com",
};

const SAMPLE_NOTE = "Great talking with you on Tuesday. Since your team prints a lot of color handouts, I'd lean toward the 400.";

function validUntilSample() {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

const SAMPLE_TEMPLATE: SimpleTemplate = {
  id: "sample",
  title: "Printer Quote",
  greeting: "Hi",
  intro: "Here are the printer options we talked about:",
  signature: "Talk soon,",
  themeColor: CHOSEN_COLOR,
  displayMode: "table",
};

// ── Steps ─────────────────────────────────────────────────────────────────────

const STEPS = [
  { title: "Add your products", text: "Enter each product once with its price or lease terms.", duration: 6000 },
  { title: "Make a template", text: "Pick your brand color, how products are shown, and your signature.", duration: 6000 },
  { title: "Compose and send", text: "Enter the customer's name, check off products, star your pick, and hit Send.", duration: 6500 },
  { title: "Your customer gets it", text: "A clean, branded email with their name and your prices, from your Gmail.", duration: 8000 },
];

const TICK = 50;
const TYPE_SPEED = 70; // ms per character

/** The part of `text` that has been "typed" by time t, starting at `start` ms. */
function typed(text: string, t: number, start: number) {
  if (t < start) return "";
  return text.slice(0, Math.floor((t - start) / TYPE_SPEED) + 1);
}

function prefersReducedMotion() {
  return typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}

// ── Mock form bits ────────────────────────────────────────────────────────────

function Field({ label, value, typing }: { label: string; value: string; typing?: boolean }) {
  return (
    <div className="mb-3">
      <div className="mock-label">{label}</div>
      <div className={`mock-input${typing ? " is-typing" : ""}`}>{value || " "}</div>
    </div>
  );
}

function MockButton({ children, pressed, done }: { children: React.ReactNode; pressed?: boolean; done?: boolean }) {
  return (
    <span className={`btn ${done ? "btn-success" : "btn-primary"} mock-button${pressed ? " is-pressed" : ""}`}>
      {children}
    </span>
  );
}

function isTyping(text: string, t: number, start: number) {
  return t >= start && t < start + text.length * TYPE_SPEED;
}

// ── Stages ────────────────────────────────────────────────────────────────────

function ProductsStage({ t }: { t: number }) {
  const name = "OfficeJet 400";
  const added = t > 4200;
  const leaseOn = t > 1800;
  return (
    <div className="row g-4">
      <div className="col-md-7">
        <div className="mock-title">Add a Product</div>
        <Field label="Product Name" value={typed(name, t, 300)} typing={isTyping(name, t, 300)} />
        <div className="mock-label">Pricing</div>
        <div className="d-flex gap-3 mb-3">
          <span className="mock-radio"><span className={leaseOn ? "" : "on"} /> One-time</span>
          <span className="mock-radio"><span className={leaseOn ? "on" : ""} /> Monthly Lease</span>
        </div>
        <div className="row g-3">
          <div className="col-6">
            <Field label="Monthly Payment" value={leaseOn ? "$" + typed("89", t, 2300) : ""} typing={isTyping("89", t, 2300)} />
          </div>
          <div className="col-6">
            <Field label="Length" value={t > 2900 ? typed("36", t, 2900) + " months" : ""} typing={isTyping("36", t, 2900)} />
          </div>
        </div>
        <MockButton pressed={t > 3700 && t < 4200}>Add Product</MockButton>
      </div>
      <div className="col-md-5">
        <div className="mock-title">Your Products</div>
        <div className="mock-list-row">OfficeJet 200<span>$1,299</span></div>
        <div className="mock-list-row">OfficeJet 600<span>$129/month</span></div>
        {added && <div className="mock-list-row is-new">OfficeJet 400<span>$89/month</span></div>}
      </div>
    </div>
  );
}

function TemplateStage({ t }: { t: number }) {
  const colorIdx = t < 1400 ? 0 : t < 1900 ? 1 : 2;
  const tableOn = t > 2900;
  const sig = "Best, Sam Rivera";
  return (
    <div>
      <div className="mock-title">New Template</div>
      <Field label="Template Name" value={typed("Printer Quote", t, 300)} typing={isTyping("Printer Quote", t, 300)} />
      <div className="row g-4">
        <div className="col-sm-6">
          <div className="mock-label">Brand Color</div>
          <div className="d-flex gap-2 mb-3">
            {BRAND_COLORS.map((c, i) => (
              <span key={c} className={`mock-swatch${i === colorIdx ? " on" : ""}`} style={{ background: c }} />
            ))}
          </div>
        </div>
        <div className="col-sm-6">
          <div className="mock-label">How Products Appear</div>
          <div className="d-flex gap-2 mb-3">
            <span className={`btn ${tableOn ? "btn-outline-secondary" : "btn-primary"} mock-button`}>One by One</span>
            <span className={`btn ${tableOn ? "btn-primary" : "btn-outline-secondary"} mock-button`}>Side by Side</span>
          </div>
        </div>
      </div>
      <Field label="Email Signature" value={typed(sig, t, 3300)} typing={isTyping(sig, t, 3300)} />
      <MockButton pressed={t > 4900 && t < 5400} done={t >= 5400}>
        {t >= 5400 ? <><Check size={16} className="me-1" />Saved</> : "Save Template"}
      </MockButton>
    </div>
  );
}

function ComposeStage({ t }: { t: number }) {
  const email = "alex@example.com";
  const checks = [t > 2900, t > 3300, t > 3700];
  const pickOn = t > 4000;
  const sending = t > 4600 && t < 5500;
  const sent = t >= 5500;
  return (
    <div className="row g-4">
      <div className="col-md-6">
        <div className="mock-title">Compose Email</div>
        <Field label="Template" value={t > 200 ? "Printer Quote" : ""} />
        <Field label="Customer Email" value={typed(email, t, 500)} typing={isTyping(email, t, 500)} />
        <Field label="Customer First Name" value={typed("Alex", t, 2000)} typing={isTyping("Alex", t, 2000)} />
      </div>
      <div className="col-md-6">
        <div className="mock-label">Products to Include</div>
        <div className="mock-checklist mb-3">
          {SAMPLE_PRODUCTS.map((p, i) => (
            <div key={p.id} className="mock-check-row">
              <span className={`mock-checkbox${checks[i] ? " on" : ""}`}>{checks[i] && <Check size={12} />}</span>
              {p.name}
              {p.id === "s2" && pickOn && <span className="ms-auto mono" style={{ color: "var(--red)" }}>★ my pick</span>}
            </div>
          ))}
        </div>
        <MockButton pressed={t > 4300 && t < 4600} done={sent}>
          {sent ? <><Check size={16} className="me-1" />Sent to Alex</> : sending ? "Sending…" : "Send Email"}
        </MockButton>
      </div>
    </div>
  );
}

function InboxStage({ html }: { html: string }) {
  return (
    <div className="mock-inbox">
      <div className="inbox-mock-head">
        <div><strong>From:</strong> {SAMPLE_REP.name} &lt;{SAMPLE_REP.email}&gt;</div>
        <div><strong>To:</strong> alex@example.com</div>
        <div><strong>Subject:</strong> Your printer options</div>
      </div>
      <iframe title="Sample email" srcDoc={html} />
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function Walkthrough() {
  const reduced = useMemo(prefersReducedMotion, []);
  const [step, setStep] = useState(0);
  // With reduced motion, show each step's finished state and don't autoplay.
  const [t, setT] = useState(reduced ? Infinity : 0);
  const [playing, setPlaying] = useState(!reduced);
  const [hovering, setHovering] = useState(false);

  const emailHtml = useMemo(() => {
    const mjml = buildMJMLFromSimpleTemplate(SAMPLE_TEMPLATE, {
      recipient: { firstName: "Alex" },
      rep: SAMPLE_REP,
      models: SAMPLE_PRODUCTS,
      fontFamily: "Inter",
      note: SAMPLE_NOTE,
      recommendedId: "s2",
      validUntil: validUntilSample(),
    });
    return mjml2html(mjml, { minify: true }).html;
  }, []);

  const running = playing && !hovering;

  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setT((prev) => {
        const next = prev + TICK;
        if (next >= STEPS[step].duration) {
          setStep((s) => (s + 1) % STEPS.length);
          return 0;
        }
        return next;
      });
    }, TICK);
    return () => window.clearInterval(id);
  }, [running, step]);

  function goTo(i: number) {
    setStep(i);
    setT(reduced ? Infinity : 0);
  }

  const progress = Math.min(1, t / STEPS[step].duration);

  return (
    <div className="row g-5 align-items-start">
      <div className="col-lg-4">
        <ol className="walk-steps">
          {STEPS.map((s, i) => (
            <li key={s.title}>
              <button
                type="button"
                className={`walk-step${i === step ? " active" : ""}`}
                onClick={() => goTo(i)}
                aria-current={i === step ? "step" : undefined}
              >
                <span className="walk-step-num">{String(i + 1).padStart(2, "0")}</span>
                <span>
                  <span className="d-block fw-semibold">{s.title}</span>
                  <span className="walk-step-text">{s.text}</span>
                  {i === step && !reduced && (
                    <span className="walk-progress"><span style={{ transform: `scaleX(${progress})` }} /></span>
                  )}
                </span>
              </button>
            </li>
          ))}
        </ol>
        {!reduced && (
          <button
            type="button"
            className="btn btn-outline-secondary d-inline-flex align-items-center gap-2 mt-2"
            onClick={() => setPlaying((p) => !p)}
          >
            {playing ? <><Pause size={16} />Pause</> : <><Play size={16} />Play</>}
          </button>
        )}
      </div>

      <div className="col-lg-8">
        <div
          className="app-window"
          onMouseEnter={() => setHovering(true)}
          onMouseLeave={() => setHovering(false)}
          aria-label={`Preview, step ${step + 1} of ${STEPS.length}: ${STEPS[step].title}`}
        >
          <div className="app-window-bar">
            <div className="app-window-name">{step === 3 ? "Alex's inbox" : "Sales Mailer"}</div>
            <div className="mono text-muted">{step + 1} / {STEPS.length}</div>
          </div>
          <div className={`app-window-body${step === 3 ? " is-inbox" : ""}`} key={step} aria-hidden="true">
            {step === 0 && <ProductsStage t={t} />}
            {step === 1 && <TemplateStage t={t} />}
            {step === 2 && <ComposeStage t={t} />}
            {step === 3 && <InboxStage html={emailHtml} />}
          </div>
        </div>
        {!reduced && (
          <div className="text-muted mt-3">{hovering ? "Paused while your mouse is over the preview." : " "}</div>
        )}
      </div>
    </div>
  );
}
