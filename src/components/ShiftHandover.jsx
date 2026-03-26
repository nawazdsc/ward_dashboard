import { forwardRef } from "react";
import { format, parseISO } from "date-fns";

const ShiftHandover = forwardRef(function ShiftHandover({ patients, vitals, tasks, drugs, outgoing, incoming }, ref) {
  const now = format(new Date(), "dd/MM/yyyy HH:mm");
  const critical = patients.filter(p => p.status === "critical");
  const review = patients.filter(p => p.status === "review");
  const pendingTasks = tasks.filter(t => t.status === "pending" || t.status === "overdue");
  const overdueTasks = tasks.filter(t => t.status === "overdue");

  // Group tasks by assignee
  const tasksByAssignee = {};
  pendingTasks.forEach(t => {
    if (!tasksByAssignee[t.assigned_to]) tasksByAssignee[t.assigned_to] = [];
    tasksByAssignee[t.assigned_to].push(t);
  });

  return (
    <div ref={ref} className="shift-handover">
      <style>{`
        .shift-handover { font-family: 'DM Sans', Arial, sans-serif; color: #000; padding: 20px; font-size: 12px; line-height: 1.5; }
        .shift-handover h1 { text-align: center; font-size: 16px; margin: 0 0 2px; }
        .shift-handover h2 { text-align: center; font-size: 12px; font-weight: 400; margin: 0 0 4px; color: #555; }
        .shift-handover h3 { text-align: center; font-size: 14px; margin: 8px 0; font-weight: 700; }
        .shift-handover .hdr-line { border-top: 2px solid #000; margin: 8px 0; }
        .shift-handover .sec-title { font-weight: 700; font-size: 11px; text-transform: uppercase; margin: 10px 0 4px; color: #333; letter-spacing: 0.5px; border-bottom: 1px solid #ccc; padding-bottom: 2px; }
        .shift-handover .pt-card { border: 1px solid #ccc; border-radius: 6px; padding: 8px 10px; margin-bottom: 6px; }
        .shift-handover .critical-card { border-color: #c00; background: #fff5f5; }
        .shift-handover .review-card { border-color: #b45309; background: #fffbeb; }
        .shift-handover table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .shift-handover th, .shift-handover td { border: 1px solid #ccc; padding: 3px 5px; text-align: left; }
        .shift-handover th { background: #f0f0f0; font-weight: 700; font-size: 10px; }
        .shift-handover .overdue { color: #c00; font-weight: 700; }
        @media screen { .shift-handover { max-width: 480px; margin: 0 auto; background: #fff; } }
      `}</style>

      <h1>CSM Hospital Kalwa</h1>
      <h2>Unit 2 — ICU Shift Handover</h2>
      <h3>HANDOVER DOCUMENT</h3>
      <div className="hdr-line" />

      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
        <div><strong>Date/Time:</strong> {now}</div>
        <div><strong>Census:</strong> {patients.length} patients</div>
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8, fontSize: 12 }}>
        <div><strong>Outgoing:</strong> {outgoing || "_______________"}</div>
        <div><strong>Incoming:</strong> {incoming || "_______________"}</div>
      </div>
      <div className="hdr-line" />

      {/* Summary Strip */}
      <div style={{ display: "flex", gap: 12, marginBottom: 8, fontSize: 12 }}>
        <span style={{ color: "#c00", fontWeight: 700 }}>Critical: {critical.length}</span>
        <span style={{ color: "#b45309", fontWeight: 700 }}>Review: {review.length}</span>
        <span style={{ color: "#c00", fontWeight: 700 }}>Overdue Tasks: {overdueTasks.length}</span>
        <span>On Drips: {patients.filter(p => p.drips && (Array.isArray(p.drips) ? p.drips.length > 0 : p.drips.length > 0)).length}</span>
      </div>

      {/* Critical Patients */}
      {critical.length > 0 && (
        <>
          <div className="sec-title" style={{ color: "#c00" }}>Critical Patients — Immediate Attention</div>
          {critical.map(pt => {
            const ptVitals = (vitals[pt.id] || [])[0];
            const ptDrugs = (drugs[pt.id] || []).filter(d => d.is_active);
            return (
              <div key={pt.id} className="pt-card critical-card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                  <strong>{pt.name}</strong>
                  <span style={{ fontFamily: "monospace" }}>{pt.bed}</span>
                </div>
                <div style={{ fontSize: 11, marginBottom: 2 }}>Dx: {pt.diagnosis}</div>
                {ptVitals && (
                  <div style={{ fontSize: 11, color: "#333" }}>
                    BP: {ptVitals.bp || "—"} | SpO2: {ptVitals.spo2 || "—"}% | HR: {ptVitals.pulse || "—"} | GCS: {ptVitals.gcs || "—"} | UOP: {ptVitals.uop || "—"} ml/hr
                  </div>
                )}
                {pt.drips && <div style={{ fontSize: 11, color: "#c00" }}>Drips: {Array.isArray(pt.drips) ? pt.drips.join(", ") : pt.drips}</div>}
                {ptDrugs.length > 0 && <div style={{ fontSize: 10, color: "#555", marginTop: 2 }}>Active Rx: {ptDrugs.map(d => `${d.name} ${d.dose}`).join(", ")}</div>}
                {pt.notes && <div style={{ fontSize: 10, color: "#555", marginTop: 2, fontStyle: "italic" }}>Notes: {pt.notes.slice(0, 120)}{pt.notes.length > 120 ? "..." : ""}</div>}
              </div>
            );
          })}
        </>
      )}

      {/* Review Patients */}
      {review.length > 0 && (
        <>
          <div className="sec-title" style={{ color: "#b45309" }}>Patients for Review</div>
          {review.map(pt => (
            <div key={pt.id} className="pt-card review-card">
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <strong>{pt.name}</strong>
                <span style={{ fontFamily: "monospace" }}>{pt.bed}</span>
              </div>
              <div style={{ fontSize: 11 }}>Dx: {pt.diagnosis} | {pt.attending}</div>
            </div>
          ))}
        </>
      )}

      {/* All Patients Summary */}
      <div className="sec-title">All Patients Summary</div>
      <table>
        <thead>
          <tr><th>Bed</th><th>Name</th><th>Diagnosis</th><th>Status</th><th>Drips</th><th>Attending</th></tr>
        </thead>
        <tbody>
          {patients.map(pt => (
            <tr key={pt.id}>
              <td>{pt.bed}</td>
              <td>{pt.name}</td>
              <td>{pt.diagnosis}</td>
              <td style={{ color: pt.status === "critical" ? "#c00" : pt.status === "review" ? "#b45309" : "#166534", fontWeight: 600, textTransform: "uppercase", fontSize: 10 }}>{pt.status}</td>
              <td style={{ fontSize: 10 }}>{Array.isArray(pt.drips) ? pt.drips.length : 0}</td>
              <td style={{ fontSize: 10 }}>{pt.attending}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Pending Tasks */}
      {pendingTasks.length > 0 && (
        <>
          <div className="sec-title">Pending Tasks</div>
          {Object.entries(tasksByAssignee).map(([assignee, aTasks]) => (
            <div key={assignee} style={{ marginBottom: 6 }}>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 3 }}>{assignee} ({aTasks.length})</div>
              {aTasks.map(t => (
                <div key={t.id} style={{ fontSize: 11, paddingLeft: 10, marginBottom: 2 }} className={t.status === "overdue" ? "overdue" : ""}>
                  {t.status === "overdue" ? "!! " : "- "}{t.task} ({t.patient_name}, {t.bed}){t.due_time ? ` [Due: ${t.due_time}]` : ""}
                </div>
              ))}
            </div>
          ))}
        </>
      )}

      {/* Signatures */}
      <div style={{ marginTop: 24, display: "flex", justifyContent: "space-between", fontSize: 11 }}>
        <div style={{ textAlign: "center" }}>
          <div>___________________</div>
          <div>Outgoing Doctor</div>
          <div>Time: ___________</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div>___________________</div>
          <div>Incoming Doctor</div>
          <div>Time: ___________</div>
        </div>
      </div>
    </div>
  );
});

export default ShiftHandover;
