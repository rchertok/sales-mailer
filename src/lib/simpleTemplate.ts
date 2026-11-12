// src/lib/simpleTemplate.ts
// Builds the customer email. It is meant to read like a personal note from the
// rep: light branding, a clear list of options, and an easy way to reply.
import type { Model } from "../types";

export const FONT_OPTIONS = [
  { label: "Inter",        value: "Inter" },
  { label: "Roboto",       value: "Roboto" },
  { label: "Open Sans",    value: "Open Sans" },
  { label: "Lato",         value: "Lato" },
  { label: "Montserrat",   value: "Montserrat" },
  { label: "Georgia",      value: "Georgia" },
  { label: "Arial",        value: "Arial" },
] as const;

// Fonts loaded via Google Fonts (all except system fonts)
const GOOGLE_FONTS = new Set(["Inter", "Roboto", "Open Sans", "Lato", "Montserrat"]);

function getFontStack(name: string): string {
  if (name === "Georgia") return "Georgia, 'Times New Roman', serif";
  if (name === "Arial")   return "Arial, Helvetica, sans-serif";
  return `'${name}', Arial, sans-serif`;
}

export type SimpleTemplate = {
  id: string;
  title: string;
  greeting: string;
  intro: string;
  ctaText?: string;
  ctaUrl?: string;
  signature: string; // the sign-off line, e.g. "Best,"
  themeColor?: string;
  logoUrl?: string;
  displayMode?: "cards" | "table"; // how to show products in the email
};

/** The rep's contact card, shown at the bottom of every email. */
export type RepProfile = {
  name?: string;
  title?: string;
  company?: string;
  phone?: string;
  email?: string;
  photoUrl?: string;
};

export type EmailVars = {
  recipient?: { firstName?: string };
  rep?: RepProfile;
  models: Model[];
  fontFamily?: string;
  /** A short message written for this one customer */
  note?: string;
  /** Product to mark as the rep's recommendation */
  recommendedId?: string;
  /** "yyyy-mm-dd"; adds "These prices are good through ..." */
  validUntil?: string;
};

// ── helpers ──────────────────────────────────────────────────────────────────

const TEXT = "#1f2328";
const MUTED = "#59636e";
const LINE = "#e4e4e0";
const BODY_PX = 15;
const SMALL_PX = 13;

function esc(s: string) {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

const escLines = (s: string) => esc(s).replace(/\n/g, "<br/>");

const fmtCurrency = (n?: number) => {
  if (typeof n !== "number" || Number.isNaN(n)) return "";
  const whole = Number.isInteger(n);
  return n.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  });
};

/** Mix a hex color with white. amount 0 = original, 1 = white. */
function tint(hex: string, amount: number) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex);
  if (!m) return "#f5f7fa";
  const n = parseInt(m[1], 16);
  const mix = (c: number) => Math.round(c + (255 - c) * amount);
  const r = mix((n >> 16) & 255), g = mix((n >> 8) & 255), b = mix(n & 255);
  return `#${((1 << 24) | (r << 16) | (g << 8) | b).toString(16).slice(1)}`;
}



function formatDate(iso: string) {
  const [y, mo, d] = iso.split("-").map(Number);
  if (!y || !mo || !d) return "";
  return new Date(y, mo - 1, d).toLocaleDateString("en-US", {
    month: "long", day: "numeric", year: "numeric",
  });
}

// Tables in email need these to render the same in every inbox
const TBL = `role="presentation" cellpadding="0" cellspacing="0" border="0"`;

function pickTag(brand: string) {
  return `<span style="display:inline-block;background:${brand};color:#ffffff;font-size:${SMALL_PX}px;font-weight:600;line-height:1;padding:5px 9px;border-radius:999px;">&#9733; My pick</span>`;
}

function priceLines(m: Model) {
  const p = m.pricing;
  if (p.kind === "purchase") {
    return p.price ? { main: fmtCurrency(p.price), sub: ["one-time"] } : { main: "", sub: [] };
  }
  const sub = [`for ${p.termMonths} months`];
  if (p.upfront) sub.push(`+ ${fmtCurrency(p.upfront)} upfront`);
  return { main: `${fmtCurrency(p.monthly)}/month`, sub };
}

// ── Products: one by one ─────────────────────────────────────────────────────

