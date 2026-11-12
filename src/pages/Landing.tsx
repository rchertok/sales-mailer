import type { ReactNode } from "react";
import Walkthrough from "./Walkthrough";

// ── Hero art: an airmail envelope with a stamp and postmark ──────────────────

function EnvelopeArt() {
  return (
    <svg viewBox="0 0 480 330" xmlns="http://www.w3.org/2000/svg" className="hero-art" aria-hidden="true">
      <defs>
        <pattern id="airmail" width="44" height="44" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <rect width="44" height="44" fill="#fffdf7" />
          <rect width="14" height="44" fill="#c4401c" />
          <rect x="22" width="14" height="44" fill="#1e4b7a" />
        </pattern>
        <clipPath id="stamp-clip">
          <rect x="352" y="34" width="86" height="104" />
        </clipPath>
      </defs>

      {/* shadow */}
      <rect x="22" y="28" width="440" height="290" fill="#1f1c17" />
      {/* envelope with airmail edge */}
      <rect x="12" y="16" width="440" height="290" fill="url(#airmail)" stroke="#1f1c17" strokeWidth="2" />
      <rect x="26" y="30" width="412" height="262" fill="#fffdf7" />

      {/* stamp: perforated edge from a dashed outline */}
      <rect x="348" y="30" width="94" height="112" fill="#fffdf7" stroke="#d8cfbd" strokeWidth="8" strokeDasharray="0.1 9" strokeLinecap="round" />
      <rect x="352" y="34" width="86" height="104" fill="#c4401c" />
      <g clipPath="url(#stamp-clip)">
        <circle cx="395" cy="104" r="40" fill="#a3330f" />
        <path d="M368 96 L395 76 L422 96 L422 124 L368 124 Z" fill="#fffdf7" />
        <path d="M368 96 L395 112 L422 96" fill="none" stroke="#c4401c" strokeWidth="3" />
      </g>
      <text x="395" y="56" textAnchor="middle" fill="#fffdf7" fontFamily="Instrument Sans, sans-serif" fontSize="13" fontWeight="500">SALES</text>

      {/* postmark */}
      <g fill="none" stroke="#1f1c17" strokeOpacity="0.55" strokeWidth="2">
        <circle cx="318" cy="118" r="38" />
        <circle cx="318" cy="118" r="30" />
        <path d="M352 96 q14 -8 28 0 t28 0 t28 0 t28 0" />
        <path d="M352 110 q14 -8 28 0 t28 0 t28 0 t28 0" />
        <path d="M352 124 q14 -8 28 0 t28 0 t28 0 t28 0" />
        <path d="M352 138 q14 -8 28 0 t28 0 t28 0 t28 0" />
      </g>
      <text x="318" y="114" textAnchor="middle" fill="#1f1c17" fillOpacity="0.6" fontFamily="Instrument Sans, sans-serif" fontSize="11">SENT</text>
      <text x="318" y="129" textAnchor="middle" fill="#1f1c17" fillOpacity="0.6" fontFamily="Instrument Sans, sans-serif" fontSize="11">TODAY</text>

      {/* address, written by hand */}
      <g fill="none" stroke="#1f1c17" strokeWidth="2.5" strokeLinecap="round">
        <path d="M150 196 c10 -14 22 -14 30 0 s18 12 30 0 s24 -10 34 2 s20 8 30 -4 s18 -6 26 4" />
        <path d="M150 226 c12 -10 22 -12 32 0 s20 8 30 -2 s22 -8 32 2 s18 4 26 -4" />
        <path d="M150 256 c8 -10 18 -10 26 0 s16 8 26 -2 s18 -6 28 2" />
      </g>
      <text x="150" y="168" fill="#c4401c" fontFamily="Fraunces, Georgia, serif" fontStyle="italic" fontSize="22" fontWeight="600">To: Alex</text>
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Landing({ actions }: { actions: ReactNode }) {
  return (
    <div className="page page-enter">
      {/* Hero */}
      <section className="hero row align-items-center g-5">
        <div className="col-lg-6">
          <div className="postmark-line mono">Sales Mailer, for sales reps</div>
          <h1>
            Quotes that read like <em>a note from you,</em> not a spreadsheet.
          </h1>
          <p className="hero-lead mb-3">
            Sales Mailer helps you email customers their product options and prices.
            Save what you sell and how you like your emails to look, just once. Then for each
            customer, pick a few products and it writes a clean, personal email that you send
            from your own Gmail.
          </p>
          <p className="hero-lead mb-4">
            No more copying prices into a blank email or fixing a table that fell apart.
          </p>
          {actions}
        </div>
        <div className="col-lg-6 d-flex justify-content-center">
          <EnvelopeArt />
        </div>
      </section>

      {/* Walkthrough */}
      <section className="landing-section">
        <div className="section-head">
          <span className="mono">01</span>
          <h1>See it work</h1>
        </div>
        <Walkthrough />
      </section>

      {/* Closing */}
      <section className="landing-section">
        <div className="section-head">
          <span className="mono">02</span>
          <h1>What your customer notices</h1>
        </div>
        <div className="row g-5">
          <div className="col-md-4">
            <p className="mono mb-2" style={{ color: "var(--red)" }}>It's from you</p>
            <p className="text-muted mb-0">It goes out from your Gmail with your name, photo and phone number, so replying is one click.</p>
          </div>
          <div className="col-md-4">
            <p className="mono mb-2" style={{ color: "var(--red)" }}>It's easy to compare</p>
            <p className="text-muted mb-0">Prices and details line up side by side, with your recommendation clearly marked.</p>
          </div>
          <div className="col-md-4">
            <p className="mono mb-2" style={{ color: "var(--red)" }}>It's written for them</p>
            <p className="text-muted mb-0">Their name, a personal note from you, and a date the prices are good through.</p>
          </div>
        </div>

        <div className="closing-note mt-5">
          <h1 className="mb-3">Set it up once. <em>Every quote after that takes about a minute.</em></h1>
          {actions}
        </div>
      </section>
    </div>
  );
}
