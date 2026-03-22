import { useEffect, useMemo, useRef, useState } from "react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Package, Plus, Trash2, X } from "lucide-react";
import type { Model, Pricing, Spec } from "../types";

const STORAGE_KEY = "models";

function loadModels(): Model[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Model[];
    return parsed.map((m) => {
      let pricing: Pricing;
      if (m.pricing?.kind === "purchase") {
        const p = m.pricing as any;
        pricing = { kind: "purchase", price: p.price != null ? Number(p.price) : undefined };
      } else if (m.pricing?.kind === "lease") {
        const p = m.pricing as any;
        pricing = {
          kind: "lease",
          monthly: Number(p.monthly),
          termMonths: Number(p.termMonths),
          upfront: p.upfront != null ? Number(p.upfront) : undefined,
        };
      } else {
        pricing = { kind: "purchase" };
      }
      // Migrate legacy string specs → drop them (new format is Spec[])
      const specs = Array.isArray(m.specs) ? m.specs : [];
      return { ...m, pricing, specs };
    });
  } catch {
    return [];
  }
}

function saveModels(models: Model[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(models));
}

function formatCurrency(n?: number) {
  if (typeof n !== "number" || Number.isNaN(n)) return "—";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function formatPricing(p: Pricing) {
  if (p.kind === "purchase") {
    return p.price ? `Purchase: ${formatCurrency(p.price)}` : "Purchase: —";
  }
  const up = p.upfront ? `, Upfront ${formatCurrency(p.upfront)}` : "";
  return `Lease: ${formatCurrency(p.monthly)}/mo · ${p.termMonths} mo${up}`;
}

// ── Sortable spec row ─────────────────────────────────────────────────────────

function SortableSpecRow({
  spec,
  datalistId,
  onKeyChange,
  onValueChange,
  onRemove,
}: {
  spec: Spec;
  datalistId: string;
  onKeyChange: (v: string) => void;
  onValueChange: (v: string) => void;
  onRemove: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: spec.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.45 : 1,
      }}
      className="d-flex align-items-center gap-2 mb-2"
    >
      {/* Drag handle */}
      <button
        type="button"
        className="btn btn-link p-0 text-muted flex-shrink-0"
        style={{ cursor: "grab", touchAction: "none" }}
        {...attributes}
        {...listeners}
        aria-label="Drag to reorder"
      >
        <GripVertical size={16} />
      </button>

      <input
        className="form-control form-control-sm"
        placeholder="Category (e.g. Color)"
        value={spec.key}
        onChange={(e) => onKeyChange(e.target.value)}
        list={datalistId}
        style={{ flex: "0 0 38%" }}
      />
      <input
        className="form-control form-control-sm"
        placeholder="Value"
        value={spec.value}
        onChange={(e) => onValueChange(e.target.value)}
        style={{ flex: 1 }}
      />

      <button
        type="button"
        className="btn btn-link p-0 text-muted flex-shrink-0"
        onClick={onRemove}
        aria-label="Remove spec"
      >
        <X size={16} />
      </button>
    </div>
  );
}

// ── Spec editor (drag-to-reorder list) ───────────────────────────────────────

