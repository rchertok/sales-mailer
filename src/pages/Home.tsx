import { Link } from "react-router-dom";
import { Package, FileText, Send, Clock } from "lucide-react";

const steps = [
  {
    icon: Package,
    title: "Add Your Products",
    description: "Define the products or services you sell with pricing — one-time purchase or monthly lease.",
    link: "/models",
    linkLabel: "Go to Products →",
  },
  {
    icon: FileText,
    title: "Create an Email Template",
    description: "Set up a reusable template with your intro, signature, brand color, and optional logo.",
    link: "/templates",
    linkLabel: "Go to Templates →",
  },
  {
    icon: Send,
    title: "Compose & Send",
    description: "Pick a template, select products, enter your customer's info, and send straight from Gmail.",
    link: "/compose",
    linkLabel: "Go to Compose →",
  },
  {
    icon: Clock,
    title: "Track Your Sends",
    description: "See every email you've sent: who received it, which products were featured, and when.",
    link: "/history",
    linkLabel: "Go to Sent Emails →",
  },
];

function HeroIllustration() {
  return (
    <svg
      viewBox="0 0 320 260"
      xmlns="http://www.w3.org/2000/svg"
      className="hero-illustration"
      aria-hidden="true"
    >
      {/* Background circle */}
      <circle cx="160" cy="140" r="112" fill="#EEF4FF" />

      {/* Document / letter */}
      <rect x="98" y="38" width="124" height="96" rx="8" fill="white"
        stroke="#0d6efd" strokeWidth="2" filter="url(#shadow)" />
      <line x1="116" y1="60"  x2="204" y2="60"  stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
      <line x1="116" y1="76"  x2="204" y2="76"  stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
      <line x1="116" y1="92"  x2="178" y2="92"  stroke="#93c5fd" strokeWidth="2" strokeLinecap="round" />
      {/* Dollar sign on document */}
      <text x="182" y="96" fontSize="15" fill="#0d6efd" opacity="0.55" fontWeight="bold"
        fontFamily="system-ui, sans-serif">$</text>

      {/* Drop shadow filter */}
      <defs>
        <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
          <feDropShadow dx="0" dy="4" stdDeviation="6" floodColor="#0d6efd" floodOpacity="0.08" />
        </filter>
      </defs>

      {/* Envelope body */}
      <rect x="52" y="126" width="216" height="116" rx="10" fill="white"
        stroke="#0d6efd" strokeWidth="2.5" filter="url(#shadow)" />

      {/* Envelope V-fold at top */}
      <path d="M52 126 L160 192 L268 126" fill="none" stroke="#0d6efd" strokeWidth="2.5" strokeLinejoin="round" />

      {/* Envelope bottom diagonals (subtle) */}
      <path d="M52 242 L140 192" fill="none" stroke="#c7d9fe" strokeWidth="1.5" />
      <path d="M268 242 L180 192" fill="none" stroke="#c7d9fe" strokeWidth="1.5" />

      {/* Decorative animated dots */}
      <circle cx="36"  cy="105" r="5.5" fill="#0d6efd" className="dot-a" />
      <circle cx="286" cy="88"  r="7"   fill="#0d6efd" className="dot-b" />
      <circle cx="72"  cy="228" r="4.5" fill="#0d6efd" className="dot-c" />
      <circle cx="258" cy="220" r="5"   fill="#0d6efd" className="dot-d" />

      {/* Sparkle top-right */}
      <path
        d="M284 52 L286 43 L288 52 L297 54 L288 56 L286 65 L284 56 L275 54 Z"
        fill="#0d6efd" opacity="0.35"
      />
      {/* Sparkle left */}
      <path
        d="M26 162 L27.5 156 L29 162 L35 163.5 L29 165 L27.5 171 L26 165 L20 163.5 Z"
        fill="#0d6efd" opacity="0.28"
      />
      {/* Small dot accent */}
      <circle cx="295" cy="165" r="3" fill="#0d6efd" opacity="0.22" />
      <circle cx="24"  cy="82"  r="3" fill="#0d6efd" opacity="0.18" />
    </svg>
  );
}

export default function Home() {
  return (
    <div className="page-enter" style={{ maxWidth: 920, margin: "0 auto" }}>
      {/* Hero */}
      <div className="row align-items-center mb-5 g-4">
        <div className="col-md-6">
          <p className="text-uppercase fw-semibold mb-2"
            style={{ fontSize: "0.75rem", letterSpacing: "0.1em", color: "var(--brand-primary)" }}>
            Sales Mailer
          </p>
          <h1 style={{ fontSize: "2.1rem", lineHeight: 1.2, marginBottom: "1rem" }}>
            Send beautifully branded<br />
            <span style={{ color: "var(--brand-primary)" }}>product emails</span> in minutes
          </h1>
          <p className="text-muted mb-4" style={{ fontSize: "1.05rem", maxWidth: 420 }}>
            Build personalized proposals with your pricing, send straight from Gmail —
            no copy-paste, no formatting headaches.
          </p>
          <div className="d-flex gap-2 flex-wrap">
            <Link to="/compose" className="btn btn-primary px-4">
              Compose an Email
            </Link>
            <Link to="/models" className="btn btn-outline-secondary px-4">
              Add Products
            </Link>
          </div>
        </div>
        <div className="col-md-6 d-flex justify-content-center">
          <HeroIllustration />
        </div>
      </div>

      {/* How it works */}
      <p className="text-uppercase fw-semibold mb-3"
        style={{ fontSize: "0.75rem", letterSpacing: "0.1em", color: "#6c757d" }}>
        How it works
      </p>
      <div className="row g-3">
        {steps.map((step, i) => {
          const Icon = step.icon;
          return (
            <div className="col-sm-6 col-lg-3" key={step.title}>
              <div className="step-card" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="step-icon">
                  <Icon size={20} />
                </div>
                <h2 style={{ fontSize: "0.95rem", marginBottom: "0.4rem" }}>{step.title}</h2>
                <p className="text-muted mb-3" style={{ fontSize: "0.85rem", lineHeight: 1.5 }}>
                  {step.description}
                </p>
                <Link
                  to={step.link}
                  className="text-decoration-none fw-semibold"
                  style={{ fontSize: "0.85rem", color: "var(--brand-primary)" }}
                >
                  {step.linkLabel}
                </Link>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
