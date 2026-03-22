// Shared types across the app

export type Spec = {
  id: string;    // stable key for drag-and-drop
  key: string;   // category name, e.g. "Color"
  value: string; // e.g. "Blue"
};

export type Pricing =
  | { kind: "purchase"; price?: number }
  | { kind: "lease"; monthly: number; termMonths: number; upfront?: number };

export type Model = {
  id: string;
  name: string;
  skuInternal?: string;
  hideSku?: boolean;
  pricing: Pricing;
  specs?: Spec[];        // customer-facing spec rows shown in emails
  imageUrl?: string;
  notesInternal?: string;
};

export type SendRecord = {
  id: string;
  at: string; // ISO timestamp
  to: string;
  subject: string;
  templateTitle: string;
  modelNames: string[];
};
