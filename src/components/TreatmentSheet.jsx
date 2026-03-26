import { useState } from "react";
import { differenceInDays, format, parseISO, addDays } from "date-fns";

const INP = { width: "100%", boxSizing: "border-box", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "8px 10px", fontSize: 13, color: "#0f172a", outline: "none", fontFamily: "'DM Sans',sans-serif", background: "#fff" };
const SBTN = { background: "#0c1526", color: "#fff", border: "none", borderRadius: 10, padding: "12px 0", width: "100%", fontSize: 14, fontWeight: 700, cursor: "pointer" };
const Lbl = ({ c }) => <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.4px", marginBottom: 4 }}>{c}</div>;

export default function TreatmentSheet({ drugs, onAddDrug, onToggleDrug, patientName }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ name: "", dose: "", frequency: "", route: "IV", indication: "", planned_days: "" });
  const today = new Date();

  const activeDrugs = drugs.filter(d => d.is_active);
  const inactiveDrugs = drugs.filter(d => !d.is_active);

  const getDayCount = (drug) => {
    if (!drug.start_date) return 0;
    return differenceInDays(today, parseISO(drug.start_date)) + 1;
  };

  const getPlannedDays = (drug) => {
    if (!drug.planned_end_date || !drug.start_date) return null;
    return differenceInDays(parseISO(drug.planned_end_date), parseISO(drug.start_date)) + 1;
  };

  const getDayColor = (drug) => {
    const day = getDayCount(drug);
    const planned = getPlannedDays(drug);
    if (!planned) return "#3b82f6";
    if (day > planned) return "#ef4444";
    if (day >= planned - 1) return "#f59e0b";
    return "#10b981";
  };

  const handleAdd = () => {
    if (!form.name || !form.dose) return;
    const start_date = format(today, "yyyy-MM-dd");
    const planned_end_date = form.planned_days
      ? format(addDays(today, parseInt(form.planned_days) - 1), "yyyy-MM-dd")
      : null;
    onAddDrug({ ...form, start_date, planned_end_date, is_active: true });
    setForm({ name: "", dose: "", frequency: "", route: "IV", indication: "", planned_days: "" });
    setShow(false);
  };

  const generateDailyText = () => {
    const dateStr = format(today, "dd/MM/yy");
    return activeDrugs.map(d => {
      const day = getDayCount(d);
      const planned = getPlannedDays(d);
      const dayStr = planned ? `Day ${day}/${planned}` : `Day ${day}`;
      return `${d.name} ${d.dose} ${d.frequency} (${dayStr})`;
    }).join(", ");
  };

  return (
    <div style={{ background: "#fff", borderRadius: 11, padding: "11px 13px", marginBottom: 8, border: "1px solid #f1f5f9" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
        <span style={{ fontWeight: 700, fontSize: 11, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px" }}>Treatment Sheet</span>
        <button onClick={() => setShow(!show)} style={{ fontSize: 11, color: "#3b82f6", background: "#eff6ff", border: "1px solid #bfdbfe", padding: "3px 10px", borderRadius: 6, cursor: "pointer", fontWeight: 600 }}>+ Drug</button>
      </div>

      {/* Drug alerts */}
      {activeDrugs.filter(d => {
        const day = getDayCount(d);
        const planned = getPlannedDays(d);
        return planned && day >= planned - 1;
      }).map(d => (
        <div key={d.id} style={{ background: getDayCount(d) > getPlannedDays(d) ? "#fee2e2" : "#fef3c7", borderRadius: 6, padding: "6px 10px", marginBottom: 5, fontSize: 11, color: getDayCount(d) > getPlannedDays(d) ? "#991b1b" : "#92400e" }}>
          {getDayCount(d) > getPlannedDays(d)
            ? `Course exceeded: ${d.name} — Day ${getDayCount(d)} of ${getPlannedDays(d)}, review needed`
            : `Completing soon: ${d.name} — Day ${getDayCount(d)} of ${getPlannedDays(d)}`}
        </div>
      ))}

      {/* Daily text summary */}
      {activeDrugs.length > 0 && (
        <div style={{ background: "#f0fdf4", borderRadius: 8, padding: "8px 10px", marginBottom: 8, fontSize: 11, color: "#166534", lineHeight: 1.6 }}>
          <strong>{format(today, "dd/MM/yy")}</strong> — Continuing {generateDailyText()}
        </div>
      )}

      {/* Active drugs */}
      {activeDrugs.length === 0 && <div style={{ color: "#cbd5e1", fontSize: 13 }}>No active medications.</div>}
      {activeDrugs.map(d => {
        const day = getDayCount(d);
        const planned = getPlannedDays(d);
        const dayColor = getDayColor(d);
        return (
          <div key={d.id} style={{ display: "flex", alignItems: "center", gap: 10, padding: "8px 0", borderBottom: "1px solid #f1f5f9" }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: "#0f172a" }}>
                <span style={{ color: "#94a3b8", fontFamily: "'DM Mono',monospace", marginRight: 5, fontSize: 10 }}>Rx</span>
                {d.name} {d.dose} {d.frequency}
              </div>
              <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>{d.route} {d.indication ? `· ${d.indication}` : ""}</div>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ background: `${dayColor}15`, color: dayColor, fontSize: 11, fontWeight: 700, padding: "2px 8px", borderRadius: 12, border: `1px solid ${dayColor}33` }}>
                Day {day}{planned ? `/${planned}` : ""}
              </div>
              <button onClick={() => onToggleDrug(d.id, false)} style={{ fontSize: 10, color: "#94a3b8", background: "none", border: "none", cursor: "pointer", marginTop: 3 }}>Stop</button>
            </div>
          </div>
        );
      })}

      {/* Stopped drugs */}
      {inactiveDrugs.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <div style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginBottom: 4 }}>STOPPED</div>
          {inactiveDrugs.map(d => (
            <div key={d.id} style={{ fontSize: 12, color: "#94a3b8", padding: "4px 0", textDecoration: "line-through" }}>
              {d.name} {d.dose} {d.frequency} (Day 1–{getDayCount(d)})
              <button onClick={() => onToggleDrug(d.id, true)} style={{ fontSize: 10, color: "#3b82f6", background: "none", border: "none", cursor: "pointer", marginLeft: 8 }}>Restart</button>
            </div>
          ))}
        </div>
      )}

      {/* Add drug form */}
      {show && (
        <div style={{ marginTop: 10, background: "#f8fafc", borderRadius: 10, padding: 12, border: "1px solid #e2e8f0" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 8 }}>
            <div><Lbl c="Drug Name" /><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={INP} placeholder="Inj. Pip-Tazo" /></div>
            <div><Lbl c="Dose" /><input value={form.dose} onChange={e => setForm(f => ({ ...f, dose: e.target.value }))} style={INP} placeholder="4.5g" /></div>
            <div><Lbl c="Frequency" /><input value={form.frequency} onChange={e => setForm(f => ({ ...f, frequency: e.target.value }))} style={INP} placeholder="TDS" /></div>
            <div>
              <Lbl c="Route" />
              <select value={form.route} onChange={e => setForm(f => ({ ...f, route: e.target.value }))} style={INP}>
                {["IV", "Oral", "IM", "SC", "Nebulization", "Topical"].map(r => <option key={r}>{r}</option>)}
              </select>
            </div>
            <div><Lbl c="Indication" /><input value={form.indication} onChange={e => setForm(f => ({ ...f, indication: e.target.value }))} style={INP} placeholder="Sepsis" /></div>
            <div><Lbl c="Planned Days" /><input type="number" value={form.planned_days} onChange={e => setForm(f => ({ ...f, planned_days: e.target.value }))} style={INP} placeholder="7" /></div>
          </div>
          <button onClick={handleAdd} style={SBTN}>Add Drug</button>
        </div>
      )}
    </div>
  );
}
