import { useEffect, useState } from "react";

/** Pricing can be purchase OR lease */
type Pricing =
  | { kind: "purchase"; price?: number }
  | { kind: "lease"; monthly: number; termMonths: number; upfront?: number };

/** Model = internal ID + client/internal fields */
type Model = {
  id: string; // internal (never shown to client)
  name: string; // client-facing name
  skuInternal?: string; // internal SKU
  hideSku?: boolean; // if true, don’t show SKU in emails
  pricing: Pricing; // purchase or lease
  notesInternal?: string; // internal notes only
};

const STORAGE_KEY = "models";

function loadModels(): Model[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Model[];
    return parsed.map((m) => {
      if (m.pricing?.kind === "purchase") {
        const price =
          typeof (m.pricing as any).price === "number"
            ? (m.pricing as any).price
            : (m.pricing as any).price
            ? Number((m.pricing as any).price)
            : undefined;
        return { ...m, pricing: { kind: "purchase", price } };
      } else if (m.pricing?.kind === "lease") {
        const p = m.pricing as any;
        return {
          ...m,
          pricing: {
            kind: "lease",
            monthly: Number(p.monthly),
            termMonths: Number(p.termMonths),
            upfront: p.upfront != null ? Number(p.upfront) : undefined,
          },
        };
      }
      return { ...m, pricing: { kind: "purchase" } };
    });
  } catch {
    return [];
  }
}

//Saves the model in the list of models.
function saveModels(models: Model[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
}

//Formats the currency into dollars.
function formatCurrency(n?: number) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}
//Formats pricing inputs
function formatPricing(p: Pricing) {
  if (p.kind === "purchase") {
    return p.price ? `Purchase: ${formatCurrency(p.price)}` : "Purchase: —";
  }
  const up = p.upfront ? `, Upfront ${formatCurrency(p.upfront)}` : "";
  return `Lease: ${formatCurrency(p.monthly)}/mo · ${p.termMonths} mo${up}`;
}