function buildCardBlocks(models: Model[], brand: string, recommendedId?: string): string {
  const items = models.map((m, i) => {
    const pick = m.id === recommendedId;
    const specs = (m.specs ?? []).filter((s) => s.key && s.value);
    const { main, sub } = priceLines(m);
    const sku = m.skuInternal && !m.hideSku ? m.skuInternal : "";

    const img = m.imageUrl
      ? `<td width="76" valign="top" style="padding-right:16px;"><img src="${esc(m.imageUrl)}" alt="" width="76" style="display:block;width:76px;max-height:76px;object-fit:contain;border-radius:6px;" /></td>`
      : "";

    const specRows = specs.map((s) => `
      <tr>
        <td style="padding:3px 16px 3px 0;font-size:${SMALL_PX}px;color:${MUTED};white-space:nowrap;vertical-align:top;">${esc(s.key)}</td>
        <td style="padding:3px 0;font-size:${SMALL_PX}px;color:${TEXT};vertical-align:top;">${esc(s.value)}</td>
      </tr>`).join("");

    const body = `
      <table ${TBL} width="100%">
        <tr>
          ${img}
          <td valign="top">
            ${pick ? `<div style="margin-bottom:8px;">${pickTag(brand)}</div>` : ""}
            <table ${TBL} width="100%">
              <tr>
                <td valign="top" style="font-size:${BODY_PX}px;font-weight:700;color:${TEXT};padding-right:12px;">
                  ${esc(m.name)}
                  ${sku ? `<div style="font-size:${SMALL_PX}px;font-weight:400;color:${MUTED};">Item ${esc(sku)}</div>` : ""}
                </td>
                <td valign="top" align="right" style="text-align:right;white-space:nowrap;">
                  ${main ? `<div style="font-size:${BODY_PX}px;font-weight:700;color:${TEXT};">${main}</div>` : ""}
                  ${sub.map((l) => `<div style="font-size:${SMALL_PX}px;color:${MUTED};">${l}</div>`).join("")}
                </td>
              </tr>
            </table>
            ${specRows ? `<table ${TBL} style="margin-top:10px;">${specRows}</table>` : ""}
            ${m.productUrl ? `<div style="margin-top:10px;font-size:${SMALL_PX}px;"><a href="${esc(m.productUrl)}" style="color:${brand};font-weight:600;text-decoration:none;">See product details &rarr;</a></div>` : ""}
          </td>
        </tr>
      </table>`;

    const cellStyle = pick
      ? `padding:18px 18px;background:${tint(brand, 0.93)};border-left:3px solid ${brand};border-radius:6px;`
      : `padding:18px 21px;`;
    const divider = i > 0 && !pick && models[i - 1].id !== recommendedId
      ? `<tr><td style="border-top:1px solid ${LINE};font-size:0;line-height:0;height:1px;">&nbsp;</td></tr>`
      : "";
    return `${divider}<tr><td style="${cellStyle}">${body}</td></tr>`;
  }).join("");

  return `
    <mj-text padding="4px 0 20px 0">
      <table ${TBL} width="100%" style="border-top:1px solid ${LINE};border-bottom:1px solid ${LINE};">
        ${items}
      </table>
    </mj-text>`;
}

// ── Products: side by side ───────────────────────────────────────────────────

