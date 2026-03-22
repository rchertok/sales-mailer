// src/lib/simpleTemplate.ts
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
  signature: string;
  themeColor?: string;
  logoUrl?: string;
  displayMode?: "cards" | "table"; // how to show products in the email
};

// ── helpers ──────────────────────────────────────────────────────────────────

const fmtCurrency = (n?: number) =>
  typeof n === "number" && !Number.isNaN(n)
    ? n.toLocaleString("en-US", { style: "currency", currency: "USD" })
    : "—";

// ── Comparison table builder ─────────────────────────────────────────────────

function buildComparisonTable(
  models: Model[],
  brand: string,
  fontStack: string
): string {
  if (models.length === 0) return "";

  const hasAnyLease      = models.some((m) => m.pricing.kind === "lease");
  const hasAnyUpfront    = models.some((m) => m.pricing.kind === "lease" && m.pricing.upfront);
  const hasAnyVisibleSku = models.some((m) => m.skuInternal && !m.hideSku);

  // Collect all unique spec keys in order of first appearance across all models
  const specKeys: string[] = [];
  const seenKeys = new Set<string>();
  models.forEach((m) => {
    m.specs?.forEach((s) => {
      if (s.key && !seenKeys.has(s.key)) { seenKeys.add(s.key); specKeys.push(s.key); }
    });
  });

  // Shared cell styles
  const base   = `font-family:${fontStack}; font-size:13px; padding:9px 12px; border-bottom:1px solid #e5e7eb;`;
  const label  = `${base} font-weight:600; color:#374151; background:#f8fafc; text-align:left;`;
  const cell   = `${base} color:#374151; text-align:center;`;
  const even   = `background:#f0f6ff;`;
  const hdrTh  = `font-family:${fontStack}; font-size:13px; font-weight:700; color:#fff; background:${brand}; padding:10px 12px; text-align:center;`;
  const hdrLbl = `font-family:${fontStack}; font-size:13px; font-weight:700; color:#fff; background:${brand}; padding:10px 12px; text-align:left;`;

  // Header row (with optional image above name)
  const headerCols = models.map((m) => {
    const img = m.imageUrl
      ? `<img src="${m.imageUrl}" alt="${m.name}" style="display:block;margin:0 auto 6px;max-height:60px;max-width:100px;object-fit:contain;" />`
      : "";
    return `<th style="${hdrTh}">${img}${m.name}</th>`;
  }).join("");

  // Pricing row
  const pricingCells = models.map((m) => {
    if (m.pricing.kind === "purchase") {
      return `<td style="${cell}">${m.pricing.price ? fmtCurrency(m.pricing.price) : "—"}</td>`;
    }
    return `<td style="${cell}">${fmtCurrency(m.pricing.monthly)}<span style="color:#6b7280">/mo</span></td>`;
  }).join("");

  let rows = `<tr><td style="${label}">Pricing</td>${pricingCells}</tr>`;

  // Term row (leases only)
  if (hasAnyLease) {
    const termCells = models.map((m) =>
      m.pricing.kind === "lease"
        ? `<td style="${cell}${even}">${m.pricing.termMonths} months</td>`
        : `<td style="${cell}${even}">—</td>`
    ).join("");
    rows += `<tr><td style="${label}${even}">Term</td>${termCells}</tr>`;
  }

  // Upfront row
  if (hasAnyUpfront) {
    const upfrontCells = models.map((m) =>
      m.pricing.kind === "lease" && m.pricing.upfront
        ? `<td style="${cell}">${fmtCurrency(m.pricing.upfront)}</td>`
        : `<td style="${cell}">—</td>`
    ).join("");
    rows += `<tr><td style="${label}">Upfront</td>${upfrontCells}</tr>`;
  }

  // One row per spec key, in order of first appearance
  specKeys.forEach((key, i) => {
    const isEven = (2 + (hasAnyLease ? 1 : 0) + (hasAnyUpfront ? 1 : 0) + i) % 2 === 1;
    const bg = isEven ? even : "";
    const specCells = models.map((m) => {
      const val = m.specs?.find((s) => s.key === key)?.value;
      return `<td style="${cell}${bg}">${val || "—"}</td>`;
    }).join("");
    rows += `<tr><td style="${label}${bg}">${key}</td>${specCells}</tr>`;
  });

  // SKU row
  if (hasAnyVisibleSku) {
    const skuCells = models.map((m) =>
      m.skuInternal && !m.hideSku
        ? `<td style="${cell}${even}">${m.skuInternal}</td>`
        : `<td style="${cell}${even}">—</td>`
    ).join("");
    rows += `<tr><td style="${label}${even}">SKU</td>${skuCells}</tr>`;
  }

  return `
    <mj-text padding="0">
      <table style="width:100%; border-collapse:collapse; border-radius:8px; overflow:hidden; margin:12px 0;">
        <thead>
          <tr>
            <th style="${hdrLbl}"> </th>
            ${headerCols}
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </mj-text>`;
}

