import { forwardRef, useState, useEffect } from "react";
import { differenceInDays, format, parseISO } from "date-fns";

const ContinuationSheet = forwardRef(function ContinuationSheet({
  patient, vitals, labs, drugs, tasks, formData
}, ref) {
  const today = new Date();
  const todayStr = format(today, "dd/MM/yyyy");
  const timeStr = format(today, "HH:mm");
  const admitDate = patient.admit_date ? parseISO(patient.admit_date) : today;
  const dayOfICU = differenceInDays(today, admitDate) + 1;

  const form = formData || {};

  // Auto-fill from latest vitals
  const latestV = (vitals || [])[0];
  const activeDrugs = (drugs || []).filter(d => d.is_active);
  const todayLabs = (labs || []).slice(0, 10);

  // Group drugs by category
  const inotropes = activeDrugs.filter(d =>
    /norad|adrenaline|dopamine|dobutamine|vasopressin|milrinone/i.test(d.name)
  );
  const antibiotics = activeDrugs.filter(d =>
    /pip.tazo|meropenem|vancomycin|colistin|ceftriaxone|azithro|metro|levoflox|amoxicillin|clindamycin|linezolid|teicoplanin/i.test(d.name)
  );
  const ivFluids = activeDrugs.filter(d =>
    /ns|rl|dns|d5|d10|d25|isolyte|fluid|saline|ringer/i.test(d.name)
  );
  const nebDrugs = activeDrugs.filter(d =>
    /nebul|budecort|levolin|duolin|ipratropium|salbutamol/i.test(d.name)
  );
  const oralDrugs = activeDrugs.filter(d =>
    d.route === 'Oral' || /tab |cap |syrup/i.test(d.name)
  );
  const otherInj = activeDrugs.filter(d =>
    d.route === 'IV' && !inotropes.includes(d) && !antibiotics.includes(d) && !ivFluids.includes(d)
  );

  const getDayCount = (d) => d.start_date ? differenceInDays(today, parseISO(d.start_date)) + 1 : 0;

  return (
    <div ref={ref} className="cont-sheet">
      <style>{`
        .cont-sheet {
          font-family: 'DM Sans', Arial, sans-serif;
          color: #000;
          padding: 20px 24px;
          font-size: 12px;
          line-height: 1.5;
          background: #fff;
        }
        .cont-sheet .hospital-header {
          text-align: center;
          border-bottom: 2px solid #000;
          padding-bottom: 6px;
          margin-bottom: 4px;
        }
        .cont-sheet .hospital-header h1 {
          font-size: 14px;
          font-weight: 700;
          margin: 0;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .cont-sheet .hospital-header h2 {
          font-size: 13px;
          font-weight: 700;
          margin: 2px 0 0;
          text-transform: uppercase;
        }
        .cont-sheet .sheet-title {
          text-align: center;
          font-size: 13px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin: 6px 0;
          border-bottom: 1px solid #000;
          padding-bottom: 4px;
        }
        .cont-sheet .patient-strip {
          display: flex;
          justify-content: space-between;
          font-size: 11px;
          margin-bottom: 6px;
          padding: 4px 0;
          border-bottom: 1px solid #ccc;
        }
        .cont-sheet .patient-strip strong { font-weight: 700; }
        .cont-sheet .main-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          border: 1.5px solid #000;
          min-height: 600px;
        }
        .cont-sheet .col-header {
          font-size: 11px;
          font-weight: 700;
          text-align: center;
          padding: 4px;
          border-bottom: 1.5px solid #000;
          text-transform: uppercase;
          background: #f8f8f8;
        }
        .cont-sheet .progress-col {
          border-right: 1.5px solid #000;
          padding: 0;
        }
        .cont-sheet .treatment-col {
          padding: 0;
        }
        .cont-sheet .section { padding: 5px 8px; border-bottom: 1px solid #ddd; }
        .cont-sheet .section:last-child { border-bottom: none; }
        .cont-sheet .sec-label {
          font-size: 10px;
          font-weight: 700;
          color: #555;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          margin-bottom: 2px;
        }
        .cont-sheet .sec-value {
          font-size: 12px;
          color: #000;
          font-weight: 500;
        }
        .cont-sheet .sec-value.critical { color: #c00; font-weight: 700; }
        .cont-sheet .vitals-grid {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 1px 8px;
          font-size: 11px;
        }
        .cont-sheet .vitals-grid .vl { color: #555; font-weight: 600; }
        .cont-sheet .vitals-grid .vv { font-family: 'DM Mono', monospace; font-weight: 600; }
        .cont-sheet .fasthug {
          font-size: 11px;
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 1px 6px;
        }
        .cont-sheet .fasthug .letter { font-weight: 800; color: #333; width: 12px; }
        .cont-sheet .drug-list { font-size: 11px; }
        .cont-sheet .drug-item { padding: 1px 0; }
        .cont-sheet .drug-day { color: #1d4ed8; font-weight: 700; font-size: 10px; }
        .cont-sheet .rx-section { padding: 5px 8px; border-bottom: 1px solid #ddd; }
        .cont-sheet .rx-section:last-child { border-bottom: none; }
        .cont-sheet .rx-num { font-weight: 700; margin-right: 4px; }
        .cont-sheet .footer-sig {
          display: flex;
          justify-content: space-between;
          margin-top: 16px;
          padding-top: 8px;
          border-top: 1px solid #000;
          font-size: 11px;
        }
        .cont-sheet .lab-entry { font-size: 11px; margin-bottom: 1px; }
        .cont-sheet .lab-critical { color: #c00; font-weight: 700; }
        @media screen {
          .cont-sheet { max-width: 480px; margin: 0 auto; }
        }
        @media print {
          .cont-sheet .no-print { display: none !important; }
          body { margin: 0; }
          @page { margin: 1.5cm; size: A4 portrait; }
        }
      `}</style>

      {/* Hospital Header */}
      <div className="hospital-header">
        <h1>Thane Municipal Corporation</h1>
        <h2>Chhatrapati Shivaji Maharaj Hospital, Kalwa</h2>
      </div>

      {/* Patient strip */}
      <div className="patient-strip">
        <span><strong>Indoor Reg. No:</strong> {patient.mrd_number || "___________"}</span>
        <span><strong>Name:</strong> {patient.name}</span>
        <span><strong>Age:</strong> {patient.age}y</span>
        <span><strong>Bed:</strong> {patient.bed}</span>
      </div>

      <div className="sheet-title">Continuation Sheet</div>

      {/* Date/Time/SB row */}
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, marginBottom: 4, paddingBottom: 4, borderBottom: "1px solid #ccc" }}>
        <span><strong>Date:</strong> {todayStr}</span>
        <span><strong>Time:</strong> {timeStr}</span>
        <span><strong>S/B:</strong> med — JR</span>
      </div>

      {/* Main two-column grid */}
      <div className="main-grid">
        {/* ─── PROGRESS COLUMN (LEFT) ─── */}
        <div className="progress-col">
          <div className="col-header">Progress</div>

          {/* Diagnosis */}
          <div className="section">
            <div className="sec-label">Diagnosis</div>
            <div className="sec-value">{patient.diagnosis || "—"}</div>
          </div>

          {/* Day counts */}
          <div className="section">
            <div className="sec-label">Day Counts</div>
            <div className="vitals-grid">
              <span className="vl">Day of ICU</span><span className="vv">{dayOfICU}</span>
              <span className="vl">D-RT</span><span className="vv">{form.d_rt || "—"}</span>
              <span className="vl">D-Foley</span><span className="vv">{form.d_foley || "—"}</span>
              <span className="vl">D-Central line</span><span className="vv">{form.d_central_line || "—"}</span>
              <span className="vl">D-Intubation</span><span className="vv">{form.d_intubation || "—"}</span>
            </div>
          </div>

          {/* GCS */}
          <div className="section">
            <div className="sec-label">GCS</div>
            <div className="vitals-grid">
              <span className="vl">E V M</span>
              <span className="vv">
                {latestV?.gcs || "—"} ({form.gcs_e || "_"}/{form.gcs_v || "_"}/{form.gcs_m || "_"})
              </span>
            </div>
          </div>

          {/* Vitals */}
          <div className="section">
            <div className="sec-label">Vitals</div>
            <div className="vitals-grid">
              <span className="vl">Temp</span><span className={`vv ${parseFloat(latestV?.temp) > 38.5 ? "critical" : ""}`}>{latestV?.temp || "—"} °C</span>
              <span className="vl">P</span><span className="vv">{latestV?.pulse || "—"} bpm</span>
              <span className="vl">BP</span><span className={`vv ${parseInt(latestV?.bp) < 90 ? "critical" : ""}`}>{latestV?.bp || "—"} mmHg</span>
              <span className="vl">SpO2</span><span className={`vv ${parseInt(latestV?.spo2) < 93 ? "critical" : ""}`}>{latestV?.spo2 || "—"}%</span>
              <span className="vl">RR</span><span className="vv">{latestV?.rr || "—"} /min</span>
              <span className="vl">HGT</span><span className="vv">{latestV?.rbs || "—"} mg/dL</span>
              <span className="vl">I/O</span><span className="vv">{latestV?.uop || "—"} ml/hr</span>
              <span className="vl">CVP</span><span className="vv">—</span>
            </div>
          </div>

          {/* FASTHUGBID */}
          <div className="section">
            <div className="sec-label">FASTHUGBID</div>
            <div className="fasthug">
              <span className="letter">F</span><span>{form.feeding || "Feeding —"}</span>
              <span className="letter">A</span><span>{form.analgesia || "Analgesia —"}</span>
              <span className="letter">S</span><span>{form.sedation || "Sedation —"}</span>
              <span className="letter">T</span><span>{form.thromboprophylaxis || "Thromboprophylaxis —"}</span>
              <span className="letter">H</span><span>{form.head_elevation || "Head elevation 30° —"}</span>
              <span className="letter">U</span><span>{form.ulcer_prophylaxis || "Ulcer prophylaxis —"}</span>
              <span className="letter">G</span><span>{form.glycemic_control || "Glycemic control —"}</span>
              <span className="letter">B</span><span>{form.bowel_care || "Bowel care —"}</span>
              <span className="letter">I</span><span>{form.indwelling_catheter || "Indwelling cath care —"}</span>
              <span className="letter">D</span><span>{form.deescalation || "De-escalation —"}</span>
            </div>
          </div>

          {/* New complaints */}
          <div className="section">
            <div className="sec-label">Any New Complaints / HPI</div>
            <div className="sec-value">{form.new_complaints || "—"}</div>
          </div>

          {/* Recent lab reports */}
          <div className="section">
            <div className="sec-label">Recent Lab Reports</div>
            {todayLabs.length === 0 ? <div className="sec-value">—</div> : (
              todayLabs.map((l, i) => (
                <div key={i} className={`lab-entry ${l.flag === "critical" ? "lab-critical" : ""}`}>
                  {l.test_name}: {l.value} {l.flag !== "normal" ? `(${l.flag})` : ""}
                </div>
              ))
            )}
          </div>
        </div>

        {/* ─── TREATMENT COLUMN (RIGHT) ─── */}
        <div className="treatment-col">
          <div className="col-header">Treatment</div>

          {/* O2 Support & Vent Settings */}
          <div className="rx-section">
            <div className="sec-label">O2 Support / Vent Settings</div>
            <div className="sec-value">{form.o2_support || (patient.drips ? "On ventilator support" : "Room air / O2 via ___")}</div>
            {form.vent_mode && (
              <div style={{ fontSize: 11, marginTop: 2 }}>
                Mode: {form.vent_mode} | FiO2: {form.vent_fio2} | PEEP: {form.vent_peep} | PS: {form.vent_ps}
              </div>
            )}
          </div>

          {/* Rx Header */}
          <div className="rx-section" style={{ background: "#f8f8f8", padding: "3px 8px" }}>
            <div style={{ fontWeight: 700, fontSize: 12, textAlign: "center", textDecoration: "underline" }}>Rx</div>
          </div>

          {/* 1. Non-pharmacological */}
          <div className="rx-section">
            <div className="sec-value"><span className="rx-num">①</span> Non-pharmacological</div>
            <div style={{ fontSize: 11, color: "#555", paddingLeft: 16 }}>{form.rx_non_pharm || "(Air bed, DVT blocks, Physiotherapy etc.)"}</div>
          </div>

          {/* 2. RTF fees / Ryle tube feeds */}
          <div className="rx-section">
            <div className="sec-value"><span className="rx-num">②</span> RTF feed</div>
            <div style={{ fontSize: 11, color: "#555", paddingLeft: 16 }}>{form.rx_ryle_tube || "—"}</div>
          </div>

          {/* 3. Inotropes */}
          <div className="rx-section">
            <div className="sec-value"><span className="rx-num">③</span> Inotropes</div>
            {inotropes.length === 0 ? (
              <div style={{ fontSize: 11, color: "#555", paddingLeft: 16 }}>{form.rx_inotropes || "Nil"}</div>
            ) : (
              <div className="drug-list" style={{ paddingLeft: 16 }}>
                {inotropes.map((d, i) => (
                  <div key={i} className="drug-item">{d.name} {d.dose} {d.frequency} <span className="drug-day">Day {getDayCount(d)}</span></div>
                ))}
              </div>
            )}
          </div>

          {/* 4. Antibiotics */}
          <div className="rx-section">
            <div className="sec-value"><span className="rx-num">④</span> Antibiotics <span style={{ fontSize: 10, color: "#555" }}>( __ days)</span></div>
            {antibiotics.length === 0 ? (
              <div style={{ fontSize: 11, color: "#555", paddingLeft: 16 }}>Nil</div>
            ) : (
              <div className="drug-list" style={{ paddingLeft: 16 }}>
                {antibiotics.map((d, i) => {
                  const day = getDayCount(d);
                  const planned = d.planned_end_date && d.start_date
                    ? differenceInDays(parseISO(d.planned_end_date), parseISO(d.start_date)) + 1
                    : null;
                  return (
                    <div key={i} className="drug-item">
                      {d.name} {d.dose} {d.frequency}
                      <span className="drug-day"> Day {day}{planned ? `/${planned}` : ""}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* 5. Other essential injectables */}
          <div className="rx-section">
            <div className="sec-value"><span className="rx-num">⑤</span> Other essential injectables</div>
            {otherInj.length === 0 ? (
              <div style={{ fontSize: 11, color: "#555", paddingLeft: 16 }}>{form.rx_other_inj || "(Steroids, Atropine, PAM etc.)"}</div>
            ) : (
              <div className="drug-list" style={{ paddingLeft: 16 }}>
                {otherInj.map((d, i) => (
                  <div key={i} className="drug-item">{d.name} {d.dose} {d.frequency} <span className="drug-day">Day {getDayCount(d)}</span></div>
                ))}
              </div>
            )}
          </div>

          {/* 6. IV Fluids */}
          <div className="rx-section">
            <div className="sec-value"><span className="rx-num">⑥</span> IV Fluids</div>
            {ivFluids.length === 0 ? (
              <div style={{ fontSize: 11, color: "#555", paddingLeft: 16 }}>{form.rx_iv_fluids || "—"}</div>
            ) : (
              <div className="drug-list" style={{ paddingLeft: 16 }}>
                {ivFluids.map((d, i) => (
                  <div key={i} className="drug-item">{d.name} {d.dose} {d.frequency}</div>
                ))}
              </div>
            )}
          </div>

          {/* 7. Oral medications */}
          <div className="rx-section">
            <div className="sec-value"><span className="rx-num">⑦</span> Tab / Oral medications</div>
            {oralDrugs.length === 0 ? (
              <div style={{ fontSize: 11, color: "#555", paddingLeft: 16 }}>{form.rx_oral_meds || "—"}</div>
            ) : (
              <div className="drug-list" style={{ paddingLeft: 16 }}>
                {oralDrugs.map((d, i) => (
                  <div key={i} className="drug-item">{d.name} {d.dose} {d.frequency}</div>
                ))}
              </div>
            )}
          </div>

          {/* 8. Nebulization */}
          <div className="rx-section">
            <div className="sec-value"><span className="rx-num">⑧</span> Nebulization</div>
            {nebDrugs.length === 0 ? (
              <div style={{ fontSize: 11, color: "#555", paddingLeft: 16 }}>{form.rx_nebulization || "—"}</div>
            ) : (
              <div className="drug-list" style={{ paddingLeft: 16 }}>
                {nebDrugs.map((d, i) => (
                  <div key={i} className="drug-item">{d.name} {d.dose} {d.frequency}</div>
                ))}
              </div>
            )}
          </div>

          {/* Insulin if applicable */}
          {activeDrugs.filter(d => /insulin/i.test(d.name)).length > 0 && (
            <div className="rx-section">
              <div className="sec-label">Insulin</div>
              <div className="drug-list" style={{ paddingLeft: 8 }}>
                {activeDrugs.filter(d => /insulin/i.test(d.name)).map((d, i) => (
                  <div key={i} className="drug-item">{d.name} {d.dose} {d.frequency}</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Signature footer */}
      <div className="footer-sig">
        <div style={{ textAlign: "center" }}>
          <div>___________________</div>
          <div>JR Signature</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div>___________________</div>
          <div>SR Signature</div>
        </div>
        <div style={{ textAlign: "center" }}>
          <div>___________________</div>
          <div>Unit Head</div>
        </div>
      </div>
    </div>
  );
});

// ── EDIT FORM for Junior to fill before generating ──────────────────────────
export function ContinuationSheetEditor({ patient, vitals, labs, drugs, tasks, onGenerate }) {
  const [form, setForm] = useState({
    d_rt: "", d_foley: "", d_central_line: "", d_intubation: "",
    gcs_e: "", gcs_v: "", gcs_m: "",
    o2_support: "", vent_mode: "", vent_fio2: "", vent_peep: "", vent_ps: "",
    new_complaints: "",
    feeding: "", analgesia: "", sedation: "", thromboprophylaxis: "",
    head_elevation: "30° maintained", ulcer_prophylaxis: "", glycemic_control: "",
    bowel_care: "", indwelling_catheter: "", deescalation: "",
    rx_non_pharm: "Air bed, DVT prophylaxis, Chest physiotherapy",
    rx_ryle_tube: "", rx_inotropes: "", rx_iv_fluids: "", rx_oral_meds: "",
    rx_nebulization: "", rx_other_inj: "",
  });

  const INP = { width: "100%", boxSizing: "border-box", border: "1.5px solid #e2e8f0", borderRadius: 8, padding: "7px 10px", fontSize: 13, color: "#0f172a", outline: "none", fontFamily: "'DM Sans',sans-serif", background: "#fff" };
  const Lbl = ({ c }) => <div style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.3px", marginBottom: 3 }}>{c}</div>;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {/* Device days */}
      <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, border: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", marginBottom: 8 }}>Device Days</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[["d_rt", "Day of Ryle's Tube"], ["d_foley", "Day of Foley"], ["d_central_line", "Day of Central Line"], ["d_intubation", "Day of Intubation"]].map(([k, l]) => (
            <div key={k}><Lbl c={l} /><input value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} style={INP} placeholder="e.g. 3" /></div>
          ))}
        </div>
      </div>

      {/* GCS */}
      <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, border: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", marginBottom: 8 }}>GCS Breakdown</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <div><Lbl c="E (Eye)" /><input value={form.gcs_e} onChange={e => setForm(f => ({ ...f, gcs_e: e.target.value }))} style={INP} placeholder="4" /></div>
          <div><Lbl c="V (Verbal)" /><input value={form.gcs_v} onChange={e => setForm(f => ({ ...f, gcs_v: e.target.value }))} style={INP} placeholder="5" /></div>
          <div><Lbl c="M (Motor)" /><input value={form.gcs_m} onChange={e => setForm(f => ({ ...f, gcs_m: e.target.value }))} style={INP} placeholder="6" /></div>
        </div>
      </div>

      {/* O2 / Vent */}
      <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, border: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", marginBottom: 8 }}>O2 Support / Ventilator</div>
        <div><Lbl c="O2 Support Type" /><input value={form.o2_support} onChange={e => setForm(f => ({ ...f, o2_support: e.target.value }))} style={INP} placeholder="Room air / O2 mask 5L / NIV / Ventilator" /></div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8, marginTop: 8 }}>
          <div><Lbl c="Mode" /><input value={form.vent_mode} onChange={e => setForm(f => ({ ...f, vent_mode: e.target.value }))} style={INP} placeholder="CMV/SIMV" /></div>
          <div><Lbl c="FiO2" /><input value={form.vent_fio2} onChange={e => setForm(f => ({ ...f, vent_fio2: e.target.value }))} style={INP} placeholder="0.4" /></div>
          <div><Lbl c="PEEP" /><input value={form.vent_peep} onChange={e => setForm(f => ({ ...f, vent_peep: e.target.value }))} style={INP} placeholder="5" /></div>
        </div>
      </div>

      {/* New complaints */}
      <div>
        <Lbl c="New Complaints / Fresh History" />
        <textarea value={form.new_complaints} onChange={e => setForm(f => ({ ...f, new_complaints: e.target.value }))} rows={3} style={{ ...INP, resize: "vertical" }} placeholder="Any new complaints from patient / attendant..." />
      </div>

      {/* FASTHUGBID quick fill */}
      <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, border: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", marginBottom: 8 }}>FASTHUGBID Checklist</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {[
            ["feeding", "F — Feeding"], ["analgesia", "A — Analgesia"],
            ["sedation", "S — Sedation"], ["thromboprophylaxis", "T — Thromboprophylaxis"],
            ["head_elevation", "H — Head Elevation"], ["ulcer_prophylaxis", "U — Ulcer Prophylaxis"],
            ["glycemic_control", "G — Glycemic Control"], ["bowel_care", "B — Bowel Care"],
            ["indwelling_catheter", "I — Indwelling Cath"], ["deescalation", "D — De-escalation"],
          ].map(([k, l]) => (
            <div key={k}><Lbl c={l} /><input value={form[k]} onChange={e => setForm(f => ({ ...f, [k]: e.target.value }))} style={INP} placeholder="—" /></div>
          ))}
        </div>
      </div>

      {/* Additional Rx notes */}
      <div style={{ background: "#f8fafc", borderRadius: 10, padding: 12, border: "1px solid #e2e8f0" }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: "#0f172a", textTransform: "uppercase", marginBottom: 8 }}>Additional Rx Notes (optional)</div>
        <div><Lbl c="Non-pharmacological" /><input value={form.rx_non_pharm} onChange={e => setForm(f => ({ ...f, rx_non_pharm: e.target.value }))} style={INP} /></div>
        <div style={{ marginTop: 6 }}><Lbl c="RTF / Ryle tube feeds" /><input value={form.rx_ryle_tube} onChange={e => setForm(f => ({ ...f, rx_ryle_tube: e.target.value }))} style={INP} placeholder="e.g. RT feeds 200ml Q4H" /></div>
      </div>

      <button onClick={() => onGenerate(form)} style={{ background: "#0c1526", color: "#fff", border: "none", borderRadius: 10, padding: "13px 0", width: "100%", fontSize: 14, fontWeight: 700, cursor: "pointer" }}>
        Generate Continuation Sheet
      </button>
    </div>
  );
}

export default ContinuationSheet;