function buildComparisonTable(models: Model[], brand: string, fontStack: string, recommendedId?: string): string {
  if (models.length === 0) return "";

  const hasAnyLink = models.some((m) => m.productUrl);
  const hasPick    = models.some((m) => m.id === recommendedId);

  // All detail labels, in order of first appearance
  const specKeys: string[] = [];
  const seen = new Set<string>();
  models.forEach((m) => m.specs?.forEach((s) => {
    if (s.key && !seen.has(s.key)) { seen.add(s.key); specKeys.push(s.key); }
  }));

  const labelW = 30;
  const colW = Math.floor((100 - labelW) / models.length);
  const pickBg = tint(brand, 0.93);
  const ff = `font-family:${fontStack};`;

  const td = (m: Model | null, inner: string, extra = "") => {
    const bg = m && m.id === recommendedId ? `background:${pickBg};` : "";
    const align = m ? "text-align:center;" : "text-align:left;";
    return `<td valign="middle" style="${ff}${bg}${align}padding:11px 8px;border-bottom:1px solid ${LINE};font-size:${SMALL_PX}px;color:${m ? TEXT : MUTED};${extra}">${inner}</td>`;
  };

  // Header: a tag row (so every name lines up), then the names
  const tagRow = hasPick
    ? `<tr><td></td>${models.map((m) =>
        m.id === recommendedId
          ? `<td align="center" style="background:${pickBg};padding:12px 8px 0;border-radius:6px 6px 0 0;">${pickTag(brand)}</td>`
          : `<td></td>`
      ).join("")}</tr>`
    : "";

  const nameRow = `<tr><td style="border-bottom:2px solid ${TEXT};"></td>${models.map((m) => {
    const bg = m.id === recommendedId ? `background:${pickBg};` : "";
    const img = m.imageUrl
      ? `<img src="${esc(m.imageUrl)}" alt="" style="display:block;margin:0 auto 8px;max-height:56px;max-width:96px;" />`
      : "";
    const sku = m.skuInternal && !m.hideSku
      ? `<div style="font-size:${SMALL_PX}px;font-weight:400;color:${MUTED};margin-top:2px;">Item ${esc(m.skuInternal)}</div>`
      : "";
    return `<td valign="bottom" align="center" style="${ff}${bg}text-align:center;padding:10px 8px 12px;border-bottom:2px solid ${TEXT};font-size:${BODY_PX}px;font-weight:700;color:${TEXT};line-height:1.3;">${img}${esc(m.name)}${sku}</td>`;
  }).join("")}</tr>`;

  const priceRow = `<tr>${td(null, "Price")}${models.map((m) => {
    const { main, sub } = priceLines(m);
    return td(m, main
      ? `<div style="font-size:${BODY_PX}px;font-weight:700;">${main}</div>${sub.map((l) => `<div style="color:${MUTED};">${l}</div>`).join("")}`
      : "");
  }).join("")}</tr>`;

  const specRows = specKeys.map((key) =>
    `<tr>${td(null, esc(key))}${models.map((m) => td(m, esc(m.specs?.find((s) => s.key === key)?.value ?? ""))).join("")}</tr>`
  ).join("");

  const linkRow = hasAnyLink
    ? `<tr>${td(null, "", "border-bottom:0;")}${models.map((m) => td(m,
        m.productUrl ? `<a href="${esc(m.productUrl)}" style="color:${brand};font-weight:600;text-decoration:none;">Details &rarr;</a>` : "",
        `border-bottom:0;${m.id === recommendedId ? "border-radius:0 0 6px 6px;" : ""}`
      )).join("")}</tr>`
    : "";

  return `
    <mj-text padding="4px 0 20px 0">
      <table ${TBL} width="100%" style="table-layout:fixed;width:100%;">
        <colgroup><col width="${labelW}%" />${models.map(() => `<col width="${colW}%" />`).join("")}</colgroup>
        ${tagRow}
        ${nameRow}
        ${priceRow}
        ${specRows}
        ${linkRow}
      </table>
    </mj-text>`;
}

// ── Contact card ─────────────────────────────────────────────────────────────

function buildContactCard(rep: RepProfile, brand: string): string {
  if (!rep.name && !rep.email && !rep.phone) return "";
  const line2 = [rep.title, rep.company].filter(Boolean).map((s) => esc(s!)).join(", ");
  const contact = [
    rep.phone ? `<a href="tel:${esc(rep.phone.replace(/[^\d+]/g, ""))}" style="color:${TEXT};text-decoration:none;">${esc(rep.phone)}</a>` : "",
    rep.email ? `<a href="mailto:${esc(rep.email)}" style="color:${brand};text-decoration:none;">${esc(rep.email)}</a>` : "",
  ].filter(Boolean).join(`<span style="color:${LINE};">&nbsp;&nbsp;|&nbsp;&nbsp;</span>`);

  const photo = rep.photoUrl
    ? `<td width="68" valign="middle" style="padding-right:14px;"><img src="${esc(rep.photoUrl)}" alt="" width="54" height="54" style="display:block;width:54px;height:54px;border-radius:50%;object-fit:cover;" /></td>`
    : "";

  return `
    <mj-text padding="6px 0 0 0">
      <table ${TBL} style="border-left:3px solid ${brand};">
        <tr>
          <td style="padding:2px 0 2px 14px;">
            <table ${TBL}><tr>
              ${photo}
              <td valign="middle" style="font-size:${BODY_PX}px;line-height:1.5;color:${TEXT};">
                ${rep.name ? `<div style="font-weight:700;">${esc(rep.name)}</div>` : ""}
                ${line2 ? `<div style="color:${MUTED};font-size:${SMALL_PX}px;">${line2}</div>` : ""}
                ${contact ? `<div style="font-size:${SMALL_PX}px;">${contact}</div>` : ""}
              </td>
            </tr></table>
          </td>
        </tr>
      </table>
    </mj-text>`;
}

