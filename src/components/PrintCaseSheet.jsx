import { forwardRef } from "react";
import { differenceInDays, format, parseISO } from "date-fns";

const PrintCaseSheet = forwardRef(function PrintCaseSheet({ patient, vitals, labs, drugs, tasks }, ref) {
  const today = format(new Date(), "dd/MM/yyyy");
  const activeDrugs = (drugs || []).filter(d => d.is_active);
  const todayVitals = (vitals || []).slice(0, 12); // last 12 entries
  const critLabs = (labs || []).filter(l => l.flag === "critical").slice(0, 5);

  const getDayCount = (d) => d.start_date ? differenceInDays(new Date(), parseISO(d.start_date)) + 1 : 0;
  const getPlannedDays = (d) => d.planned_end_date && d.start_date ? differenceInDays(parseISO(d.planned_end_date), parseISO(d.start_date)) + 1 : null;

  return (
    <div ref={ref} className="print-case-sheet">
      <style>{`
        .print-case-sheet { font-family: 'DM Sans', Arial, sans-serif; color: #000; padding: 20px; font-size: 12px; line-height: 1.5; }
        .print-case-sheet h1 { text-align: center; font-size: 16px; margin: 0 0 2px; }
        .print-case-sheet h2 { text-align: center; font-size: 12px; font-weight: 400; margin: 0 0 8px; color: #555; }
        .print-case-sheet .divider { border-top: 2px solid #000; margin: 8px 0; }
        .print-case-sheet .thin-divider { border-top: 1px solid #ccc; margin: 6px 0; }
        .print-case-sheet .section-title { font-weight: 700; font-size: 11px; text-transform: uppercase; color: #333; margin: 10px 0 4px; letter-spacing: 0.5px; }
        .print-case-sheet .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 16px; }
        .print-case-sheet .info-row { display: flex; gap: 4px; }
        .print-case-sheet .info-label { font-weight: 700; min-width: 80px; }
        .print-case-sheet table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .print-case-sheet th, .print-case-sheet td { border: 1px solid #ccc; padding: 3px 5px; text-align: left; }
        .print-case-sheet th { background: #f0f0f0; font-weight: 700; font-size: 10px; }
        .print-case-sheet .critical { color: #c00; font-weight: 700; }
        @media screen { .print-case-sheet { max-width: 480px; margin: 0 auto; background: #fff; } }
      `}</style>

      {/* Header */}
      <h1>CSM Hospital Kalwa</h1>
      <h2>Unit 2 — Intensive Care Unit</h2>
      <div className="divider" />

      {/* Patient Info */}
      <div className="info-grid">
        <div className="info-row"><span className="info-label">Name:</span> {patient.name}</div>
        <div className="info-row"><span className="info-label">Bed:</span> {patient.bed}</div>
        <div className="info-row"><span className="info-label">Age:</span> {patient.age}y</div>
        <div className="info-row"><span className="info-label">MRD No:</span> {patient.mrd_number || "—"}</div>
        <div className="info-row"><span className="info-label">Diagnosis:</span> {patient.diagnosis}</div>
        <div className="info-row"><span className="info-label">Attending:</span> {patient.attending}</div>
        <div className="info-row"><span className="info-label">Admit Date:</span> {patient.admit_date ? format(parseISO(patient.admit_date), "dd/MM/yyyy") : "—"}</div>
        <div className="info-row"><span className="info-label">Status:</span> {(patient.status || "").toUpperCase()}</div>
      </div>
      <div className="divider" />

      {/* Date */}
      <div style={{ textAlign: "center", fontWeight: 700, fontSize: 13, margin: "6px 0" }}>Daily Case Sheet — {today}</div>

      {/* Drips */}
      {patient.drips && (
        <>
          <div className="section-title">Active Drips</div>
          <div style={{ color: "#c00", fontWeight: 600 }}>{Array.isArray(patient.drips) ? patient.drips.join(" | ") : patient.drips}</div>
          <div className="thin-divider" />
        </>
      )}

      {/* Vitals */}
      {todayVitals.length > 0 && (
        <>
          <div className="section-title">Vitals</div>
          <table>
            <thead>
              <tr>
                <th>Time</th><th>BP</th><th>SpO2</th><th>HR</th><th>Temp</th><th>RR</th><th>GCS</th><th>UOP</th><th>RBS</th>
              </tr>
            </thead>
            <tbody>
              {todayVitals.map((v, i) => (
                <tr key={i}>
                  <td>{v.recorded_at ? format(parseISO(v.recorded_at), "HH:mm") : "—"}</td>
                  <td className={parseInt(v.bp) < 90 ? "critical" : ""}>{v.bp || "—"}</td>
                  <td className={parseFloat(v.spo2) < 93 ? "critical" : ""}>{v.spo2 || "—"}</td>
                  <td className={parseFloat(v.pulse) > 110 ? "critical" : ""}>{v.pulse || "—"}</td>
                  <td className={parseFloat(v.temp) > 38.5 ? "critical" : ""}>{v.temp || "—"}</td>
                  <td>{v.rr || "—"}</td>
                  <td className={parseFloat(v.gcs) < 13 ? "critical" : ""}>{v.gcs || "—"}</td>
                  <td className={parseFloat(v.uop) < 20 ? "critical" : ""}>{v.uop || "—"}</td>
                  <td>{v.rbs || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="thin-divider" />
        </>
      )}

      {/* Medications with Day Counter */}
      <div className="section-title">Medications</div>
      {activeDrugs.length === 0 ? <div>None</div> : (
        <table>
          <thead><tr><th>Drug</th><th>Dose</th><th>Freq</th><th>Route</th><th>Day</th></tr></thead>
          <tbody>
            {activeDrugs.map((d, i) => {
              const day = getDayCount(d);
              const planned = getPlannedDays(d);
              return (
                <tr key={i}>
                  <td>{d.name}</td>
                  <td>{d.dose}</td>
                  <td>{d.frequency}</td>
                  <td>{d.route}</td>
                  <td className={planned && day >= planned ? "critical" : ""}>{day}{planned ? `/${planned}` : ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
      <div className="thin-divider" />

      {/* Critical Labs */}
      {critLabs.length > 0 && (
        <>
          <div className="section-title">Critical Lab Results</div>
          {critLabs.map((l, i) => (
            <div key={i} className="critical" style={{ fontSize: 11 }}>
              [{l.recorded_at ? format(parseISO(l.recorded_at), "HH:mm") : "—"}] {l.test_name}: {l.value}
            </div>
          ))}
          <div className="thin-divider" />
        </>
      )}

      {/* Notes */}
      {patient.notes && (
        <>
          <div className="section-title">Doctor Notes</div>
          <div style={{ whiteSpace: "pre-wrap", fontSize: 11 }}>{patient.notes}</div>
          <div className="thin-divider" />
        </>
      )}

      {/* Monitoring Protocols */}
      {patient.monitors && JSON.parse(JSON.stringify(patient.monitors || [])).length > 0 && (
        <>
          <div className="section-title">Active Monitoring Protocols</div>
          <div style={{ fontSize: 11 }}>{(Array.isArray(patient.monitors) ? patient.monitors : []).join(", ")}</div>
        </>
      )}

      {/* Footer */}
      <div style={{ marginTop: 20, borderTop: "1px solid #000", paddingTop: 8, display: "flex", justifyContent: "space-between", fontSize: 11 }}>
        <div>Doctor's Signature: _______________</div>
        <div>Date: {today}</div>
      </div>
    </div>
  );
});

export default PrintCaseSheet;
