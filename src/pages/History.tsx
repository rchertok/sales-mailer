import { useEffect, useState } from "react";
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
    <div className="page page-enter">
      <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-4">
        <div className="page-title mb-0">
          <h1>Sent Emails</h1>
        </div>
        <div className="d-flex gap-2">
          <button onClick={refresh} className="btn btn-outline-secondary">
            Refresh
          </button>
          {items.length > 0 && (
            <button onClick={onClear} className="btn btn-outline-danger">
              Clear History
            </button>
          )}
        </div>
      </div>

      <div className="panel">
      {items.length === 0 ? (
        <p className="text-muted mb-0">No emails sent yet. Head to Compose to send your first one.</p>
      ) : (
        <>
          <h2>{items.length} email{items.length !== 1 ? "s" : ""} sent</h2>
          <div className="table-responsive">
          <table className="table table-hover align-middle">
            <thead>
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
                  <td className="text-muted text-nowrap">
                    {new Date(i.at).toLocaleString()}
                  </td>
                  <td>{i.to}</td>
                  <td>{i.subject}</td>
                  <td className="text-muted">{i.templateTitle}</td>
                  <td className="text-muted">{i.modelNames.join(", ")}</td>
                </tr>
              ))}
            </tbody>
          </table>
          </div>
        </>
      )}
      </div>
    </div>
  );
}