// ── Main builder ──────────────────────────────────────────────────────────────

export function buildMJMLFromSimpleTemplate(t: SimpleTemplate, vars: EmailVars) {
  const brand     = t.themeColor || "#0ea5e9";
  const fontName  = vars.fontFamily || "Inter";
  const fontStack = getFontStack(fontName);
  const greetName = (vars.recipient?.firstName || "there").trim();
  const rep       = vars.rep ?? {};
  const isTable   = t.displayMode === "table";
  const recommendedId = vars.models.some((m) => m.id === vars.recommendedId) ? vars.recommendedId : undefined;

  const mjFont = GOOGLE_FONTS.has(fontName)
    ? `<mj-font name="${fontName}" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;600;700&display=swap" />`
    : "";

  const products = isTable
    ? buildComparisonTable(vars.models, brand, fontStack, recommendedId)
    : buildCardBlocks(vars.models, brand, recommendedId);

  const logo = t.logoUrl
    ? `<mj-image src="${esc(t.logoUrl)}" align="left" width="110px" padding="0 0 20px 0" />`
    : "";

  const note = vars.note?.trim() ? `<mj-text>${escLines(vars.note.trim())}</mj-text>` : "";
  const intro = t.intro.trim() && vars.models.length ? `<mj-text>${escLines(t.intro.trim())}</mj-text>` : "";

  const button = t.ctaText && vars.models.length
    ? `<mj-button href="${esc(t.ctaUrl || "#")}" align="left" padding="4px 0 18px 0">${esc(t.ctaText)}</mj-button>`
    : "";

  const validDate = vars.validUntil ? formatDate(vars.validUntil) : "";
  const valid = validDate && vars.models.length
    ? `<mj-text>These prices are good through <b>${validDate}</b>.</mj-text>`
    : "";

  const closing = rep.phone
    ? `<mj-text>Just reply to this email with any questions, or call me at <a href="tel:${esc(rep.phone.replace(/[^\d+]/g, ""))}" style="color:${brand};text-decoration:none;font-weight:600;">${esc(rep.phone)}</a>.</mj-text>`
    : `<mj-text>Just reply to this email with any questions.</mj-text>`;

  // The grey line of text inboxes show next to the subject
  const preview = esc((vars.note?.trim() || t.intro.trim() || "").replace(/\s+/g, " ").slice(0, 140));

  const signOff = t.signature.trim() ? `<mj-text padding="0 0 4px 0">${escLines(t.signature.trim())}</mj-text>` : "";

  return `
<mjml>
  <mj-head>
    ${preview ? `<mj-preview>${preview}</mj-preview>` : ""}
    ${mjFont}
    <mj-attributes>
      <mj-all font-family="${fontStack}" />
      <mj-text font-size="${BODY_PX}px" line-height="1.6" color="${TEXT}" padding="0 0 14px 0" />
      <mj-button background-color="${brand}" color="#ffffff" border-radius="6px" font-size="${BODY_PX}px" font-weight="600" inner-padding="10px 20px" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#ffffff" width="600px">
    <mj-section padding="32px 24px 40px 24px">
      <mj-column>
        ${logo || `<mj-divider border-color="${brand}" border-width="3px" width="48px" align="left" padding="0 0 24px 0" />`}
        <mj-text>${esc(t.greeting)} ${esc(greetName)},</mj-text>
        ${note}
        ${intro}
        ${products}
        ${button}
        ${valid}
        ${closing}
        ${signOff}
        ${buildContactCard(rep, brand)}
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`.trim();
}
