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
import { Copy, GripVertical, Pencil, Plus, Trash2, X } from "lucide-react";
import type { Model, Pricing, Spec } from "../types";
import { Modal } from "react-bootstrap";
import { useNavigate, useSearchParams } from "react-router-dom";
import { userStorage } from "../lib/storage";

const STORAGE_KEY = "models";

function loadModels(): Model[] {
  try {
    const raw = userStorage.getItem(STORAGE_KEY);
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
      // Older saves stored specs as plain strings; drop those (new format is Spec[])
      const specs = Array.isArray(m.specs) ? m.specs : [];
      return { ...m, pricing, specs };
    });
  } catch {
    return [];
  }
}

function saveModels(models: Model[]) {
  userStorage.setItem(STORAGE_KEY, JSON.stringify(models));
}

function formatCurrency(n?: number) {
  if (typeof n !== "number" || Number.isNaN(n)) return "";
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function formatPricing(p: Pricing) {
  if (p.kind === "purchase") {
    return p.price ? `${formatCurrency(p.price)} one-time` : "One-time, no price set";
  }
  const up = p.upfront ? `, ${formatCurrency(p.upfront)} upfront` : "";
  return `${formatCurrency(p.monthly)}/month for ${p.termMonths} months${up}`;
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
        className="form-control"
        placeholder="Label (e.g. Color)"
        value={spec.key}
        onChange={(e) => onKeyChange(e.target.value)}
        list={datalistId}
        style={{ flex: "0 0 38%" }}
      />
      <input
        className="form-control"
        placeholder="Value (e.g. Silver)"
        value={spec.value}
        onChange={(e) => onValueChange(e.target.value)}
        style={{ flex: 1 }}
      />

      <button
        type="button"
        className="btn btn-link p-0 text-muted flex-shrink-0"
        onClick={onRemove}
        aria-label="Remove detail"
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
        className="btn btn-outline-secondary d-inline-flex align-items-center gap-1 mt-1"
        onClick={() => onChange([...specs, { id: crypto.randomUUID(), key: "", value: "" }])}
      >
        <Plus size={14} />
        Add Detail
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
  const [productUrl, setProductUrl]       = useState("");
  const [notesInternal, setNotesInternal] = useState("");
  const [error, setError]             = useState<string | null>(null);
  const [editingId, setEditingId]     = useState<string | null>(null);

  const mounted = useRef(false);

  useEffect(() => { setModels(loadModels()); }, []);
  useEffect(() => {
    if (!mounted.current) { mounted.current = true; return; }
    saveModels(models);
  }, [models]);

  // Every detail label used on existing products, offered as suggestions
  const suggestedKeys = useMemo(() => {
    const seen = new Set<string>();
    models.forEach((m) => m.specs?.forEach((s) => { if (s.key) seen.add(s.key); }));
    return Array.from(seen).sort();
  }, [models]);

  // ?new=1 opens the form right away (used by the links on Compose)
  const [params, setParams] = useSearchParams();
  const navigate = useNavigate();
  const fromCompose = params.get("from") === "compose";
  const [showForm, setShowForm] = useState(params.get("new") === "1");

  function clearParams() {
    if (params.has("new")) setParams({}, { replace: true });
  }

  function loadIntoForm(m: Model, keepOriginal = false) {
    setEditingId(keepOriginal ? null : m.id);
    setName(m.name);
    setSkuInternal(m.skuInternal ?? "");
    setHideSku(m.hideSku ?? false);
    setPricingKind(m.pricing.kind);
    if (m.pricing.kind === "purchase") {
      setPrice(m.pricing.price != null ? String(m.pricing.price) : "");
      setMonthly(""); setTermMonths(""); setUpfront("");
    } else {
      setMonthly(String(m.pricing.monthly));
      setTermMonths(String(m.pricing.termMonths));
      setUpfront(m.pricing.upfront != null ? String(m.pricing.upfront) : "");
      setPrice("");
    }
    setSpecs(m.specs?.map((s) => ({ ...s })) ?? []);
    setImageUrl(m.imageUrl ?? "");
    setProductUrl(m.productUrl ?? "");
    setNotesInternal(m.notesInternal ?? "");
    setError(null);
    setShowForm(true);
  }

  function addModel(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const trimmedName = name.trim();
    if (!trimmedName) { setError("Product name is required."); return; }

    const duplicate = models.some(
      (m) => m.name.toLowerCase() === trimmedName.toLowerCase() && m.id !== editingId
    );
    if (duplicate) { setError(`A product named "${trimmedName}" already exists.`); return; }

    let pricing: Pricing;
    if (pricingKind === "purchase") {
      const priceNum = price ? Number(price) : undefined;
      if (price && Number.isNaN(priceNum)) { setError("Price must be a number."); return; }
      pricing = { kind: "purchase", price: priceNum };
    } else {
      const monthlyNum  = Number(monthly);
      const termNum     = Number(termMonths);
      const upfrontNum  = upfront ? Number(upfront) : undefined;
      if (monthly === "" || Number.isNaN(monthlyNum))  { setError("Monthly payment must be a number."); return; }
      if (termMonths === "" || Number.isNaN(termNum))  { setError("Term length must be a number of months."); return; }
      if (upfront && Number.isNaN(upfrontNum))         { setError("Upfront amount must be a number (or leave blank)."); return; }
      pricing = { kind: "lease", monthly: monthlyNum, termMonths: termNum, upfront: upfrontNum };
    }

    const cleanedSpecs = specs.filter((s) => s.key.trim() || s.value.trim());

    const updated: Model = {
      id: editingId ?? crypto.randomUUID(),
      name: trimmedName,
      skuInternal: skuInternal.trim() || undefined,
      hideSku,
      pricing,
      specs: cleanedSpecs.length ? cleanedSpecs : undefined,
      imageUrl: imageUrl || undefined,
      productUrl: productUrl.trim() || undefined,
      notesInternal: notesInternal.trim() || undefined,
    };

    if (editingId) {
      const next = models.map((m) => (m.id === editingId ? updated : m));
      saveModels(next); // save now: we may leave this page before the effect runs
      setModels(next);
    } else {
      const next = [updated, ...models];
      saveModels(next); // save now: we may leave this page before the effect runs
      setModels(next);
    }

    // Reset the form, keeping the detail labels as a starting point for the next product
    setEditingId(null);
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
    setProductUrl("");
    setNotesInternal("");
    setShowForm(false);
    if (fromCompose) navigate("/compose", { state: editingId ? null : { newProductId: updated.id } });
    else clearParams();
  }

  function deleteModel(id: string) {
    if (editingId === id) setEditingId(null);
    setModels((prev) => prev.filter((m) => m.id !== id));
  }

  function cancelEdit() {
    setEditingId(null);
    setName(""); setSkuInternal(""); setHideSku(false);
    setPricingKind("purchase"); setPrice(""); setMonthly("");
    setTermMonths(""); setUpfront(""); setSpecs([]);
    setImageUrl(""); setProductUrl(""); setNotesInternal(""); setError(null);
    setShowForm(false);
    clearParams();
  }

  function openNew() {
    if (editingId) cancelEdit();
    setShowForm(true);
  }

  return (
    <div className="page page-enter">
      <div className="page-title">
        <h1>Products</h1>
      </div>

      <Modal show={showForm} onHide={cancelEdit} size="xl" centered>
      <form onSubmit={addModel}>
        <Modal.Header closeButton>
          <Modal.Title as="h1">{editingId ? "Edit Product" : "New Product"}</Modal.Title>
        </Modal.Header>
        <Modal.Body>

        {/* Name + item number */}
        <div className="row g-4 mb-4">
          <div className="col-lg-6">
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
          <div className="col-lg-3 col-sm-6">
            <label htmlFor="skuInternal">Item Number (optional)</label>
            <input
              id="skuInternal"
              className="form-control"
              value={skuInternal}
              onChange={(e) => setSkuInternal(e.target.value)}
              placeholder="e.g., PW-3000"
            />
          </div>
          <div className="col-lg-3 col-sm-6 d-flex align-items-end pb-2">
            <label className="form-check-label d-flex align-items-center gap-2 mb-0">
              <input
                type="checkbox"
                className="form-check-input"
                checked={hideSku}
                onChange={(e) => setHideSku(e.target.checked)}
              />
              Hide item number in customer emails
            </label>
          </div>
        </div>

        {/* Pricing + details */}
        <div className="row g-4 mb-4">
          <div className="col-lg-6">
            <fieldset className="border rounded p-3 h-100">
              <legend className="float-none w-auto px-2 mb-2">Pricing</legend>
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
                    <label htmlFor="monthly">Monthly Payment*</label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input id="monthly" type="number" step="any" className="form-control"
                        value={monthly} onChange={(e) => setMonthly(e.target.value)} placeholder="149.99" required />
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <label htmlFor="termMonths">Length*</label>
                    <div className="input-group">
                      <input id="termMonths" type="number" className="form-control"
                        value={termMonths} onChange={(e) => setTermMonths(e.target.value)} placeholder="36" required />
                      <span className="input-group-text">months</span>
                    </div>
                  </div>
                  <div className="col-sm-4">
                    <label htmlFor="upfront">Upfront (optional)</label>
                    <div className="input-group">
                      <span className="input-group-text">$</span>
                      <input id="upfront" type="number" step="any" className="form-control"
                        value={upfront} onChange={(e) => setUpfront(e.target.value)} placeholder="500" />
                    </div>
                  </div>
                </div>
              )}
            </fieldset>
          </div>

          <div className="col-lg-6">
            <label>Product Details <span className="text-muted fw-normal">(shown in customer emails)</span></label>
            <SpecEditor specs={specs} onChange={setSpecs} suggestedKeys={suggestedKeys} />
          </div>
        </div>

        {/* Image, link, notes */}
        <div className="row g-4 mb-4">
          <div className="col-lg-4">
            <label>Product Image <span className="text-muted fw-normal">(optional)</span></label>
            <div className="d-flex gap-2 align-items-center mb-2">
              <label className="btn btn-outline-secondary mb-0" style={{ cursor: "pointer" }}>
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
                <button type="button" className="btn btn-link text-danger p-0" onClick={() => setImageUrl("")}>
                  Remove
                </button>
              )}
            </div>
            <input
              id="imageUrl"
              className="form-control"
              value={imageUrl.startsWith("data:") ? "" : imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="or paste a link to an image"
              aria-label="Image link"
              disabled={imageUrl.startsWith("data:")}
            />
            <div className="form-text">Shows in customer emails above the product name.</div>
            {imageUrl && (
              <img
                src={imageUrl}
                alt="Preview"
                style={{ marginTop: 8, maxHeight: 80, maxWidth: 160, borderRadius: 6, objectFit: "contain", border: "1px solid #dee2e6" }}
              />
            )}
          </div>

          <div className="col-lg-4">
            <label htmlFor="productUrl">Product Page <span className="text-muted fw-normal">(optional)</span></label>
            <input
              id="productUrl"
              className="form-control"
              value={productUrl}
              onChange={(e) => setProductUrl(e.target.value)}
              placeholder="https://yourcompany.com/product-page"
            />
            <div className="form-text">Adds a "See product details" link in customer emails.</div>
          </div>

          <div className="col-lg-4">
            <label htmlFor="notesInternal">Private Notes <span className="text-muted fw-normal">(only you see these)</span></label>
            <textarea
              id="notesInternal"
              className="form-control"
              value={notesInternal}
              onChange={(e) => setNotesInternal(e.target.value)}
              placeholder="Margins, availability, anything to remember"
              rows={3}
            />
          </div>
        </div>

        {error && <div className="alert alert-danger py-2 mb-0">{error}</div>}
        </Modal.Body>
        <Modal.Footer>
          <button type="button" className="btn btn-outline-secondary" onClick={cancelEdit}>
            Cancel
          </button>
          <button type="submit" className="btn btn-primary">
            {editingId ? "Save Changes" : fromCompose ? "Add and Go Back to Compose" : "Add Product"}
          </button>
        </Modal.Footer>
      </form>
      </Modal>

      <div className="panel">
        <div className="panel-head">
          <h2>Your Products</h2>
          <button type="button" className="btn btn-primary d-inline-flex align-items-center gap-2" onClick={openNew}>
            <Plus size={16} />
            Create New Product
          </button>
        </div>
        {models.length === 0 ? (
          <p className="text-muted mb-0">No products yet. Create one to get started.</p>
        ) : (
          <div className="table-responsive">
            <table className="table table-hover align-middle">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Image</th>
                  <th>Price</th>
                  <th>Details</th>
                  <th>Item Number</th>
                  <th>Private Notes</th>
                  <th className="text-end"></th>
                </tr>
              </thead>
              <tbody>
                {models.map((m) => (
                  <tr key={m.id}>
                    <td className="fw-semibold">{m.name}</td>
                    <td>
                      {m.imageUrl && (
                        <img src={m.imageUrl} alt={m.name} style={{ height: 36, width: 54, objectFit: "contain", borderRadius: 4, border: "1px solid #dee2e6" }} />
                      )}
                    </td>
                    <td>{formatPricing(m.pricing)}</td>
                    <td className="text-muted" style={{ maxWidth: 260 }}>
                      {m.specs?.filter((s) => s.key).map((s) => `${s.key}: ${s.value}`).join(" · ")}
                    </td>
                    <td className="text-muted">
                      {m.skuInternal && (
                        <>
                          {m.skuInternal}
                          {m.hideSku && <span className="badge bg-secondary ms-2">Hidden</span>}
                        </>
                      )}
                    </td>
                    <td style={{ maxWidth: 240 }} className="text-muted">
                      {m.notesInternal && <span title={m.notesInternal}>{m.notesInternal}</span>}
                    </td>
                    <td className="text-end">
                      <div className="d-flex gap-1 justify-content-end">
                        <button
                          onClick={() => loadIntoForm(m, false)}
                          className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                        >
                          <Pencil size={14} />
                          Edit
                        </button>
                        <button
                          onClick={() => loadIntoForm(m, true)}
                          className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
                          title="Start a new product with these details filled in"
                        >
                          <Copy size={14} />
                          Duplicate
                        </button>
                        <button
                          onClick={() => deleteModel(m.id)}
                          className="btn btn-outline-danger btn-sm d-inline-flex align-items-center gap-1"
                        >
                          <Trash2 size={14} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