export default function Models() {
  const [models, setModels] = useState<Model[]>([]);

  const [name, setName] = useState("");
  const [skuInternal, setSkuInternal] = useState("");
  const [hideSku, setHideSku] = useState(false);
  const [pricingKind, setPricingKind] = useState<"purchase" | "lease">(
    "purchase"
  );

  const [price, setPrice] = useState("");

  const [monthly, setMonthly] = useState("");
  const [termMonths, setTermMonths] = useState("");
  const [upfront, setUpfront] = useState("");

  const [notesInternal, setNotesInternal] = useState("");

  useEffect(() => {
    setModels(loadModels());
  }, []);

  useEffect(() => {
    saveModels(models);
  }, [models]);

  function addModel(e: React.FormEvent) {
    e.preventDefault();

    const trimmedName = name.trim();
    if (!trimmedName) {
      alert("Name is required");
      return;
    }

    let pricing: Pricing;
    if (pricingKind === "purchase") {
      const priceNum = price ? Number(price) : undefined;
      if (price && Number.isNaN(priceNum)) {
        alert("Price must be a number");
        return;
      }
      pricing = { kind: "purchase", price: priceNum };
    } else {
      const monthlyNum = Number(monthly);
      const termNum = Number(termMonths);
      const upfrontNum = upfront ? Number(upfront) : undefined;

      if (monthly === "" || Number.isNaN(monthlyNum)) {
        alert("Monthly must be a number");
        return;
      }
      if (termMonths === "" || Number.isNaN(termNum)) {
        alert("Term (months) must be a number");
        return;
      }
      if (upfront && Number.isNaN(upfrontNum)) {
        alert("Upfront must be a number (or leave blank)");
        return;
      }

      pricing = {
        kind: "lease",
        monthly: monthlyNum,
        termMonths: termNum,
        upfront: upfrontNum,
      };
    }

    const newModel: Model = {
      id: crypto.randomUUID(),
      name: trimmedName,
      skuInternal: skuInternal.trim() || undefined,
      hideSku,
      pricing,
      notesInternal: notesInternal.trim() || undefined,
    };

    setModels((prev) => [newModel, ...prev]);

    setName("");
    setSkuInternal("");
    setHideSku(false);
    setPricingKind("purchase");
    setPrice("");
    setMonthly("");
    setTermMonths("");
    setUpfront("");
    setNotesInternal("");
  }

  function deleteModel(id: string) {
    setModels((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div style={{ maxWidth: 820, margin: "0 auto" }}>
      <h1>Models</h1>

      <form
        onSubmit={addModel}
        style={{ display: "grid", gap: 12, marginBottom: 20 }}
      >
        <label>
          Name*
          <br />
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g., Pro Widget 3000"
            required
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <div
          style={{ display: "grid", gap: 12, gridTemplateColumns: "1fr 1fr" }}
        >
          <label>
            Internal SKU (hidden from client)
            <br />
            <input
              value={skuInternal}
              onChange={(e) => setSkuInternal(e.target.value)}
              placeholder="e.g., PW-3000-INT"
              style={{ width: "100%", padding: 8 }}
            />
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={hideSku}
              onChange={(e) => setHideSku(e.target.checked)}
            />
            Hide SKU from client emails
          </label>
        </div>

        <fieldset style={{ border: "1px solid #ddd", padding: 12 }}>
          <legend>
            <b>Pricing</b>
          </legend>

          <div style={{ display: "flex", gap: 16, marginBottom: 8 }}>
            <label>
              <input
                type="radio"
                name="pricingKind"
                value="purchase"
                checked={pricingKind === "purchase"}
                onChange={() => setPricingKind("purchase")}
              />{" "}
              Purchase
            </label>
            <label>
              <input
                type="radio"
                name="pricingKind"
                value="lease"
                checked={pricingKind === "lease"}
                onChange={() => setPricingKind("lease")}
              />{" "}
              Lease
            </label>
          </div>

          {pricingKind === "purchase" ? (
            <label>
              Price (optional)
              <br />
              <input
                type="number"
                step="any"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="e.g., 1999.99"
                style={{ width: "100%", padding: 8 }}
              />
            </label>
          ) : (
            <div
              style={{
                display: "grid",
                gap: 12,
                gridTemplateColumns: "1fr 1fr 1fr",
              }}
            >
              <label>
                Monthly*
                <br />
                <input
                  type="number"
                  step="any"
                  value={monthly}
                  onChange={(e) => setMonthly(e.target.value)}
                  placeholder="e.g., 149.99"
                  required
                  style={{ width: "100%", padding: 8 }}
                />
              </label>
              <label>
                Term (months)*
                <br />
                <input
                  type="number"
                  value={termMonths}
                  onChange={(e) => setTermMonths(e.target.value)}
                  placeholder="e.g., 36"
                  required
                  style={{ width: "100%", padding: 8 }}
                />
              </label>
              <label>
                Upfront (optional)
                <br />
                <input
                  type="number"
                  step="any"
                  value={upfront}
                  onChange={(e) => setUpfront(e.target.value)}
                  placeholder="e.g., 500"
                  style={{ width: "100%", padding: 8 }}
                />
              </label>
            </div>
          )}
        </fieldset>

        <label>
          Internal Notes (not shown to client)
          <br />
          <textarea
            value={notesInternal}
            onChange={(e) => setNotesInternal(e.target.value)}
            placeholder="Anything the team should know (service constraints, margin notes, etc.)"
            rows={3}
            style={{ width: "100%", padding: 8 }}
          />
        </label>

        <button type="submit" style={{ padding: "10px 14px", marginTop: 4 }}>
          Add Model
        </button>
      </form>

      {models.length === 0 ? (
        <p>No models yet. Add one above!</p>
      ) : (
        <table
          width="100%"
          cellPadding={8}
          style={{ borderCollapse: "collapse" }}
        >
          <thead>
            <tr style={{ background: "#f7f7f7" }}>
              <th align="left">Name</th>
              <th align="left">Pricing</th>
              <th align="left">SKU (internal)</th>
              <th align="left">Notes</th>
              <th align="right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {models.map((m) => (
              <tr key={m.id} style={{ borderTop: "1px solid #eee" }}>
                <td>{m.name}</td>
                <td>{formatPricing(m.pricing)}</td>
                <td>
                  {m.skuInternal ? (m.hideSku ? "Hidden" : m.skuInternal) : "—"}
                </td>
                <td style={{ maxWidth: 280 }}>
                  {m.notesInternal ? (
                    <span title={m.notesInternal}>{m.notesInternal}</span>
                  ) : (
                    "—"
                  )}
                </td>
                <td align="right">
                  <button
                    onClick={() => deleteModel(m.id)}
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
