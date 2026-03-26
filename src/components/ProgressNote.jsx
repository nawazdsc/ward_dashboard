import { useState } from "react";

const SBTN = { background: "#0c1526", color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", width: "100%", fontSize: 14, fontWeight: 700, cursor: "pointer" };

export default function ProgressNote({ patient, vitals, labs, drugs, existingNotes, onSave, onGenerateAI }) {
  const [note, setNote] = useState(existingNotes || "");
  const [generating, setGenerating] = useState(false);
  const [subjective, setSubjective] = useState("");

  const latestVitals = (vitals || []).slice(0, 3);
  const todayLabs = (labs || []).slice(0, 5);
  const activeDrugs = (drugs || []).filter(d => d.is_active);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const result = await onGenerateAI(subjective);
      if (result) setNote(result);
    } catch { /* handled upstream */ }
    setGenerating(false);
  };

  // Auto-build Objective section
  const buildObjective = () => {
    const lines = [];
    if (latestVitals.length > 0) {
      const v = latestVitals[0];
      lines.push(`Vitals: BP ${v.bp || "—"}, SpO2 ${v.spo2 || "—"}%, HR ${v.pulse || "—"}, Temp ${v.temp || "—"}°C, RR ${v.rr || "—"}, GCS ${v.gcs || "—"}/15, UOP ${v.uop || "—"} ml/hr, RBS ${v.rbs || "—"} mg/dL`);
    }
    if (todayLabs.length > 0) {
      lines.push("Labs: " + todayLabs.map(l => `${l.test_name}: ${l.value} [${(l.flag || "normal").toUpperCase()}]`).join(", "));
    }
    if (activeDrugs.length > 0) {
      lines.push("Meds: " + activeDrugs.map(d => `${d.name} ${d.dose} ${d.frequency}`).join(", "));
    }
    return lines.join("\n");
  };

  return (
    <div style={{ background: "#fff", borderRadius: 11, padding: "11px 13px", marginBottom: 8, border: "1px solid #f1f5f9" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
        <span style={{ fontWeight: 700, fontSize: 11, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px" }}>Progress Note</span>
        <button
          onClick={handleGenerate}
          disabled={generating}
          style={{ fontSize: 11, color: "#fff", background: generating ? "#94a3b8" : "#1d4ed8", border: "none", padding: "4px 12px", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}
        >
          {generating ? "Generating..." : "AI Generate SOAP"}
        </button>
      </div>

      {/* Subjective input */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>S — Subjective</div>
        <input
          value={subjective}
          onChange={e => setSubjective(e.target.value)}
          placeholder="Patient complaints, history updates..."
          style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", fontFamily: "'DM Sans',sans-serif" }}
        />
      </div>

      {/* Auto Objective */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>O — Objective (Auto)</div>
        <div style={{ background: "#f8fafc", borderRadius: 8, padding: "8px 10px", fontSize: 12, color: "#334155", lineHeight: 1.6, whiteSpace: "pre-wrap", border: "1px solid #e2e8f0" }}>
          {buildObjective() || "No vitals/labs recorded yet."}
        </div>
      </div>

      {/* Full SOAP note */}
      <div style={{ marginBottom: 8 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: 4 }}>Full Note (A + P editable)</div>
        <textarea
          value={note}
          onChange={e => setNote(e.target.value)}
          rows={10}
          placeholder={"A — Assessment:\n\nP — Plan:\n"}
          style={{ width: "100%", boxSizing: "border-box", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, outline: "none", fontFamily: "'DM Sans',sans-serif", resize: "vertical", lineHeight: 1.7 }}
        />
      </div>

      <button onClick={() => onSave(note, subjective)} style={SBTN}>Save Progress Note</button>
    </div>
  );
}
