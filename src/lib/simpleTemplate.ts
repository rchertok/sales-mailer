// src/lib/simpleTemplate.ts
export type SimpleTemplate = {
  id: string;
  title: string;
  greeting: string;        // e.g., "Hi"
  intro: string;           // a sentence before the models list
  ctaText?: string;        // button text for each model, optional
  signature: string;       // e.g., "Best,\nSam Rivera"
  themeColor?: string;     // hex like #0ea5e9
  logoUrl?: string;        // optional logo at top
};

/** Convert a SimpleTemplate + data into MJML (no user tags necessary). */
export function buildMJMLFromSimpleTemplate(t: SimpleTemplate, vars: {
  recipient?: { firstName?: string };
  rep?: { name?: string };
  models: Array<{
    name: string;
    skuInternal?: string;
    hideSku?: boolean;
    pricing:
      | { kind: "purchase"; price?: number }
      | { kind: "lease"; monthly: number; termMonths: number; upfront?: number };
    // you can expand later with images, links, specs, etc.
  }>;
}) {
  const brand = t.themeColor || "#0ea5e9";
  const greetName = (vars.recipient?.firstName || "there").trim();
  const sign = t.signature.replace(/\n/g, "<br/>");

  // Helper to render pricing text
  const fmtCurrency = (n?: number) =>
    typeof n === "number" && !Number.isNaN(n)
      ? n.toLocaleString(undefined, { style: "currency", currency: "USD" })
      : "";

  const renderPrice = (p: any) => {
    if (!p || !p.kind) return "";
    if (p.kind === "purchase") {
      return p.price ? `<b>Price:</b> ${fmtCurrency(p.price)}` : "";
    }
    const up = p.upfront ? ` (Upfront ${fmtCurrency(p.upfront)})` : "";
    return `<b>Lease:</b> ${fmtCurrency(p.monthly)}/mo · ${p.termMonths} mo${up}`;
  };

  const modelBlocks = vars.models.map((m) => {
    const maybeSku =
      m.skuInternal && !m.hideSku ? `<br/><b>SKU:</b> ${m.skuInternal}` : "";
    const maybeBtn = t.ctaText
      ? `<mj-button background-color="${brand}" href="#" padding="8px 0">${t.ctaText}</mj-button>`
      : "";
    return `
      <mj-divider border-color="#e5e7eb" />
      <mj-text font-size="16px"><b>${m.name}</b></mj-text>
      <mj-text>
        ${renderPrice(m.pricing)}
        ${maybeSku}
      </mj-text>
      ${maybeBtn}
    `;
  }).join("\n");

  const maybeLogo = t.logoUrl
    ? `<mj-image src="${t.logoUrl}" align="left" width="120px" padding="0 0 12px 0" />`
    : "";

  // The MJML we generate from simple fields:
  return `
<mjml>
  <mj-head>
    <mj-attributes>
      <mj-all font-family="Inter, Arial" />
      <mj-button background-color="${brand}" color="#ffffff" border-radius="8px" />
    </mj-attributes>
  </mj-head>
  <mj-body background-color="#f8fafc">
    <mj-section background-color="#ffffff" padding="20px" border-radius="12px">
      <mj-column>
        ${maybeLogo}
        <mj-text font-size="18px">${t.greeting} ${greetName},</mj-text>
        <mj-text>${t.intro}</mj-text>
        ${modelBlocks}
        <mj-text>${sign}</mj-text>
      </mj-column>
    </mj-section>
  </mj-body>
</mjml>
`.trim();
}
