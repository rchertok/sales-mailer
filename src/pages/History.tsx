import { useEffect, useState } from "react";
import { Clock } from "lucide-react";
import { loadHistory, clearHistory, type SendRecord } from "../lib/history";

export default function History() {
  const [items, setItems] = useState<SendRecord[]>([]);

  function refresh() {
    setItems(loadHistory());
  }

  function onClear() {
    if (!confirm("Clear all sent email history? This cannot be undone.")) return;
    clearHistory();
    refresh();
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="page-enter" style={{ maxWidth: 900, margin: "0 auto" }}>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div className="page-title mb-0">
          <Clock size={24} className="page-title-icon" />
          <h1 className="mb-0">Sent Emails</h1>
        </div>
        <div className="d-flex gap-2">
          <button onClick={refresh} className="btn btn-outline-secondary btn-sm">
            Refresh
          </button>
          {items.length > 0 && (
            <button onClick={onClear} className="btn btn-outline-danger btn-sm">
              Clear History
            </button>
          )}
        </div>
      </div>

      {items.length === 0 ? (
        <p className="text-muted">No emails sent yet. Head to Compose to send your first one.</p>
      ) : (
        <>
          <p className="text-muted small mb-2">{items.length} email{items.length !== 1 ? "s" : ""} sent</p>
          <table className="table table-hover align-middle">
            <thead className="table-light">
              <tr>
                <th>Date Sent</th>
                <th>Customer</th>
                <th>Subject</th>
                <th>Template</th>
                <th>Products</th>
              </tr>
            </thead>
            <tbody>
              {items.map((i) => (
                <tr key={i.id}>
                  <td className="text-muted small text-nowrap">
                    {new Date(i.at).toLocaleString()}
                  </td>
                  <td>{i.to}</td>
                  <td>{i.subject}</td>
                  <td className="text-muted">{i.templateTitle}</td>
                  <td className="text-muted small">{i.modelNames.join(", ") || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
}
