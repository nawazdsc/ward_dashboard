import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useReactToPrint } from 'react-to-print';
import TreatmentSheet from './components/TreatmentSheet';
import PrintCaseSheet from './components/PrintCaseSheet';
import DischargeCard from './components/DischargeCard';
import ProgressNote from './components/ProgressNote';
import LabChart from './components/LabChart';
import ShiftHandover from './components/ShiftHandover';
import Notifications from './components/Notifications';
import FileUpload from './components/FileUpload';

const PROXY = '/api';

// ─── tiny helpers ─────────────────────────────────────────────────────────────
const api = async (path, method = 'GET', body) => {
  const res = await fetch(PROXY + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

const STATUS_COLORS = {
  stable: { bg: '#f0fdf4', text: '#166534', border: '#86efac' },
  review: { bg: '#fffbeb', text: '#92400e', border: '#fcd34d' },
  critical: { bg: '#fff1f2', text: '#9f1239', border: '#fda4af' },
  discharged: { bg: '#f1f5f9', text: '#475569', border: '#cbd5e1' },
};

// ─── WARD OVERVIEW ────────────────────────────────────────────────────────────
function WardOverview({ patients, tasks, onSelectPatient, onAddPatient, loading }) {
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({
    name: '', bed: '', age: '', diagnosis: '', attending: '',
    status: 'stable', mrd_number: '', drips: '', notes: '',
  });

  const counts = {
    total: patients.length,
    critical: patients.filter(p => p.status === 'critical').length,
    review: patients.filter(p => p.status === 'review').length,
    stable: patients.filter(p => p.status === 'stable').length,
    overdue: tasks.filter(t => t.status === 'overdue').length,
  };

  const handleAdd = async () => {
    if (!form.name || !form.bed) return;
    await onAddPatient(form);
    setForm({ name: '', bed: '', age: '', diagnosis: '', attending: '', status: 'stable', mrd_number: '', drips: '', notes: '' });
    setShowAdd(false);
  };

  const INP = {
    width: '100%', boxSizing: 'border-box', border: '1.5px solid #e2e8f0',
    borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none',
    fontFamily: "'DM Sans',sans-serif", background: '#fff', color: '#0f172a',
  };

  return (
    <div style={{ padding: '0 0 20px' }}>
      {/* Stats bar */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 8, marginBottom: 16 }}>
        {[
          { label: 'Total', val: counts.total, color: '#3b82f6' },
          { label: 'Critical', val: counts.critical, color: '#ef4444' },
          { label: 'Review', val: counts.review, color: '#f59e0b' },
          { label: 'Stable', val: counts.stable, color: '#10b981' },
          { label: 'Overdue Tasks', val: counts.overdue, color: '#8b5cf6' },
        ].map(s => (
          <div key={s.label} style={{ background: '#fff', border: '1px solid #f1f5f9', borderRadius: 10, padding: '10px 8px', textAlign: 'center' }}>
            <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Patient cards */}
      {loading && <div style={{ textAlign: 'center', color: '#94a3b8', padding: 30 }}>Loading patients…</div>}
      {!loading && patients.length === 0 && (
        <div style={{ textAlign: 'center', color: '#cbd5e1', padding: 30, fontSize: 14 }}>No patients admitted. Add one below.</div>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {patients.map(p => {
          const sc = STATUS_COLORS[p.status] || STATUS_COLORS.stable;
          const ptTasks = tasks.filter(t => t.patient_id === p.id);
          const overdueCnt = ptTasks.filter(t => t.status === 'overdue').length;
          return (
            <div
              key={p.id}
              onClick={() => onSelectPatient(p)}
              style={{
                background: '#fff', border: `1.5px solid ${sc.border}`,
                borderLeft: `4px solid ${sc.border}`, borderRadius: 10,
                padding: '10px 13px', cursor: 'pointer', transition: 'box-shadow 0.15s',
              }}
              onMouseEnter={e => e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.09)'}
              onMouseLeave={e => e.currentTarget.style.boxShadow = 'none'}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontWeight: 700, fontSize: 14, color: '#0f172a' }}>{p.name}</span>
                    <span style={{ fontFamily: 'monospace', fontSize: 11, background: '#f1f5f9', padding: '1px 7px', borderRadius: 5, color: '#475569' }}>{p.bed}</span>
                    {p.age && <span style={{ fontSize: 11, color: '#94a3b8' }}>{p.age}y</span>}
                    {overdueCnt > 0 && (
                      <span style={{ fontSize: 10, background: '#fee2e2', color: '#991b1b', padding: '1px 7px', borderRadius: 10, fontWeight: 700 }}>
                        {overdueCnt} overdue
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: 12, color: '#64748b' }}>{p.diagnosis || '—'}</div>
                  {p.drips && (
                    <div style={{ fontSize: 11, color: '#dc2626', marginTop: 3 }}>
                      Drips: {Array.isArray(p.drips) ? p.drips.join(', ') : p.drips}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, background: sc.bg, color: sc.text, padding: '2px 10px', borderRadius: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    {p.status}
                  </span>
                  <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 4 }}>{p.attending}</div>
                </div>
              </div>
              {p.bp && (
                <div style={{ marginTop: 6, display: 'flex', gap: 12, fontSize: 11, color: '#475569' }}>
                  {p.bp && <span>BP: <strong>{p.bp}</strong></span>}
                  {p.spo2 && <span>SpO₂: <strong style={{ color: parseFloat(p.spo2) < 93 ? '#ef4444' : 'inherit' }}>{p.spo2}%</strong></span>}
                  {p.pulse && <span>HR: <strong>{p.pulse}</strong></span>}
                  {p.temp && <span>T: <strong style={{ color: parseFloat(p.temp) > 38.5 ? '#ef4444' : 'inherit' }}>{p.temp}°C</strong></span>}
                  {p.gcs && <span>GCS: <strong style={{ color: parseFloat(p.gcs) < 13 ? '#ef4444' : 'inherit' }}>{p.gcs}</strong></span>}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Add patient */}
      {!showAdd ? (
        <button
          onClick={() => setShowAdd(true)}
          style={{ marginTop: 12, width: '100%', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}
        >
          + Admit New Patient
        </button>
      ) : (
        <div style={{ marginTop: 12, background: '#f8fafc', borderRadius: 12, padding: 14, border: '1px solid #e2e8f0' }}>
          <div style={{ fontWeight: 700, fontSize: 12, color: '#0f172a', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.4px' }}>New Admission</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>Name *</div><input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} style={INP} /></div>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>Bed *</div><input value={form.bed} onChange={e => setForm(f => ({ ...f, bed: e.target.value }))} style={INP} placeholder="ICU-1" /></div>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>Age</div><input type="number" value={form.age} onChange={e => setForm(f => ({ ...f, age: e.target.value }))} style={INP} /></div>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>MRD No.</div><input value={form.mrd_number} onChange={e => setForm(f => ({ ...f, mrd_number: e.target.value }))} style={INP} /></div>
            <div style={{ gridColumn: '1/-1' }}><div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>Diagnosis</div><input value={form.diagnosis} onChange={e => setForm(f => ({ ...f, diagnosis: e.target.value }))} style={INP} /></div>
            <div><div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>Attending</div><input value={form.attending} onChange={e => setForm(f => ({ ...f, attending: e.target.value }))} style={INP} placeholder="Dr. ..." /></div>
            <div>
              <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>Status</div>
              <select value={form.status} onChange={e => setForm(f => ({ ...f, status: e.target.value }))} style={INP}>
                {['stable', 'review', 'critical'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}><div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 3 }}>Active Drips</div><input value={form.drips} onChange={e => setForm(f => ({ ...f, drips: e.target.value }))} style={INP} placeholder="Noradrenaline 0.1mcg/kg/min, Vasopressin..." /></div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={handleAdd} style={{ flex: 1, background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, padding: '11px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Admit</button>
            <button onClick={() => setShowAdd(false)} style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, padding: '11px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── VITALS ENTRY ─────────────────────────────────────────────────────────────
function VitalsEntry({ patientId, onSaved }) {
  const [v, setV] = useState({ bp: '', spo2: '', pulse: '', temp: '', rr: '', gcs: '', uop: '', rbs: '' });
  const [saving, setSaving] = useState(false);
  const INP = { border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '7px 8px', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: "'DM Sans',sans-serif" };
  const fields = [
    ['bp', 'BP (mmHg)', '120/80'], ['spo2', 'SpO₂ (%)', '98'], ['pulse', 'HR (bpm)', '80'],
    ['temp', 'Temp (°C)', '37.0'], ['rr', 'RR (/min)', '16'], ['gcs', 'GCS (/15)', '15'],
    ['uop', 'UOP (ml/hr)', '50'], ['rbs', 'RBS (mg/dL)', '120'],
  ];
  const save = async () => {
    setSaving(true);
    try { await api(`/vitals/${patientId}`, 'POST', v); onSaved(); }
    catch (err) { alert(err.message); }
    setSaving(false);
  };
  return (
    <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, border: '1px solid #e2e8f0', marginBottom: 8 }}>
      <div style={{ fontWeight: 700, fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 8, letterSpacing: '0.4px' }}>Record Vitals</div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 10 }}>
        {fields.map(([key, label, ph]) => (
          <div key={key}>
            <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginBottom: 3 }}>{label}</div>
            <input value={v[key]} onChange={e => setV(x => ({ ...x, [key]: e.target.value }))} style={INP} placeholder={ph} />
          </div>
        ))}
      </div>
      <button onClick={save} disabled={saving} style={{ width: '100%', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Saving…' : 'Save Vitals'}
      </button>
    </div>
  );
}

// ─── LABS ENTRY ───────────────────────────────────────────────────────────────
function LabsEntry({ patientId, onSaved }) {
  const [rows, setRows] = useState([{ test_name: '', value: '', flag: 'normal' }]);
  const [saving, setSaving] = useState(false);
  const INP = { border: '1.5px solid #e2e8f0', borderRadius: 6, padding: '6px 8px', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: "'DM Sans',sans-serif" };
  const save = async () => {
    const valid = rows.filter(r => r.test_name && r.value);
    if (!valid.length) return;
    setSaving(true);
    try {
      for (const r of valid) await api(`/labs/${patientId}`, 'POST', r);
      setRows([{ test_name: '', value: '', flag: 'normal' }]);
      onSaved();
    } catch (err) { alert(err.message); }
    setSaving(false);
  };
  return (
    <div style={{ background: '#f8fafc', borderRadius: 10, padding: 12, border: '1px solid #e2e8f0', marginBottom: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
        <div style={{ fontWeight: 700, fontSize: 11, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px' }}>Add Labs</div>
        <button onClick={() => setRows(r => [...r, { test_name: '', value: '', flag: 'normal' }])} style={{ fontSize: 11, color: '#3b82f6', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}>+ Row</button>
      </div>
      {rows.map((r, i) => (
        <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr auto', gap: 6, marginBottom: 6 }}>
          <input value={r.test_name} onChange={e => setRows(rows.map((x, j) => j === i ? { ...x, test_name: e.target.value } : x))} style={INP} placeholder="Test name (e.g. Creatinine)" />
          <input value={r.value} onChange={e => setRows(rows.map((x, j) => j === i ? { ...x, value: e.target.value } : x))} style={INP} placeholder="Value" />
          <select value={r.flag} onChange={e => setRows(rows.map((x, j) => j === i ? { ...x, flag: e.target.value } : x))} style={{ ...INP, width: 'auto' }}>
            <option value="normal">Normal</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
        </div>
      ))}
      <button onClick={save} disabled={saving} style={{ width: '100%', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
        {saving ? 'Saving…' : 'Save Labs'}
      </button>
    </div>
  );
}

// ─── TASKS PANEL ──────────────────────────────────────────────────────────────
function TasksPanel({ tasks, patientId, patientName, patientBed, onRefresh }) {
  const [show, setShow] = useState(false);
  const [form, setForm] = useState({ task: '', assigned_to: '', due_time: '', priority: 'medium', notes: '' });
  const ptTasks = tasks.filter(t => t.patient_id === patientId);
  const INP = { border: '1.5px solid #e2e8f0', borderRadius: 7, padding: '7px 9px', fontSize: 12, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: "'DM Sans',sans-serif" };

  const addTask = async () => {
    if (!form.task) return;
    await api('/tasks', 'POST', { ...form, patient_id: patientId, patient_name: patientName, bed: patientBed });
    setForm({ task: '', assigned_to: '', due_time: '', priority: 'medium', notes: '' });
    setShow(false);
    onRefresh();
  };

  const updateTask = async (id, status) => {
    await api(`/tasks/${id}`, 'PATCH', { status });
    onRefresh();
  };

  const PRIORITY_COLORS = { low: '#94a3b8', medium: '#f59e0b', high: '#ef4444' };
  const STATUS_BG = { pending: '#fef9c3', inprogress: '#dbeafe', done: '#f0fdf4', overdue: '#fee2e2' };

  return (
    <div style={{ background: '#fff', borderRadius: 11, padding: '11px 13px', marginBottom: 8, border: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
        <span style={{ fontWeight: 700, fontSize: 11, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
          Tasks ({ptTasks.length})
        </span>
        <button onClick={() => setShow(!show)} style={{ fontSize: 11, color: '#3b82f6', background: '#eff6ff', border: '1px solid #bfdbfe', padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>+ Task</button>
      </div>
      {ptTasks.length === 0 && <div style={{ color: '#cbd5e1', fontSize: 12 }}>No tasks.</div>}
      {ptTasks.map(t => (
        <div key={t.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 8, padding: '7px 0', borderBottom: '1px solid #f8fafc' }}>
          <div style={{ width: 3, height: 3, borderRadius: '50%', background: PRIORITY_COLORS[t.priority] || '#94a3b8', marginTop: 6, flexShrink: 0 }} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 12, color: '#0f172a', fontWeight: 500 }}>{t.task}</div>
            <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
              {t.assigned_to && `→ ${t.assigned_to}`}{t.due_time && ` · ${t.due_time}`}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
            <span style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: STATUS_BG[t.status] || '#f1f5f9', color: '#374151', fontWeight: 700, textTransform: 'uppercase' }}>{t.status}</span>
            {t.status !== 'done' && (
              <button onClick={() => updateTask(t.id, 'done')} style={{ fontSize: 9, padding: '2px 7px', borderRadius: 10, background: '#f0fdf4', color: '#166534', border: '1px solid #86efac', cursor: 'pointer', fontWeight: 700 }}>✓</button>
            )}
          </div>
        </div>
      ))}
      {show && (
        <div style={{ marginTop: 8, background: '#f8fafc', borderRadius: 9, padding: 10, border: '1px solid #e2e8f0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7, marginBottom: 7 }}>
            <div style={{ gridColumn: '1/-1' }}><div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Task *</div><input value={form.task} onChange={e => setForm(f => ({ ...f, task: e.target.value }))} style={INP} placeholder="e.g. Review morning labs" /></div>
            <div><div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Assign To</div><input value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))} style={INP} placeholder="Dr. / Nurse" /></div>
            <div><div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Due Time</div><input type="time" value={form.due_time} onChange={e => setForm(f => ({ ...f, due_time: e.target.value }))} style={INP} /></div>
            <div>
              <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Priority</div>
              <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value }))} style={INP}>
                {['low', 'medium', 'high'].map(p => <option key={p}>{p}</option>)}
              </select>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 7 }}>
            <button onClick={addTask} style={{ flex: 1, background: '#0f172a', color: '#fff', border: 'none', borderRadius: 7, padding: '9px 0', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Add</button>
            <button onClick={() => setShow(false)} style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 7, padding: '9px 0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── PATIENT DETAIL VIEW ──────────────────────────────────────────────────────
function PatientDetail({ patient, tasks, allPatients, allVitals, onBack, onRefreshPatients, onRefreshTasks }) {
  const [tab, setTab] = useState('vitals');
  const [vitals, setVitals] = useState([]);
  const [labs, setLabs] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [files, setFiles] = useState([]);
  const [aiCourse, setAiCourse] = useState('');
  const [extraFields, setExtraFields] = useState({});
  const [editingPatient, setEditingPatient] = useState(false);
  const [editForm, setEditForm] = useState({ ...patient });
  const [discharging, setDischarging] = useState(false);
  const [handoverOut, setHandoverOut] = useState('');
  const [handoverIn, setHandoverIn] = useState('');

  const printCaseRef = useRef(null);
  const printDischargeRef = useRef(null);
  const printHandoverRef = useRef(null);

  const printCaseSheet = useReactToPrint({ contentRef: printCaseRef });
  const printDischarge = useReactToPrint({ contentRef: printDischargeRef });
  const printHandover = useReactToPrint({ contentRef: printHandoverRef });

  const loadData = useCallback(async () => {
    try {
      const [v, l, d, f] = await Promise.all([
        api(`/vitals/${patient.id}`),
        api(`/labs/${patient.id}`),
        api(`/drugs/${patient.id}`),
        api(`/files/${patient.id}`),
      ]);
      setVitals(v);
      setLabs(l);
      setDrugs(d);
      setFiles(f);
    } catch (err) { console.error(err); }
  }, [patient.id]);

  useEffect(() => { loadData(); }, [loadData]);

  const updatePatient = async (updates) => {
    await api(`/patients/${patient.id}`, 'PATCH', updates);
    onRefreshPatients();
  };

  const saveEditForm = async () => {
    await updatePatient(editForm);
    setEditingPatient(false);
  };

  const discharge = async () => {
    if (!window.confirm('Discharge this patient?')) return;
    setDischarging(true);
    await updatePatient({ status: 'discharged', discharge_date: new Date().toISOString() });
    setDischarging(false);
    onBack();
  };

  const generateAI = async (system, userMsg, maxTokens = 1200) => {
    const res = await api('/ai', 'POST', {
      system,
      messages: [{ role: 'user', content: userMsg }],
      max_tokens: maxTokens,
    });
    return res.text;
  };

  const generateProgressNote = async (subjective) => {
    const context = `
Patient: ${patient.name}, Age: ${patient.age}, Bed: ${patient.bed}
Diagnosis: ${patient.diagnosis}
Attending: ${patient.attending}

Latest Vitals: ${vitals[0] ? `BP ${vitals[0].bp}, SpO2 ${vitals[0].spo2}%, HR ${vitals[0].pulse}, Temp ${vitals[0].temp}°C, RR ${vitals[0].rr}, GCS ${vitals[0].gcs}, UOP ${vitals[0].uop}ml/hr, RBS ${vitals[0].rbs}mg/dL` : 'None recorded'}

Today's Labs: ${labs.slice(0, 8).map(l => `${l.test_name}: ${l.value} [${l.flag}]`).join(', ') || 'None'}

Active Medications: ${drugs.filter(d => d.is_active).map(d => `${d.name} ${d.dose} ${d.frequency}`).join(', ') || 'None'}

Subjective from clinician: ${subjective || 'Not provided'}
    `.trim();
    return generateAI(
      'You are a senior ICU physician. Generate a SOAP progress note. Be concise, clinical, and specific. Format: A:\n[assessment]\n\nP:\n[bulleted plan]. Do not include S: or O: sections — those are provided by the user.',
      context, 1000
    );
  };

  const generateHospitalCourse = async () => {
    const context = `
Patient: ${patient.name}, ${patient.age}y, MRD: ${patient.mrd_number || 'N/A'}
Admitted: ${patient.admit_date}, Bed: ${patient.bed}
Diagnosis: ${patient.diagnosis}
Attending: ${patient.attending}

All Vitals (latest first): ${vitals.slice(0, 5).map(v => `[${v.recorded_at?.slice(0, 16)}] BP:${v.bp} SpO2:${v.spo2}% HR:${v.pulse} Temp:${v.temp} GCS:${v.gcs}`).join(' | ')}

All Labs: ${labs.slice(0, 20).map(l => `${l.test_name}:${l.value}(${l.flag})`).join(', ')}

All Drugs: ${drugs.map(d => `${d.name} ${d.dose} ${d.frequency} x ${d.start_date} to ${d.planned_end_date || 'ongoing'}`).join(', ')}

Doctor Notes: ${patient.notes || 'None'}
    `.trim();
    const text = await generateAI(
      'You are an ICU physician writing a discharge summary. Write a concise, factual hospital course in 3-5 sentences. Include admission presentation, key events, treatment, and response. No headers, just a paragraph.',
      context, 600
    );
    setAiCourse(text);
  };

  const TABS = [
    { id: 'vitals', label: 'Vitals' },
    { id: 'labs', label: 'Labs' },
    { id: 'treatment', label: 'Treatment' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'progress', label: 'Progress Note' },
    { id: 'discharge', label: 'Discharge' },
    { id: 'print', label: 'Print' },
    { id: 'files', label: 'Files' },
  ];

  const sc = STATUS_COLORS[patient.status] || STATUS_COLORS.stable;

  const INP = {
    width: '100%', boxSizing: 'border-box', border: '1.5px solid #e2e8f0',
    borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none',
    fontFamily: "'DM Sans',sans-serif", background: '#fff', color: '#0f172a',
  };

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
        <button onClick={onBack} style={{ background: '#f1f5f9', border: 'none', borderRadius: 8, padding: '8px 13px', fontSize: 13, cursor: 'pointer', color: '#475569', fontWeight: 600 }}>← Back</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#0f172a' }}>{patient.name}</span>
            <span style={{ fontFamily: 'monospace', fontSize: 11, background: '#f1f5f9', padding: '2px 8px', borderRadius: 6, color: '#475569' }}>{patient.bed}</span>
            <span style={{ fontSize: 10, fontWeight: 700, background: sc.bg, color: sc.text, padding: '2px 10px', borderRadius: 10, textTransform: 'uppercase' }}>{patient.status}</span>
          </div>
          <div style={{ fontSize: 12, color: '#64748b', marginTop: 2 }}>{patient.diagnosis} · {patient.age}y · {patient.attending}</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          <button onClick={() => setEditingPatient(!editingPatient)} style={{ fontSize: 11, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', color: '#475569', fontWeight: 600 }}>Edit</button>
          {patient.status !== 'discharged' && (
            <button onClick={discharge} disabled={discharging} style={{ fontSize: 11, background: '#fff1f2', border: '1px solid #fda4af', borderRadius: 7, padding: '6px 12px', cursor: 'pointer', color: '#9f1239', fontWeight: 600 }}>
              Discharge
            </button>
          )}
        </div>
      </div>

      {/* Edit form */}
      {editingPatient && (
        <div style={{ background: '#f8fafc', borderRadius: 11, padding: 13, border: '1px solid #e2e8f0', marginBottom: 12 }}>
          <div style={{ fontWeight: 700, fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 9 }}>Edit Patient</div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 8 }}>
            {[['name','Name'],['bed','Bed'],['age','Age'],['diagnosis','Diagnosis'],['attending','Attending'],['mrd_number','MRD No.'],['drips','Drips']].map(([k, l]) => (
              <div key={k} style={k === 'diagnosis' || k === 'drips' ? { gridColumn: '1/-1' } : {}}>
                <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>{l}</div>
                <input value={editForm[k] || ''} onChange={e => setEditForm(f => ({ ...f, [k]: e.target.value }))} style={INP} />
              </div>
            ))}
            <div>
              <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Status</div>
              <select value={editForm.status || 'stable'} onChange={e => setEditForm(f => ({ ...f, status: e.target.value }))} style={INP}>
                {['stable','review','critical','discharged'].map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div style={{ gridColumn: '1/-1' }}>
              <div style={{ fontSize: 9, color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', marginBottom: 3 }}>Notes</div>
              <textarea value={editForm.notes || ''} onChange={e => setEditForm(f => ({ ...f, notes: e.target.value }))} rows={3} style={{ ...INP, resize: 'vertical' }} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveEditForm} style={{ flex: 1, background: '#0f172a', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Save Changes</button>
            <button onClick={() => setEditingPatient(false)} style={{ flex: 1, background: '#f1f5f9', color: '#475569', border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
          </div>
        </div>
      )}

      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 4, overflowX: 'auto', marginBottom: 12, paddingBottom: 2 }}>
        {TABS.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              fontSize: 11, padding: '6px 13px', borderRadius: 20, cursor: 'pointer', whiteSpace: 'nowrap',
              background: tab === t.id ? '#0f172a' : '#f1f5f9',
              color: tab === t.id ? '#fff' : '#64748b',
              border: tab === t.id ? 'none' : '1px solid #e2e8f0',
              fontWeight: 600,
            }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      {tab === 'vitals' && (
        <div>
          <VitalsEntry patientId={patient.id} onSaved={loadData} />
          {vitals.length > 0 && (
            <div style={{ background: '#fff', borderRadius: 11, padding: '11px 13px', border: '1px solid #f1f5f9', overflowX: 'auto' }}>
              <div style={{ fontWeight: 700, fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Vitals History</div>
              <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', minWidth: 500 }}>
                <thead><tr style={{ background: '#f8fafc' }}>
                  {['Time','BP','SpO₂','HR','Temp','RR','GCS','UOP','RBS'].map(h => (
                    <th key={h} style={{ padding: '5px 7px', textAlign: 'left', color: '#94a3b8', fontWeight: 700, fontSize: 10, borderBottom: '1px solid #e2e8f0' }}>{h}</th>
                  ))}
                </tr></thead>
                <tbody>
                  {vitals.slice(0, 20).map((v, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid #f8fafc' }}>
                      <td style={{ padding: '5px 7px', color: '#64748b', fontFamily: 'monospace', fontSize: 10 }}>{v.recorded_at?.slice(11, 16)}</td>
                      <td style={{ padding: '5px 7px', fontWeight: 500, color: parseInt(v.bp) < 90 ? '#ef4444' : '#0f172a' }}>{v.bp || '—'}</td>
                      <td style={{ padding: '5px 7px', fontWeight: 500, color: parseFloat(v.spo2) < 93 ? '#ef4444' : '#0f172a' }}>{v.spo2 || '—'}</td>
                      <td style={{ padding: '5px 7px' }}>{v.pulse || '—'}</td>
                      <td style={{ padding: '5px 7px', color: parseFloat(v.temp) > 38.5 ? '#ef4444' : '#0f172a' }}>{v.temp || '—'}</td>
                      <td style={{ padding: '5px 7px' }}>{v.rr || '—'}</td>
                      <td style={{ padding: '5px 7px', color: parseFloat(v.gcs) < 13 ? '#ef4444' : '#0f172a' }}>{v.gcs || '—'}</td>
                      <td style={{ padding: '5px 7px', color: parseFloat(v.uop) < 20 ? '#ef4444' : '#0f172a' }}>{v.uop || '—'}</td>
                      <td style={{ padding: '5px 7px' }}>{v.rbs || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {tab === 'labs' && (
        <div>
          <LabsEntry patientId={patient.id} onSaved={loadData} />
          <LabChart labs={labs} />
        </div>
      )}

      {tab === 'treatment' && (
        <TreatmentSheet
          drugs={drugs}
          patientName={patient.name}
          onAddDrug={async (drugData) => {
            await api(`/drugs/${patient.id}`, 'POST', drugData);
            loadData();
          }}
          onToggleDrug={async (id, is_active) => {
            await api(`/drugs/${id}`, 'PATCH', { is_active });
            loadData();
          }}
        />
      )}

      {tab === 'tasks' && (
        <TasksPanel
          tasks={tasks}
          patientId={patient.id}
          patientName={patient.name}
          patientBed={patient.bed}
          onRefresh={onRefreshTasks}
        />
      )}

      {tab === 'progress' && (
        <ProgressNote
          patient={patient}
          vitals={vitals}
          labs={labs}
          drugs={drugs}
          existingNotes={patient.notes}
          onSave={async (note, subjective) => {
            const ts = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
            const full = `[${ts}]\nS: ${subjective || '—'}\n${note}`;
            const combined = patient.notes ? `${patient.notes}\n\n---\n\n${full}` : full;
            await updatePatient({ notes: combined });
            alert('Progress note saved.');
          }}
          onGenerateAI={generateProgressNote}
        />
      )}

      {tab === 'discharge' && (
        <div>
          <div style={{ background: '#fff', borderRadius: 11, padding: '11px 13px', border: '1px solid #f1f5f9', marginBottom: 8 }}>
            <div style={{ fontWeight: 700, fontSize: 11, color: '#64748b', textTransform: 'uppercase', marginBottom: 8 }}>Discharge Summary Preview</div>
            <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 10 }}>
              {patient.status !== 'discharged' ? 'Patient is still admitted. You can pre-generate the discharge card.' : 'Patient has been discharged.'}
            </div>
            <button
              onClick={generateHospitalCourse}
              style={{ width: '100%', background: '#1d4ed8', color: '#fff', border: 'none', borderRadius: 8, padding: '10px 0', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginBottom: 8 }}
            >
              AI Generate Hospital Course
            </button>
          </div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 11, overflow: 'auto', maxHeight: '70vh' }}>
            <DischargeCard
              ref={printDischargeRef}
              patient={patient}
              vitals={vitals}
              labs={labs}
              drugs={drugs}
              aiCourse={aiCourse}
              onCourseChange={setAiCourse}
              extraFields={extraFields}
              onFieldChange={(k, v) => setExtraFields(f => ({ ...f, [k]: v }))}
              onGenerate={generateHospitalCourse}
            />
          </div>
          <button onClick={printDischarge} style={{ marginTop: 10, width: '100%', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            🖨️ Print Discharge Card
          </button>
        </div>
      )}

      {tab === 'print' && (
        <div>
          <div style={{ border: '1px solid #e2e8f0', borderRadius: 11, overflow: 'auto', maxHeight: '70vh', marginBottom: 10 }}>
            <PrintCaseSheet
              ref={printCaseRef}
              patient={patient}
              vitals={vitals}
              labs={labs}
              drugs={drugs}
              tasks={tasks.filter(t => t.patient_id === patient.id)}
            />
          </div>
          <button onClick={printCaseSheet} style={{ width: '100%', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
            🖨️ Print Daily Case Sheet
          </button>
        </div>
      )}

      {tab === 'files' && (
        <FileUpload
          files={files}
          patientName={patient.name}
          onUpload={async (fileData) => {
            await api(`/files/${patient.id}`, 'POST', fileData);
            loadData();
          }}
        />
      )}
    </div>
  );
}

// ─── SHIFT HANDOVER PANEL ─────────────────────────────────────────────────────
function HandoverPanel({ patients, tasks, allVitals, allDrugs }) {
  const [out, setOut] = useState('');
  const [inc, setInc] = useState('');
  const ref = useRef(null);
  const printFn = useReactToPrint({ contentRef: ref });
  const INP = { border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 13, outline: 'none', width: '100%', boxSizing: 'border-box', fontFamily: "'DM Sans',sans-serif" };
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
        <div><div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Outgoing Doctor</div><input value={out} onChange={e => setOut(e.target.value)} style={INP} placeholder="Dr. ..." /></div>
        <div><div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>Incoming Doctor</div><input value={inc} onChange={e => setInc(e.target.value)} style={INP} placeholder="Dr. ..." /></div>
      </div>
      <div style={{ border: '1px solid #e2e8f0', borderRadius: 11, overflow: 'auto', maxHeight: '70vh', marginBottom: 10 }}>
        <ShiftHandover
          ref={ref}
          patients={patients.filter(p => p.status !== 'discharged')}
          vitals={allVitals}
          tasks={tasks}
          drugs={allDrugs}
          outgoing={out}
          incoming={inc}
        />
      </div>
      <button onClick={printFn} style={{ width: '100%', background: '#0f172a', color: '#fff', border: 'none', borderRadius: 10, padding: '13px 0', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
        🖨️ Print Handover Document
      </button>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [patients, setPatients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [allVitals, setAllVitals] = useState({});   // { patientId: [...] }
  const [allDrugs, setAllDrugs] = useState({});     // { patientId: [...] }
  const [loading, setLoading] = useState(true);
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [view, setView] = useState('ward');         // 'ward' | 'patient' | 'handover'

  const loadPatients = useCallback(async () => {
    try {
      const data = await api('/patients');
      setPatients(data);
      return data;
    } catch (err) { console.error(err); return []; }
  }, []);

  const loadTasks = useCallback(async () => {
    try { setTasks(await api('/tasks')); } catch { /* noop */ }
  }, []);

  const loadAllVitalsAndDrugs = useCallback(async (pts) => {
    const vObj = {};
    const dObj = {};
    await Promise.all(pts.map(async p => {
      try {
        vObj[p.id] = await api(`/vitals/${p.id}`);
        dObj[p.id] = await api(`/drugs/${p.id}`);
      } catch { /* noop */ }
    }));
    setAllVitals(vObj);
    setAllDrugs(dObj);
  }, []);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const pts = await loadPatients();
      await Promise.all([loadTasks(), loadAllVitalsAndDrugs(pts)]);
      setLoading(false);
    })();
  }, [loadPatients, loadTasks, loadAllVitalsAndDrugs]);

  const handleRefreshPatients = async () => {
    const pts = await loadPatients();
    await loadAllVitalsAndDrugs(pts);
    // Update selected patient if viewing one
    if (selectedPatient) {
      const updated = pts.find(p => p.id === selectedPatient.id);
      if (updated) setSelectedPatient(updated);
    }
  };

  const handleAddPatient = async (form) => {
    const data = await api('/patients', 'POST', form);
    await handleRefreshPatients();
    return data;
  };

  const handleSelectPatient = (p) => {
    setSelectedPatient(p);
    setView('patient');
  };

  const activeTasks = tasks.filter(t => t.status !== 'done');
  const activePatients = patients.filter(p => p.status !== 'discharged');

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      {/* Global notifications */}
      <Notifications tasks={activeTasks} patients={activePatients} />

      {/* Top bar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 200, background: '#0c1526',
        padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        boxShadow: '0 2px 12px rgba(0,0,0,0.2)',
      }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 800, fontSize: 14, letterSpacing: '-0.3px' }}>CSM Hospital Kalwa</div>
          <div style={{ color: '#64748b', fontSize: 10, fontWeight: 500 }}>Unit 2 — ICU Dashboard</div>
        </div>
        <div style={{ display: 'flex', gap: 6 }}>
          {[
            { id: 'ward', label: '🏥 Ward' },
            { id: 'handover', label: '🤝 Handover' },
          ].map(v => (
            <button
              key={v.id}
              onClick={() => { setView(v.id); setSelectedPatient(null); }}
              style={{
                fontSize: 11, padding: '6px 12px', borderRadius: 8, cursor: 'pointer', fontWeight: 600,
                background: view === v.id ? '#3b82f6' : 'transparent',
                color: view === v.id ? '#fff' : '#94a3b8',
                border: view === v.id ? 'none' : '1px solid #1e293b',
              }}
            >
              {v.label}
            </button>
          ))}
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <span style={{ fontSize: 10, background: activeTasks.filter(t => t.status === 'overdue').length > 0 ? '#dc2626' : '#1e293b', color: '#fff', padding: '3px 8px', borderRadius: 10, fontWeight: 700 }}>
            {activeTasks.filter(t => t.status === 'overdue').length} overdue
          </span>
          <span style={{ fontSize: 10, background: '#1e293b', color: '#60a5fa', padding: '3px 8px', borderRadius: 10, fontWeight: 700 }}>
            {activePatients.length} admitted
          </span>
        </div>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: 480, margin: '0 auto', padding: '16px 12px 40px' }}>
        {view === 'ward' && !selectedPatient && (
          <WardOverview
            patients={patients}
            tasks={tasks}
            onSelectPatient={handleSelectPatient}
            onAddPatient={handleAddPatient}
            loading={loading}
          />
        )}

        {view === 'patient' && selectedPatient && (
          <PatientDetail
            patient={selectedPatient}
            tasks={tasks}
            allPatients={patients}
            allVitals={allVitals}
            onBack={() => { setView('ward'); setSelectedPatient(null); }}
            onRefreshPatients={handleRefreshPatients}
            onRefreshTasks={loadTasks}
          />
        )}

        {view === 'handover' && (
          <HandoverPanel
            patients={patients}
            tasks={tasks}
            allVitals={allVitals}
            allDrugs={allDrugs}
          />
        )}
      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap');
        * { box-sizing: border-box; }
        body { margin: 0; background: #f8fafc; }
        #root { width: 100% !important; border: none !important; text-align: left !important; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
