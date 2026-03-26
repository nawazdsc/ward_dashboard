import { useState, useMemo } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ReferenceArea, ResponsiveContainer } from "recharts";
import { format, parseISO } from "date-fns";

const REFERENCE_RANGES = {
  "Hemoglobin": { low: 12, high: 16, unit: "g/dL", critical_low: 7, critical_high: 20 },
  "Hb": { low: 12, high: 16, unit: "g/dL", critical_low: 7, critical_high: 20 },
  "WBC": { low: 4000, high: 11000, unit: "/uL", critical_low: 2000, critical_high: 30000 },
  "Platelet": { low: 150000, high: 400000, unit: "/uL", critical_low: 50000, critical_high: 600000 },
  "Creatinine": { low: 0.6, high: 1.2, unit: "mg/dL", critical_low: 0, critical_high: 5 },
  "Urea": { low: 15, high: 40, unit: "mg/dL", critical_low: 0, critical_high: 100 },
  "Sodium": { low: 135, high: 145, unit: "mEq/L", critical_low: 120, critical_high: 160 },
  "Potassium": { low: 3.5, high: 5.0, unit: "mEq/L", critical_low: 2.5, critical_high: 6.5 },
  "Lactate": { low: 0, high: 2.0, unit: "mmol/L", critical_low: 0, critical_high: 10 },
  "Bilirubin": { low: 0, high: 1.2, unit: "mg/dL", critical_low: 0, critical_high: 15 },
  "pH": { low: 7.35, high: 7.45, unit: "", critical_low: 7.1, critical_high: 7.6 },
  "pCO2": { low: 35, high: 45, unit: "mmHg", critical_low: 20, critical_high: 80 },
  "HCO3": { low: 22, high: 26, unit: "mEq/L", critical_low: 10, critical_high: 40 },
};

export default function LabChart({ labs, testName }) {
  const [selected, setSelected] = useState(testName || "");

  // Get unique test names
  const testNames = useMemo(() => {
    const names = new Set();
    (labs || []).forEach(l => names.add(l.test_name));
    return Array.from(names);
  }, [labs]);

  const activeTest = selected || testNames[0] || "";
  const ref = REFERENCE_RANGES[activeTest];

  // Filter and format data for chart
  const chartData = useMemo(() => {
    if (!activeTest) return [];
    return (labs || [])
      .filter(l => l.test_name === activeTest)
      .map(l => ({
        time: l.recorded_at ? format(parseISO(l.recorded_at), "dd/MM HH:mm") : "—",
        value: parseFloat(l.value) || 0,
        flag: l.flag,
        raw: l.value,
      }))
      .reverse(); // chronological order
  }, [labs, activeTest]);

  if (testNames.length === 0) {
    return (
      <div style={{ background: "#fff", borderRadius: 11, padding: "15px 13px", border: "1px solid #f1f5f9", textAlign: "center", color: "#cbd5e1", fontSize: 13 }}>
        No lab data to chart.
      </div>
    );
  }

  const hasNumericData = chartData.some(d => d.value > 0);

  return (
    <div style={{ background: "#fff", borderRadius: 11, padding: "11px 13px", marginBottom: 8, border: "1px solid #f1f5f9" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 9 }}>
        <span style={{ fontWeight: 700, fontSize: 11, color: "#0f172a", textTransform: "uppercase", letterSpacing: "0.5px" }}>Lab Trend</span>
      </div>

      {/* Test selector */}
      <div style={{ display: "flex", gap: 5, flexWrap: "wrap", marginBottom: 10 }}>
        {testNames.map(t => (
          <button
            key={t}
            onClick={() => setSelected(t)}
            style={{
              fontSize: 11, padding: "4px 10px", borderRadius: 20, cursor: "pointer", fontWeight: 600,
              background: t === activeTest ? "#0f172a" : "#f1f5f9",
              color: t === activeTest ? "#fff" : "#64748b",
              border: t === activeTest ? "none" : "1px solid #e2e8f0",
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Chart */}
      {hasNumericData ? (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData} margin={{ top: 5, right: 10, left: -15, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
            <XAxis dataKey="time" tick={{ fontSize: 9, fill: "#94a3b8" }} interval="preserveStartEnd" />
            <YAxis tick={{ fontSize: 10, fill: "#94a3b8" }} />
            <Tooltip
              contentStyle={{ fontSize: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}
              formatter={(value, name) => [value + (ref?.unit ? ` ${ref.unit}` : ""), activeTest]}
            />
            {ref && (
              <ReferenceArea y1={ref.low} y2={ref.high} fill="#10b981" fillOpacity={0.08} />
            )}
            {ref?.critical_high && (
              <ReferenceLine y={ref.critical_high} stroke="#ef4444" strokeDasharray="4 4" label={{ value: "CRIT", fontSize: 9, fill: "#ef4444" }} />
            )}
            {ref?.critical_low > 0 && (
              <ReferenceLine y={ref.critical_low} stroke="#ef4444" strokeDasharray="4 4" />
            )}
            <Line
              type="monotone"
              dataKey="value"
              stroke="#3b82f6"
              strokeWidth={2}
              dot={{ r: 4, fill: "#3b82f6" }}
              activeDot={{ r: 6, fill: "#1d4ed8" }}
            />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div style={{ textAlign: "center", color: "#94a3b8", fontSize: 12, padding: 20 }}>
          Non-numeric values — cannot chart "{activeTest}"
        </div>
      )}

      {/* Reference range info */}
      {ref && (
        <div style={{ fontSize: 10, color: "#64748b", marginTop: 6, display: "flex", gap: 10 }}>
          <span>Normal: {ref.low}–{ref.high} {ref.unit}</span>
          {ref.critical_high && <span style={{ color: "#ef4444" }}>Critical: &gt;{ref.critical_high} {ref.unit}</span>}
        </div>
      )}

      {/* Data table */}
      <div style={{ marginTop: 8, overflowX: "auto" }}>
        <table style={{ width: "100%", fontSize: 11, borderCollapse: "collapse", fontFamily: "'DM Mono',monospace" }}>
          <thead>
            <tr style={{ background: "#f8fafc" }}>
              <th style={{ padding: "4px 6px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 10, borderBottom: "1px solid #e2e8f0" }}>Time</th>
              <th style={{ padding: "4px 6px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 10, borderBottom: "1px solid #e2e8f0" }}>Value</th>
              <th style={{ padding: "4px 6px", textAlign: "left", color: "#64748b", fontWeight: 600, fontSize: 10, borderBottom: "1px solid #e2e8f0" }}>Flag</th>
            </tr>
          </thead>
          <tbody>
            {chartData.map((d, i) => (
              <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "4px 6px", color: "#64748b" }}>{d.time}</td>
                <td style={{ padding: "4px 6px", color: "#0f172a", fontWeight: 600 }}>{d.raw}</td>
                <td style={{ padding: "4px 6px" }}>
                  <span style={{
                    fontSize: 9, padding: "1px 6px", borderRadius: 10, fontWeight: 700,
                    background: d.flag === "critical" ? "#fee2e2" : d.flag === "high" ? "#fef3c7" : "#f0fdf4",
                    color: d.flag === "critical" ? "#991b1b" : d.flag === "high" ? "#92400e" : "#166534",
                  }}>
                    {(d.flag || "normal").toUpperCase()}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
