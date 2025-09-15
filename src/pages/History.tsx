import { useEffect, useState } from "react";
import { loadHistory, clearHistory, type SendRecord } from "../lib/history";

export default function History() {
  const [items, setItems] = useState<SendRecord[]>([]);

  function refresh() {
    setItems(loadHistory());
  }

  function onClear() {
    if (!confirm("Clear all send history?")) return;
    clearHistory();
    refresh();
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div style={{ maxWidth: 900, margin: "0 auto" }}>
      <h1>Send History</h1>

      <div style={{ marginBottom: 12, display: "flex", gap: 8 }}>
        <button onClick={refresh} style={{ padding: "8px 12px" }}>
          Refresh
        </button>
        <button onClick={onClear} style={{ padding: "8px 12px" }}>
          Clear History
        </button>
      </div>

      {items.length === 0 ? (
        <p>No sends yet.</p>
      ) : (
        <table
          width="100%"
          cellPadding={8}
          style={{ borderCollapse: "collapse" }}
        >
          <thead>
            <tr style={{ background: "#f7f7f7" }}>
              <th align="left">When</th>
              <th align="left">To</th>
              <th align="left">Subject</th>
              <th align="left">Template</th>
              <th align="left">Models</th>
            </tr>
          </thead>
          <tbody>
            {items.map((i) => (
              <tr key={i.id} style={{ borderTop: "1px solid #eee" }}>
                <td>{new Date(i.at).toLocaleString()}</td>
                <td>{i.to}</td>
                <td>{i.subject}</td>
                <td>{i.templateTitle}</td>
                <td>{i.modelNames.join(", ")}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