// ── Card blocks builder ───────────────────────────────────────────────────────

function buildCardBlocks(
  models: Model[],
  brand: string,
  ctaText: string | undefined
): string {
  return models.map((m) => {
    const priceText = (() => {
      const p = m.pricing;
      if (p.kind === "purchase") return p.price ? `<b>Price:</b> ${fmtCurrency(p.price)}` : "";
      const up = p.upfront ? ` &nbsp;(Upfront ${fmtCurrency(p.upfront)})` : "";
      return `<b>Lease:</b> ${fmtCurrency(p.monthly)}/mo &nbsp;&middot;&nbsp; ${p.termMonths} mo${up}`;
    })();
    const maybeSku   = m.skuInternal && !m.hideSku ? `<br/><b>SKU:</b> ${m.skuInternal}` : "";
    const validSpecs = m.specs?.filter((s) => s.key && s.value) ?? [];
    const maybeSpecs = validSpecs.length
      ? "<br/>" + validSpecs.map((s) => `<span style="color:#6b7280;font-size:13px"><b>${s.key}:</b> ${s.value}</span>`).join("<br/>")
      : "";
    const maybeBtn  = ctaText
      ? `<mj-button background-color="${brand}" href="#" padding="8px 0">${ctaText}</mj-button>`
      : "";
    const maybeImg = m.imageUrl
      ? `<mj-image src="${m.imageUrl}" width="180px" align="left" padding="8px 0 4px 0" />`
      : "";
    return `
      <mj-divider border-color="#e5e7eb" />
      ${maybeImg}
      <mj-text font-size="16px"><b>${m.name}</b></mj-text>
      <mj-text>${priceText}${maybeSku}${maybeSpecs}</mj-text>
      ${maybeBtn}`;
  }).join("\n");
}

// ── Main builder ──────────────────────────────────────────────────────────────

export function buildMJMLFromSimpleTemplate(
  t: SimpleTemplate,
  vars: {
    recipient?: { firstName?: string };
    rep?: { name?: string };
    models: Model[];
    fontFamily?: string;
  }
) {
  const brand      = t.themeColor  || "#0ea5e9";
  const fontName   = vars.fontFamily || "Inter";
  const fontStack  = getFontStack(fontName);
  const greetName  = (vars.recipient?.firstName || "there").trim();
  const sign       = t.signature.replace(/\n/g, "<br/>");
  const isTable    = t.displayMode === "table";

  // Google Font <mj-font> tag (only for web fonts)
  const mjFont = GOOGLE_FONTS.has(fontName)
    ? `<mj-font name="${fontName}" href="https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontName)}:wght@400;600;700&display=swap" />`
    : "";

  const productContent = isTable
    ? buildComparisonTable(vars.models, brand, fontStack)
    : buildCardBlocks(vars.models, brand, t.ctaText);

  const maybeLogo = t.logoUrl
    ? `<mj-image src="${t.logoUrl}" align="left" width="120px" padding="0 0 12px 0" />`
    : "";

  // CTA at bottom for table mode (card mode embeds ctaText per card)
  const tableBottomCta = isTable && t.ctaText && vars.models.length > 0
    ? `<mj-button background-color="${brand}" href="#">${t.ctaText}</mj-button>`
    : "";

  return `
<mjml>
  <mj-head>
    ${mjFont}
    <mj-attributes>
      <mj-all font-family="${fontStack}" />
      <mj-button background-color="${brand}" color="#ffffff" border-radius="8px" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f8fafc">
    <mj-section background-color="#ffffff" padding="20px" border-radius="12px">
      <mj-column>
        ${maybeLogo}
        <mj-text font-size="18px">${t.greeting} ${greetName},</mj-text>
        <mj-text>${t.intro}</mj-text>
        ${productContent}
        ${tableBottomCta}
        <mj-text>${sign}</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>`.trim();
}
