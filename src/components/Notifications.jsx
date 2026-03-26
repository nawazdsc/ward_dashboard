import { useState, useEffect, useCallback } from "react";

export default function Notifications({ tasks, patients, onDismiss }) {
  const [toasts, setToasts] = useState([]);
  const [permission, setPermission] = useState("default");
  const [dismissed, setDismissed] = useState(new Set());

  // Request notification permission
  useEffect(() => {
    if ("Notification" in window) {
      setPermission(Notification.permission);
      if (Notification.permission === "default") {
        Notification.requestPermission().then(p => setPermission(p));
      }
    }
  }, []);

  const addToast = useCallback((msg, type = "warning") => {
    const id = `${msg}_${Date.now()}`;
    if (dismissed.has(msg)) return;
    setToasts(prev => {
      if (prev.some(t => t.msg === msg)) return prev;
      return [...prev, { id, msg, type, time: Date.now() }];
    });

    // Browser notification
    if (permission === "granted") {
      try {
        new Notification("Ward Alert", { body: msg, icon: "/favicon.svg", tag: msg });
      } catch { /* mobile may not support */ }
    }
  }, [permission, dismissed]);

  // Check for overdue tasks and critical conditions every 60s
  useEffect(() => {
    const check = () => {
      const now = new Date();
      (tasks || []).forEach(t => {
        if (t.status === "overdue") {
          addToast(`Overdue: ${t.task} (${t.patient_name || "—"}) — assigned to ${t.assigned_to}`);
        }
        if (t.status === "pending" && t.due_time) {
          const [h, m] = t.due_time.split(":").map(Number);
          if (!isNaN(h) && !isNaN(m)) {
            const due = new Date();
            due.setHours(h, m, 0, 0);
            if (now > due) {
              addToast(`Task past due: ${t.task} (${t.patient_name || "—"}) was due at ${t.due_time}`);
            }
          }
        }
      });

      (patients || []).forEach(p => {
        if (p.status === "critical" && parseInt(p.spo2) > 0 && parseInt(p.spo2) < 90) {
          addToast(`Critical SpO2: ${p.name} (${p.bed}) — SpO2 ${p.spo2}%`, "critical");
        }
        if (p.status === "critical" && parseInt(p.bp) > 0 && parseInt(p.bp) < 80) {
          addToast(`Hypotension: ${p.name} (${p.bed}) — BP ${p.bp}`, "critical");
        }
      });
    };

    check();
    const interval = setInterval(check, 60000);
    return () => clearInterval(interval);
  }, [tasks, patients, addToast]);

  // Auto-dismiss after 15s
  useEffect(() => {
    const interval = setInterval(() => {
      setToasts(prev => prev.filter(t => Date.now() - t.time < 15000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const dismiss = (toast) => {
    setToasts(prev => prev.filter(t => t.id !== toast.id));
    setDismissed(prev => new Set(prev).add(toast.msg));
    if (onDismiss) onDismiss(toast);
  };

  if (toasts.length === 0) return null;

  return (
    <div style={{ position: "fixed", top: 70, right: 10, left: 10, maxWidth: 460, margin: "0 auto", zIndex: 300, display: "flex", flexDirection: "column", gap: 6 }}>
      {toasts.slice(0, 5).map(t => (
        <div
          key={t.id}
          style={{
            background: t.type === "critical" ? "#450a0a" : "#451a03",
            color: t.type === "critical" ? "#fca5a5" : "#fed7aa",
            borderRadius: 10,
            padding: "10px 14px",
            fontSize: 12,
            lineHeight: 1.5,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 8,
            border: `1px solid ${t.type === "critical" ? "#7f1d1d" : "#92400e"}`,
            boxShadow: "0 4px 12px rgba(0,0,0,0.3)",
            animation: "slideIn 0.3s ease-out",
          }}
        >
          <span>{t.type === "critical" ? "!!" : "!"} {t.msg}</span>
          <button
            onClick={() => dismiss(t)}
            style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: 14, flexShrink: 0 }}
          >
            x
          </button>
        </div>
      ))}
    </div>
  );
}
