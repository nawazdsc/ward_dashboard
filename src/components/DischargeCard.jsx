import { useState, forwardRef } from "react";
import { differenceInDays, format, parseISO } from "date-fns";

const DischargeCard = forwardRef(function DischargeCard({ patient, vitals, labs, drugs, onGenerate, aiCourse, onCourseChange, onFieldChange, extraFields }, ref) {
  const [generating, setGenerating] = useState(false);
  const today = format(new Date(), "dd/MM/yyyy");
  const activeDrugs = (drugs || []).filter(d => d.is_active);
  const allLabs = (labs || []).slice(0, 30);
  const lastVitals = (vitals || [])[0];

  const getDayCount = (d) => d.start_date ? differenceInDays(new Date(), parseISO(d.start_date)) + 1 : 0;

  const handleGenerate = async () => {
    setGenerating(true);
    await onGenerate();
    setGenerating(false);
  };

  return (
    <div ref={ref} className="discharge-card">
      <style>{`
        .discharge-card { font-family: 'DM Sans', Arial, sans-serif; color: #000; padding: 24px; font-size: 12px; line-height: 1.6; }
        .discharge-card h1 { text-align: center; font-size: 18px; margin: 0 0 2px; font-weight: 700; }
        .discharge-card h2 { text-align: center; font-size: 12px; font-weight: 400; margin: 0 0 4px; color: #555; }
        .discharge-card h3 { text-align: center; font-size: 14px; margin: 8px 0; font-weight: 700; text-decoration: underline; }
        .discharge-card .hdr-line { border-top: 2px solid #000; margin: 8px 0; }
        .discharge-card .sec-title { font-weight: 700; font-size: 12px; text-transform: uppercase; margin: 12px 0 4px; border-bottom: 1px solid #999; padding-bottom: 2px; }
        .discharge-card .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 2px 20px; margin-bottom: 8px; }
        .discharge-card .info-row { display: flex; gap: 4px; font-size: 12px; }
        .discharge-card .info-label { font-weight: 700; min-width: 110px; }
        .discharge-card table { width: 100%; border-collapse: collapse; font-size: 11px; margin: 4px 0; }
        .discharge-card th, .discharge-card td { border: 1px solid #bbb; padding: 3px 6px; text-align: left; }
        .discharge-card th { background: #eee; font-weight: 700; }
        .discharge-card .editable { border: 1px dashed #aaa; padding: 6px 8px; min-height: 40px; border-radius: 4px; white-space: pre-wrap; font-size: 12px; cursor: text; }
        @media print {
          .discharge-card .no-print { display: none !important; }
          .discharge-card .editable { border: none; }
        }
        @media screen { .discharge-card { max-width: 480px; margin: 0 auto; background: #fff; } }
      `}</style>

      {/* Header */}
      <h1>CSM Hospital Kalwa</h1>
      <h2>Department of Medicine — Unit 2 ICU</h2>
      <h3>DISCHARGE SUMMARY</h3>
      <div className="hdr-line" />

      {/* Patient Info */}
      <div className="info-grid">
        <div className="info-row"><span className="info-label">Patient Name:</span> {patient.name}</div>
        <div className="info-row"><span className="info-label">Age / Sex:</span> {patient.age}y</div>
        <div className="info-row"><span className="info-label">MRD No:</span> {patient.mrd_number || "___________"}</div>
        <div className="info-row"><span className="info-label">Bed:</span> {patient.bed}</div>
        <div className="info-row"><span className="info-label">Date of Admission:</span> {patient.admit_date ? format(parseISO(patient.admit_date), "dd/MM/yyyy") : "—"}</div>
        <div className="info-row"><span className="info-label">Date of Discharge:</span> {patient.discharge_date ? format(parseISO(patient.discharge_date), "dd/MM/yyyy") : today}</div>
        <div className="info-row"><span className="info-label">Attending Doctor:</span> {patient.attending}</div>
        <div className="info-row"><span className="info-label">Duration:</span> {patient.admit_date ? `${differenceInDays(new Date(), parseISO(patient.admit_date))} days` : "—"}</div>
      </div>
      <div className="hdr-line" />

      {/* Diagnosis */}
      <div className="sec-title">Diagnosis</div>
      <div style={{ fontWeight: 600, fontSize: 13 }}>{patient.diagnosis || "—"}</div>

      {/* Hospital Course - AI Generated */}
      <div className="sec-title">
        Hospital Course
        <button className="no-print" onClick={handleGenerate} disabled={generating} style={{ marginLeft: 10, fontSize: 10, background: "#1d4ed8", color: "#fff", border: "none", borderRadius: 4, padding: "2px 8px", cursor: "pointer" }}>
          {generating ? "Generating..." : "AI Generate"}
        </button>
      </div>
      <div
        className="editable"
        contentEditable
        suppressContentEditableWarning
        onBlur={e => onCourseChange(e.target.textContent)}
      >
        {aiCourse || "Click 'AI Generate' to auto-fill hospital course, or type manually."}
      </div>

      {/* Investigations */}
      {allLabs.length > 0 && (
        <>
          <div className="sec-title">Investigations During Admission</div>
          <table>
            <thead><tr><th>Date/Time</th><th>Test</th><th>Result</th><th>Flag</th></tr></thead>
            <tbody>
              {allLabs.map((l, i) => (
                <tr key={i}>
                  <td>{l.recorded_at ? format(parseISO(l.recorded_at), "dd/MM HH:mm") : "—"}</td>
                  <td>{l.test_name}</td>
                  <td>{l.value}</td>
                  <td style={{ color: l.flag === "critical" ? "#c00" : l.flag === "high" ? "#b45309" : "#166534", fontWeight: 600 }}>{(l.flag || "").toUpperCase()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Treatment Given */}
      <div className="sec-title">Treatment Given</div>
      {activeDrugs.length === 0 && drugs?.length === 0 ? <div>—</div> : (
        <table>
          <thead><tr><th>Drug</th><th>Dose</th><th>Frequency</th><th>Route</th><th>Duration</th></tr></thead>
          <tbody>
            {(drugs || []).map((d, i) => (
              <tr key={i}>
                <td>{d.name}</td>
                <td>{d.dose}</td>
                <td>{d.frequency}</td>
                <td>{d.route}</td>
                <td>{getDayCount(d)} days</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {/* Condition at Discharge */}
      <div className="sec-title">Condition at Discharge</div>
      <div>{lastVitals ? `BP: ${lastVitals.bp || "—"}, SpO2: ${lastVitals.spo2 || "—"}%, HR: ${lastVitals.pulse || "—"}, Temp: ${lastVitals.temp || "—"}°C` : "—"}</div>
      <div>General condition: {patient.status === "stable" ? "Stable, afebrile" : patient.status || "—"}</div>

      {/* Medications at Discharge */}
      <div className="sec-title">Medications at Discharge</div>
      {activeDrugs.length === 0 ? <div>—</div> : (
        <ol style={{ paddingLeft: 20, margin: "4px 0" }}>
          {activeDrugs.map((d, i) => (
            <li key={i} style={{ marginBottom: 2 }}>
              {d.name} {d.dose} {d.frequency} ({d.route})
            </li>
          ))}
        </ol>
      )}

      {/* Follow-up, Diet, Activity */}
      <div className="sec-title">Follow-Up</div>
      <div className="editable no-print" contentEditable suppressContentEditableWarning onBlur={e => onFieldChange("followUp", e.target.textContent)}>
        {extraFields?.followUp || "After ___ days in Medicine OPD with reports."}
      </div>
      <div className="print-only" style={{ fontSize: 12 }}>{extraFields?.followUp || "After ___ days in Medicine OPD with reports."}</div>

      <div className="sec-title">Diet & Activity Advice</div>
      <div className="editable no-print" contentEditable suppressContentEditableWarning onBlur={e => onFieldChange("dietAdvice", e.target.textContent)}>
        {extraFields?.dietAdvice || "Low salt diet. Adequate hydration. Gradual mobilization."}
      </div>
      <div className="print-only" style={{ fontSize: 12 }}>{extraFields?.dietAdvice || "Low salt diet. Adequate hydration. Gradual mobilization."}</div>

      {/* Signatures */}
      <div style={{ marginTop: 30, display: "flex", justifyContent: "space-between", fontSize: 11 }}>
        <div style={{ textAlign: "center" }}>
          <div>___________________</div>
          <div>Resident Doctor</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div>___________________</div>
          <div>Unit Head</div>
        </div>
      </div>
    </div>
  );
});

export default DischargeCard;