function SpecEditor({
  specs,
  onChange,
  suggestedKeys,
}: {
  specs: Spec[];
  onChange: (specs: Spec[]) => void;
  suggestedKeys: string[];
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const datalistId = "spec-keys-datalist";

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const from = specs.findIndex((s) => s.id === active.id);
      const to   = specs.findIndex((s) => s.id === over.id);
      onChange(arrayMove(specs, from, to));
    }
  }

  function update(id: string, field: "key" | "value", val: string) {
    onChange(specs.map((s) => (s.id === id ? { ...s, [field]: val } : s)));
  }

  return (
    <div>
      <datalist id={datalistId}>
        {suggestedKeys.map((k) => <option key={k} value={k} />)}
      </datalist>

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={specs.map((s) => s.id)} strategy={verticalListSortingStrategy}>
          {specs.map((spec) => (
            <SortableSpecRow
              key={spec.id}
              spec={spec}
              datalistId={datalistId}
              onKeyChange={(v) => update(spec.id, "key", v)}
              onValueChange={(v) => update(spec.id, "value", v)}
              onRemove={() => onChange(specs.filter((s) => s.id !== spec.id))}
            />
          ))}
        </SortableContext>
      </DndContext>

      <button
        type="button"
        className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1 mt-1"
        onClick={() => onChange([...specs, { id: crypto.randomUUID(), key: "", value: "" }])}
      >
        <Plus size={14} />
        Add Spec
      </button>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function Models() {
  const [models, setModels] = useState<Model[]>([]);

  const [name, setName]               = useState("");
  const [skuInternal, setSkuInternal] = useState("");
  const [hideSku, setHideSku]         = useState(false);
  const [pricingKind, setPricingKind] = useState<"purchase" | "lease">("purchase");
  const [price, setPrice]             = useState("");
  const [monthly, setMonthly]         = useState("");
  const [termMonths, setTermMonths]   = useState("");
  const [upfront, setUpfront]         = useState("");
  const [specs, setSpecs]             = useState<Spec[]>([]);
  const [imageUrl, setImageUrl]           = useState("");
  const [notesInternal, setNotesInternal] = useState("");
  const [error, setError]             = useState<string | null>(null);

  const mounted = useRef(false);

  useEffect(() => { setModels(loadModels()); }, []);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    saveModels(models);
  }, [models]);

  // All spec category names used across existing products — for suggestions
  const suggestedKeys = useMemo(() => {
    const seen = new Set<string>();
    models.forEach((m) => m.specs?.forEach((s) => { if (s.key) seen.add(s.key); }));
    return Array.from(seen).sort();
  }, [models]);

  function addModel(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) { setError("Product name is required."); return; }

    let pricing: Pricing;
    if (pricingKind === "purchase") {
      const priceNum = price ? Number(price) : undefined;
      if (price && Number.isNaN(priceNum)) { setError("Price must be a number."); return; }
      pricing = { kind: "purchase", price: priceNum };
    } else {
      const monthlyNum  = Number(monthly);
      const termNum     = Number(termMonths);
      const upfrontNum  = upfront ? Number(upfront) : undefined;
      if (monthly === "" || Number.isNaN(monthlyNum))  { setError("Monthly rate must be a number."); return; }
      if (termMonths === "" || Number.isNaN(termNum))  { setError("Term (months) must be a number."); return; }
      if (upfront && Number.isNaN(upfrontNum))         { setError("Upfront amount must be a number (or leave blank)."); return; }
      pricing = { kind: "lease", monthly: monthlyNum, termMonths: termNum, upfront: upfrontNum };
    }

    const cleanedSpecs = specs.filter((s) => s.key.trim() || s.value.trim());

    setModels((prev) => [{
      id: crypto.randomUUID(),
      name: trimmedName,
      skuInternal: skuInternal.trim() || undefined,
      hideSku,
      pricing,
      specs: cleanedSpecs.length ? cleanedSpecs : undefined,
      imageUrl: imageUrl.trim() || undefined,
      notesInternal: notesInternal.trim() || undefined,
    }, ...prev]);

    // Reset form — keep specs structure (keys) as a starting point for next product
    setName("");
    setSkuInternal("");
    setHideSku(false);
    setPricingKind("purchase");
    setPrice("");
    setMonthly("");
    setTermMonths("");
    setUpfront("");
    // Carry keys forward, clear values so the rep can fill them in
    setSpecs(cleanedSpecs.map((s) => ({ ...s, id: crypto.randomUUID(), value: "" })));
    setImageUrl("");
    setNotesInternal("");
  }

  function deleteModel(id: string) {
    setModels((prev) => prev.filter((m) => m.id !== id));
  }

  return (
    <div style={{ maxWidth: 860, margin: "0 auto" }}>
      <div className="page-enter">
        <div className="page-title">
          <Package size={24} className="page-title-icon" />
          <h1 className="mb-0">Products</h1>
        </div>

        <form onSubmit={addModel} className="mb-4">
          {/* Name */}
          <div className="mb-3">
            <label htmlFor="productName">Product Name*</label>
            <input
              id="productName"
              className="form-control"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Pro Widget 3000"
              required
            />
          </div>

          {/* SKU */}
          <div className="row g-3 mb-3">
            <div className="col-sm-6">
              <label htmlFor="skuInternal">Internal SKU</label>
              <input
                id="skuInternal"
                className="form-control"
                value={skuInternal}
                onChange={(e) => setSkuInternal(e.target.value)}
                placeholder="e.g., PW-3000-INT"
              />
            </div>
            <div className="col-sm-6 d-flex align-items-end pb-1">
              <label className="form-check-label d-flex align-items-center gap-2 mb-0">
                <input
                  type="checkbox"
                  className="form-check-input"
                  checked={hideSku}
                  onChange={(e) => setHideSku(e.target.checked)}
                />
                Hide SKU from customer emails
              </label>
            </div>
          </div>

          {/* Pricing */}
          <fieldset className="border rounded p-3 mb-3">
            <legend className="fs-6 fw-semibold float-none w-auto px-2">Pricing</legend>
            <div className="d-flex gap-4 mb-3">
              {(["purchase", "lease"] as const).map((k) => (
                <label key={k} className="form-check-label d-flex align-items-center gap-2">
                  <input
                    type="radio"
                    className="form-check-input"
                    name="pricingKind"
                    value={k}
                    checked={pricingKind === k}
                    onChange={() => setPricingKind(k)}
                  />
                  {k === "purchase" ? "One-time Purchase" : "Monthly Lease"}
                </label>
              ))}
            </div>

            {pricingKind === "purchase" ? (
              <div style={{ maxWidth: 260 }}>
                <label htmlFor="price">Price (optional)</label>
                <div className="input-group">
                  <span className="input-group-text">$</span>
                  <input id="price" type="number" step="any" className="form-control"
                    value={price} onChange={(e) => setPrice(e.target.value)} placeholder="1999.99" />
                </div>
              </div>
            ) : (
              <div className="row g-3">
                <div className="col-sm-4">
                  <label htmlFor="monthly">Monthly Rate*</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input id="monthly" type="number" step="any" className="form-control"
                      value={monthly} onChange={(e) => setMonthly(e.target.value)} placeholder="149.99" required />
                  </div>
                </div>
                <div className="col-sm-4">
                  <label htmlFor="termMonths">Term Length*</label>
                  <div className="input-group">
                    <input id="termMonths" type="number" className="form-control"
                      value={termMonths} onChange={(e) => setTermMonths(e.target.value)} placeholder="36" required />
                    <span className="input-group-text">months</span>
                  </div>
                </div>
                <div className="col-sm-4">
                  <label htmlFor="upfront">Upfront Payment (optional)</label>
                  <div className="input-group">
                    <span className="input-group-text">$</span>
                    <input id="upfront" type="number" step="any" className="form-control"
                      value={upfront} onChange={(e) => setUpfront(e.target.value)} placeholder="500" />
                  </div>
                </div>
              </div>
            )}
          </fieldset>

          {/* Specs */}
          <div className="mb-3">
            <label className="d-block mb-1">
              Product Specs
              <span className="text-muted fw-normal ms-1" style={{ fontSize: "0.8rem" }}>
                — shown to customers in emails
              </span>
            </label>
            <SpecEditor specs={specs} onChange={setSpecs} suggestedKeys={suggestedKeys} />
          </div>

          {/* Product image */}
          <div className="mb-3">
            <label className="d-block mb-1">Product Image <span className="text-muted fw-normal" style={{ fontSize: "0.8rem" }}>(optional)</span></label>
            <div className="d-flex gap-2 align-items-center mb-2">
              <label className="btn btn-outline-secondary btn-sm mb-0" style={{ cursor: "pointer" }}>
                Upload image
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: "none" }}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    const reader = new FileReader();
                    reader.onload = () => setImageUrl(reader.result as string);
                    reader.readAsDataURL(file);
                    e.target.value = "";
                  }}
                />
              </label>
              {imageUrl && (
                <button type="button" className="btn btn-link btn-sm text-danger p-0" onClick={() => setImageUrl("")}>
                  Remove
                </button>
              )}
            </div>
            <input
              id="imageUrl"
              className="form-control form-control-sm"
              value={imageUrl.startsWith("data:") ? "" : imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="…or paste an image URL"
              disabled={imageUrl.startsWith("data:")}
            />
            <div className="form-text">Shown in customer emails above the product name.</div>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Preview"
                style={{ marginTop: 8, maxHeight: 80, maxWidth: 160, borderRadius: 6, objectFit: "contain", border: "1px solid #dee2e6" }}
              />
            )}
          </div>

          {/* Internal notes */}
          <div className="mb-3">
            <label htmlFor="notesInternal">Internal Notes (not visible to customer)</label>
            <textarea
              id="notesInternal"
              className="form-control"
              value={notesInternal}
              onChange={(e) => setNotesInternal(e.target.value)}
              placeholder="Margin notes, constraints, availability, etc."
              rows={2}
            />
          </div>

          {error && <div className="alert alert-danger py-2 mb-3">{error}</div>}

          <button type="submit" className="btn btn-primary">Add Product</button>
        </form>

        {models.length === 0 ? (
          <p className="text-muted">No products yet. Add one above to get started.</p>
        ) : (
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Product Name</th>
                <th>Image</th>
                <th>Pricing</th>
                <th>Specs</th>
                <th>SKU (internal)</th>
                <th>Notes</th>
                <th className="text-end">Actions</th>
              </tr>
            </thead>
            <tbody>
              {models.map((m) => (
                <tr key={m.id}>
                  <td className="fw-semibold">{m.name}</td>
                  <td>
                    {m.imageUrl
                      ? <img src={m.imageUrl} alt={m.name} style={{ height: 36, width: 54, objectFit: "contain", borderRadius: 4, border: "1px solid #dee2e6" }} />
                      : <span className="text-muted">—</span>}
                  </td>
                  <td>{formatPricing(m.pricing)}</td>
                  <td className="text-muted small" style={{ maxWidth: 200 }}>
                    {m.specs?.length
                      ? m.specs.filter((s) => s.key).map((s) => `${s.key}: ${s.value}`).join(" · ")
                      : "—"}
                  </td>
                  <td className="text-muted">
                    {m.skuInternal
                      ? m.hideSku ? <span className="badge bg-secondary">Hidden</span> : m.skuInternal
                      : "—"}
                  </td>
                  <td style={{ maxWidth: 220 }} className="text-muted small">
                    {m.notesInternal ? <span title={m.notesInternal}>{m.notesInternal}</span> : "—"}
                  </td>
                  <td className="text-end">
                    <button
                      onClick={() => deleteModel(m.id)}
                      className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1"
                    >
                      <Trash2 size={14} />
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
