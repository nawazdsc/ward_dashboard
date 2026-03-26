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

// ─── API helper ───────────────────────────────────────────────────────────────
const api = async (path, method = 'GET', body) => {
  const res = await fetch(PROXY + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(await res.text());
  return res.json();
};

// ─── Style constants (from reference) ─────────────────────────────────────────
const SC = {
  stable:     { bg: '#d1fae5', tx: '#065f46', dot: '#10b981' },
  review:     { bg: '#fef3c7', tx: '#92400e', dot: '#f59e0b' },
  critical:   { bg: '#fee2e2', tx: '#991b1b', dot: '#ef4444' },
  discharged: { bg: '#f3f4f6', tx: '#6b7280', dot: '#9ca3af' },
};
const TC = {
  pending:    { bg: '#eff6ff', tx: '#1e40af', bd: '#bfdbfe' },
  inprogress: { bg: '#fef3c7', tx: '#92400e', bd: '#fde68a' },
  done:       { bg: '#d1fae5', tx: '#065f46', bd: '#6ee7b7' },
  overdue:    { bg: '#fee2e2', tx: '#991b1b', bd: '#fca5a5' },
};
const INP = { width: '100%', boxSizing: 'border-box', border: '1.5px solid #e2e8f0', borderRadius: 8, padding: '8px 10px', fontSize: 13, color: '#0f172a', outline: 'none', fontFamily: "'DM Sans',sans-serif", background: '#fff' };
const SBTN = { background: '#0c1526', color: '#fff', border: 'none', borderRadius: 10, padding: '12px 0', width: '100%', fontSize: 14, fontWeight: 700, cursor: 'pointer' };
const CBTN = { background: '#f1f5f9', color: '#64748b', border: 'none', borderRadius: 10, padding: '12px 0', flex: 1, fontSize: 13, cursor: 'pointer' };
const EBTN = { background: 'none', border: '1px solid #e2e8f0', color: '#3b82f6', fontSize: 11, padding: '3px 10px', borderRadius: 6, cursor: 'pointer', fontWeight: 600 };
const SMBTN = { fontSize: 12, fontWeight: 600, padding: '5px 11px', borderRadius: 8, cursor: 'pointer' };

// ─── Reusable UI Components (from reference aesthetic) ────────────────────────
function Lbl({ c }) {
  return <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.4px', marginBottom: 4 }}>{c}</div>;
}

function Sec({ title, time, action, children }) {
  return (
    <div style={{ background: '#fff', borderRadius: 11, padding: '11px 13px', marginBottom: 8, border: '1px solid #f1f5f9' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 9 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span style={{ fontWeight: 700, fontSize: 11, color: '#0f172a', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</span>
          {time && time !== '—' && <span style={{ fontSize: 10, color: '#94a3b8', fontFamily: "'DM Mono',monospace" }}>{time}</span>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

function Mdl({ title, onClose, children }) {
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(12,21,38,0.8)', zIndex: 150, display: 'flex', alignItems: 'flex-end', maxWidth: 480, margin: '0 auto' }}>
      <div style={{ background: '#fff', borderRadius: '18px 18px 0 0', width: '100%', padding: '18px 15px 36px', maxHeight: '90vh', overflowY: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>{title}</span>
          <button onClick={onClose} style={{ background: '#f1f5f9', border: 'none', color: '#475569', width: 28, height: 28, borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Sparkline({ data, color = '#3b82f6', h = 28, w = 60 }) {
  const nums = data.map(Number).filter(n => !isNaN(n) && n > 0);
  if (nums.length < 2) return null;
  const mn = Math.min(...nums), mx = Math.max(...nums), rng = mx - mn || 1;
  const pts = nums.map((v, i) => `${(i / (nums.length - 1)) * w},${h - ((v - mn) / rng) * h}`).join(' ');
  const trend = nums[nums.length - 1] - nums[nums.length - 2];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <svg width={w} height={h + 2} style={{ overflow: 'visible', verticalAlign: 'middle' }}>
        <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx={w} cy={h - ((nums[nums.length - 1] - mn) / rng) * h} r="2.5" fill={color} />
      </svg>
      <span style={{ fontSize: 9, color: trend > 0 ? '#ef4444' : trend < 0 ? '#10b981' : '#94a3b8' }}>{trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}</span>
    </span>
  );
}

function TaskCard({ task, onChange, showPt }) {
  const tc = TC[task.status] || TC.pending;
  return (
    <div style={{ background: '#fff', borderRadius: 9, padding: '9px 11px', marginBottom: 6, border: `1px solid ${tc.bd}`, borderLeft: `3px solid ${tc.bd}` }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 13, color: '#0f172a', fontWeight: 500, lineHeight: 1.4 }}>{task.task || task.text}</div>
          {task.notes && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2, fontStyle: 'italic' }}>→ {task.notes}</div>}
          {showPt && <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>{task.bed} · {task.patient_name}</div>}
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>{task.assigned_to}{task.due_time ? ` · ⏱ ${task.due_time}` : ''}</div>
        </div>
        <select
          value={task.status}
          onChange={e => onChange(task.id, e.target.value)}
          style={{ fontSize: 10, border: `1px solid ${tc.bd}`, background: tc.bg, color: tc.tx, fontWeight: 700, borderRadius: 6, padding: '3px 5px', cursor: 'pointer', marginLeft: 8, fontFamily: "'DM Sans',sans-serif" }}
        >
          <option value="pending">Pending</option>
          <option value="inprogress">In progress</option>
          <option value="done">Done ✓</option>
          <option value="overdue">Overdue ⚠</option>
        </select>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
export default function App() {
  const [view, setView] = useState('ward');
  const [patients, setPatients] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState(null);
  const [dtab, setDtab] = useState('vitals');
  const [modal, setModal] = useState(null);

  // Detail data
  const [vitals, setVitals] = useState([]);
  const [labs, setLabs] = useState([]);
  const [drugs, setDrugs] = useState([]);
  const [files, setFiles] = useState([]);

  // Forms
  const [vForm, setVForm] = useState({});
  const [lForm, setLForm] = useState({ test_name: '', value: '', flag: 'normal' });
  const [tForm, setTForm] = useState({ task: '', assigned_to: '', due_time: '', priority: 'high', notes: '' });
  const [ptForm, setPtForm] = useState({ name: '', age: '', bed: '', diagnosis: '', attending: '', status: 'stable', drips: '' });

  // AI Chat
  const [aiMsgs, setAiMsgs] = useState([{ role: 'assistant', text: 'Hi. I know all your patients. Ask for a clinical summary, handover note, vasopressor titration advice, or drug dose.' }]);
  const [aiIn, setAiIn] = useState('');
  const [aiLoad, setAiLoad] = useState(false);

  // Discharge
  const [aiCourse, setAiCourse] = useState('');
  const [extraFields, setExtraFields] = useState({});

  // Print refs
  const printCaseRef = useRef(null);
  const printDischargeRef = useRef(null);
  const printHandoverRef = useRef(null);
  const printCaseSheet = useReactToPrint({ contentRef: printCaseRef });
  const printDischarge = useReactToPrint({ contentRef: printDischargeRef });
  const printHandover = useReactToPrint({ contentRef: printHandoverRef });
  const [handoverOut, setHandoverOut] = useState('');
  const [handoverIn, setHandoverIn] = useState('');
  const [allVitals, setAllVitals] = useState({});
  const [allDrugs, setAllDrugs] = useState({});

  const closeModal = () => setModal(null);

  // ── Data loading ──────────────────────────────────────────────────────────
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
    const vObj = {}, dObj = {};
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

  const loadDetail = useCallback(async (patientId) => {
    try {
      const [v, l, d, f] = await Promise.all([
        api(`/vitals/${patientId}`), api(`/labs/${patientId}`),
        api(`/drugs/${patientId}`), api(`/files/${patientId}`),
      ]);
      setVitals(v); setLabs(l); setDrugs(d); setFiles(f);
    } catch (err) { console.error(err); }
  }, []);

  const refreshAll = async () => {
    const pts = await loadPatients();
    await Promise.all([loadTasks(), loadAllVitalsAndDrugs(pts)]);
    if (sel) {
      const updated = pts.find(p => p.id === sel);
      if (updated) loadDetail(sel);
    }
  };

  // ── Derived ───────────────────────────────────────────────────────────────
  const selPt = patients.find(p => p.id === sel);
  const critical = patients.filter(p => p.status === 'critical');
  const activePatients = patients.filter(p => p.status !== 'discharged');
  const pending = tasks.filter(t => t.status === 'pending' || t.status === 'overdue');
  const overdue = tasks.filter(t => t.status === 'overdue');
  const ptTasks = tasks.filter(t => t.patient_id === sel);

  // ── Actions ───────────────────────────────────────────────────────────────
  const saveVitals = async () => {
    if (!sel) return;
    try {
      await api(`/vitals/${sel}`, 'POST', vForm);
      setVForm({});
      closeModal();
      await refreshAll();
      if (sel) loadDetail(sel);
    } catch (err) { alert(err.message); }
  };

  const saveLab = async () => {
    if (!sel || !lForm.test_name || !lForm.value) return;
    try {
      await api(`/labs/${sel}`, 'POST', lForm);
      setLForm({ test_name: '', value: '', flag: 'normal' });
      closeModal();
      if (sel) loadDetail(sel);
    } catch (err) { alert(err.message); }
  };

  const addTask = async () => {
    if (!tForm.task) return;
    try {
      await api('/tasks', 'POST', { ...tForm, patient_id: sel, patient_name: selPt?.name, bed: selPt?.bed });
      setTForm({ task: '', assigned_to: '', due_time: '', priority: 'high', notes: '' });
      closeModal();
      await loadTasks();
    } catch (err) { alert(err.message); }
  };

  const addPt = async () => {
    if (!ptForm.name || !ptForm.bed) return;
    try {
      await api('/patients', 'POST', ptForm);
      setPtForm({ name: '', age: '', bed: '', diagnosis: '', attending: '', status: 'stable', drips: '' });
      closeModal();
      await refreshAll();
    } catch (err) { alert(err.message); }
  };

  const updTaskStatus = async (id, status) => {
    try {
      await api(`/tasks/${id}`, 'PATCH', { status });
      await loadTasks();
    } catch (err) { alert(err.message); }
  };

  const updStatus = async (id, status) => {
    try {
      await api(`/patients/${id}`, 'PATCH', { status });
      await refreshAll();
    } catch (err) { alert(err.message); }
  };

  const saveNotes = async (id, notes) => {
    try {
      await api(`/patients/${id}`, 'PATCH', { notes });
      await refreshAll();
    } catch (err) { alert(err.message); }
  };

  const discharge = async () => {
    if (!window.confirm('Discharge this patient?')) return;
    await updStatus(sel, 'discharged');
    setSel(null);
    setView('ward');
  };

  // ── AI ────────────────────────────────────────────────────────────────────
  const sendAi = async () => {
    if (!aiIn.trim() || aiLoad) return;
    const msg = aiIn; setAiIn('');
    setAiMsgs(m => [...m, { role: 'user', text: msg }]);
    setAiLoad(true);
    try {
      const ctx = `Clinical ward AI for Unit 2, CSM Hospital Kalwa.
Critical patients: ${JSON.stringify(critical.map(p => ({ name: p.name, bed: p.bed, diagnosis: p.diagnosis, drips: p.drips, bp: p.bp, spo2: p.spo2, pulse: p.pulse, gcs: p.gcs, uop: p.uop })))}.
All patients: ${JSON.stringify(patients.map(p => ({ name: p.name, bed: p.bed, diag: p.diagnosis, status: p.status, bp: p.bp, spo2: p.spo2, pulse: p.pulse })))}.
Pending tasks: ${JSON.stringify(pending.map(t => ({ text: t.task, patient: t.patient_name, assigned: t.assigned_to, due: t.due_time, status: t.status })))}.
Be concise and clinically precise. Include MAP calculations, vasopressor endpoints, specific numbers.`;
      const res = await api('/ai', 'POST', {
        system: ctx,
        messages: [{ role: 'user', content: msg }],
        max_tokens: 1200,
      });
      setAiMsgs(m => [...m, { role: 'assistant', text: res.text || 'Try again.' }]);
    } catch { setAiMsgs(m => [...m, { role: 'assistant', text: 'Connection error.' }]); }
    setAiLoad(false);
  };

  const generateAI = async (system, userMsg, maxTokens = 1200) => {
    const res = await api('/ai', 'POST', { system, messages: [{ role: 'user', content: userMsg }], max_tokens: maxTokens });
    return res.text;
  };

  const generateProgressNote = async (subjective) => {
    const context = `Patient: ${selPt?.name}, Age: ${selPt?.age}, Bed: ${selPt?.bed}\nDiagnosis: ${selPt?.diagnosis}\nLatest Vitals: ${vitals[0] ? `BP ${vitals[0].bp}, SpO2 ${vitals[0].spo2}%, HR ${vitals[0].pulse}, Temp ${vitals[0].temp}°C` : 'None'}\nToday's Labs: ${labs.slice(0, 8).map(l => `${l.test_name}: ${l.value} [${l.flag}]`).join(', ') || 'None'}\nActive Medications: ${drugs.filter(d => d.is_active).map(d => `${d.name} ${d.dose} ${d.frequency}`).join(', ') || 'None'}\nSubjective: ${subjective || 'Not provided'}`;
    return generateAI('You are a senior ICU physician. Generate a SOAP progress note. Be concise. Format: A:\n[assessment]\n\nP:\n[bulleted plan].', context, 1000);
  };

  const generateHospitalCourse = async () => {
    const context = `Patient: ${selPt?.name}, ${selPt?.age}y, MRD: ${selPt?.mrd_number || 'N/A'}\nAdmitted: ${selPt?.admit_date}, Bed: ${selPt?.bed}\nDiagnosis: ${selPt?.diagnosis}\nVitals: ${vitals.slice(0, 5).map(v => `BP:${v.bp} SpO2:${v.spo2}% HR:${v.pulse}`).join(' | ')}\nLabs: ${labs.slice(0, 20).map(l => `${l.test_name}:${l.value}(${l.flag})`).join(', ')}\nDrugs: ${drugs.map(d => `${d.name} ${d.dose} ${d.frequency}`).join(', ')}`;
    const text = await generateAI('You are an ICU physician writing a discharge summary. Write a concise, factual hospital course in 3-5 sentences.', context, 600);
    setAiCourse(text);
  };

  // ── Select patient ────────────────────────────────────────────────────────
  const selectPt = (id) => {
    setSel(id);
    setView('patients');
    setDtab('vitals');
    loadDetail(id);
  };

  // ── DETAIL TABS ───────────────────────────────────────────────────────────
  const DETAIL_TABS = [
    { id: 'vitals', label: 'Vitals' },
    { id: 'labs', label: 'Labs' },
    { id: 'treatment', label: 'Rx' },
    { id: 'tasks', label: 'Tasks' },
    { id: 'progress', label: 'Notes' },
    { id: 'discharge', label: 'DC' },
    { id: 'print', label: 'Print' },
    { id: 'files', label: 'Files' },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans','Segoe UI',sans-serif", background: '#f0f4f8', minHeight: '100vh', maxWidth: 480, margin: '0 auto' }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700;800&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      <Notifications tasks={pending} patients={activePatients} />

      {/* ── TOP BAR ──────────────────────────────────────────────────────── */}
      <div style={{ background: '#0c1526', padding: '11px 15px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', position: 'sticky', top: 0, zIndex: 100 }}>
        <div>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: 15, letterSpacing: '-0.3px' }}>Unit <span style={{ color: '#3b82f6' }}>2</span></div>
          <div style={{ color: '#475569', fontSize: 10, fontFamily: "'DM Mono',monospace", marginTop: 1 }}>CSM Hospital · Kalwa · {new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {overdue.length > 0 && <div style={{ background: '#450a0a', color: '#ef4444', fontSize: 10, fontWeight: 700, padding: '3px 8px', borderRadius: 20 }}>⚠ {overdue.length}</div>}
          <button onClick={() => setModal('ai')} style={{ background: '#1d4ed8', border: 'none', color: '#fff', fontSize: 11, padding: '5px 11px', borderRadius: 8, cursor: 'pointer', fontWeight: 700 }}>AI ✦</button>
        </div>
      </div>

      {/* ── STATS BAR ────────────────────────────────────────────────────── */}
      <div style={{ background: '#0f172a', padding: '10px 16px', display: 'flex' }}>
        {[
          { l: 'Admitted', v: activePatients.length, c: '#60a5fa' },
          { l: 'Critical', v: critical.length, c: '#f87171' },
          { l: 'On drips', v: patients.filter(p => p.drips && (Array.isArray(p.drips) ? p.drips.length > 0 : p.drips.length > 0)).length, c: '#fb923c' },
          { l: 'Tasks', v: pending.length, c: '#fbbf24' },
        ].map((s, i) => (
          <div key={s.l} style={{ flex: 1, textAlign: 'center', borderRight: i < 3 ? '1px solid #1e293b' : 'none' }}>
            <div style={{ color: s.c, fontWeight: 700, fontSize: 20, fontFamily: "'DM Mono',monospace", lineHeight: 1 }}>{s.v}</div>
            <div style={{ color: '#475569', fontSize: 10, marginTop: 2 }}>{s.l}</div>
          </div>
        ))}
      </div>

      {loading && <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748b', fontSize: 13 }}>Loading patients…</div>}

      {/* ── CRITICAL STRIP ───────────────────────────────────────────────── */}
      {!loading && critical.length > 0 && !sel && (
        <div style={{ background: '#1a0505', borderBottom: '1px solid #450a0a', padding: '8px 11px' }}>
          <div style={{ fontSize: 10, color: '#ef4444', fontWeight: 700, textTransform: 'uppercase', marginBottom: 5 }}>⚠ Critical — immediate attention</div>
          {critical.map(pt => (
            <div key={pt.id} onClick={() => selectPt(pt.id)} style={{ background: '#2d0707', borderRadius: 8, padding: '8px 10px', marginBottom: 4, cursor: 'pointer', border: '1px solid #7f1d1d' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 3 }}>
                <span style={{ color: '#fca5a5', fontWeight: 700, fontSize: 13 }}>{pt.name}</span>
                <span style={{ color: '#64748b', fontSize: 11 }}>{pt.bed}</span>
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {[['BP', pt.bp, parseInt(pt.bp) < 90], ['SpO₂', `${pt.spo2}%`, parseInt(pt.spo2) < 93], ['HR', pt.pulse, parseInt(pt.pulse) > 110]].map(([l, v, w]) => (
                  v && v !== '%' && <span key={l} style={{ fontSize: 10, color: w ? '#fca5a5' : '#94a3b8', fontFamily: "'DM Mono',monospace" }}><span style={{ color: w ? '#ef4444' : '#475569' }}>{v}</span> {l}</span>
                ))}
                {pt.drips && <span style={{ fontSize: 10, color: '#fb923c', background: '#431407', padding: '2px 6px', borderRadius: 4 }}>💉 {Array.isArray(pt.drips) ? pt.drips.length + ' drips' : 'drips'}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── NAV TABS ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', background: '#fff', borderBottom: '1px solid #e2e8f0', position: 'sticky', top: 60, zIndex: 90 }}>
        {[
          { k: 'ward', l: 'Ward' },
          { k: 'patients', l: 'Patients' },
          { k: 'tasks', l: `Tasks${pending.length > 0 ? ` (${pending.length})` : ''}` },
          { k: 'handover', l: '🤝' },
        ].map(tab => (
          <button key={tab.k} onClick={() => { setView(tab.k); setSel(null); }} style={{ flex: 1, padding: '10px 4px', background: 'none', border: 'none', borderBottom: view === tab.k && !sel ? '2px solid #3b82f6' : '2px solid transparent', color: view === tab.k && !sel ? '#1e40af' : '#64748b', fontSize: 13, fontWeight: view === tab.k && !sel ? 700 : 400, cursor: 'pointer' }}>{tab.l}</button>
        ))}
      </div>

      <div style={{ padding: '10px 10px 100px' }}>

        {/* ══════════════ WARD VIEW ══════════════ */}
        {!loading && view === 'ward' && !sel && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>All beds</span>
              <button onClick={() => setModal('addpt')} style={{ ...SMBTN, background: '#3b82f6', color: '#fff', border: 'none' }}>+ Admit</button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {patients.map(pt => {
                const sc = SC[pt.status] || SC.stable;
                const ptT = tasks.filter(t => t.patient_id === pt.id && (t.status === 'pending' || t.status === 'overdue'));
                return (
                  <div key={pt.id} onClick={() => selectPt(pt.id)} style={{ background: '#fff', borderRadius: 12, padding: 11, border: `1.5px solid ${pt.status === 'critical' ? '#fca5a5' : '#e2e8f0'}`, cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontSize: 11, fontWeight: 600, color: '#475569', background: '#f1f5f9', padding: '2px 6px', borderRadius: 4 }}>{pt.bed}</span>
                      <span style={{ background: sc.bg, color: sc.tx, fontSize: 9, padding: '2px 6px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase' }}>{pt.status}</span>
                    </div>
                    <div style={{ fontWeight: 600, fontSize: 13, color: '#0f172a', lineHeight: 1.2 }}>{pt.name}</div>
                    <div style={{ fontSize: 11, color: '#64748b', margin: '2px 0 4px' }}>{pt.diagnosis}</div>
                    {pt.drips && <div style={{ fontSize: 10, color: '#ea580c', marginBottom: 4 }}>💉 {Array.isArray(pt.drips) ? pt.drips.length : 1} drip{Array.isArray(pt.drips) && pt.drips.length > 1 ? 's' : ''}</div>}
                    <div style={{ fontSize: 10, color: '#475569', fontFamily: "'DM Mono',monospace" }}>SpO₂ {pt.spo2 || '—'}% · HR {pt.pulse || '—'}</div>
                    {ptT.length > 0 && <div style={{ marginTop: 5, background: '#fef9c3', borderRadius: 5, padding: '2px 6px', fontSize: 10, color: '#854d0e' }}>{ptT.some(t => t.status === 'overdue') ? '⚠' : '•'} {ptT.length} task{ptT.length > 1 ? 's' : ''}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ══════════════ PATIENT LIST ══════════════ */}
        {!loading && view === 'patients' && !sel && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>{patients.length} patients</span>
              <button onClick={() => setModal('addpt')} style={{ ...SMBTN, background: '#3b82f6', color: '#fff', border: 'none' }}>+ Admit</button>
            </div>
            {patients.map(pt => {
              const sc = SC[pt.status] || SC.stable;
              return (
                <div key={pt.id} onClick={() => selectPt(pt.id)} style={{ background: '#fff', borderRadius: 11, padding: '11px 13px', marginBottom: 7, border: '1px solid #e2e8f0', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 11 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: sc.dot, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 14, color: '#0f172a' }}>{pt.name} <span style={{ fontWeight: 400, color: '#94a3b8', fontSize: 12 }}>{pt.age}y</span></div>
                    <div style={{ fontSize: 12, color: '#64748b', display: 'flex', gap: 6, marginTop: 1 }}>
                      <span style={{ fontFamily: "'DM Mono',monospace", fontWeight: 500, color: '#475569' }}>{pt.bed}</span>
                      <span>·</span><span>{pt.diagnosis}</span>
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ background: sc.bg, color: sc.tx, fontSize: 9, padding: '2px 7px', borderRadius: 20, fontWeight: 700, textTransform: 'uppercase' }}>{pt.status}</div>
                    <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}>{pt.attending}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ══════════════ PATIENT DETAIL ══════════════ */}
        {sel && selPt && (
          <div>
            <button onClick={() => { setSel(null); setView('ward'); }} style={{ background: 'none', border: 'none', color: '#3b82f6', fontSize: 13, cursor: 'pointer', padding: '0 0 8px', fontWeight: 500 }}>← Back</button>

            {/* Patient header card */}
            <div style={{ background: '#0c1526', borderRadius: 14, padding: '13px 15px', marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div style={{ color: '#fff', fontWeight: 700, fontSize: 17, letterSpacing: '-0.3px' }}>{selPt.name}</div>
                  <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>{selPt.age}y · {selPt.diagnosis}</div>
                  {selPt.drips && (
                    <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3 }}>
                      {(Array.isArray(selPt.drips) ? selPt.drips : [selPt.drips]).filter(Boolean).map((d, i) => (
                        <span key={i} style={{ fontSize: 10, color: '#fb923c', background: '#431407', padding: '2px 8px', borderRadius: 5, width: 'fit-content' }}>💉 {d}</span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: 15, color: '#60a5fa' }}>{selPt.bed}</div>
                  <div style={{ color: '#475569', fontSize: 10, marginTop: 2 }}>{selPt.admit_date?.slice(0, 10)}</div>
                  <div style={{ color: '#475569', fontSize: 10 }}>{selPt.attending}</div>
                </div>
              </div>
              <div style={{ marginTop: 9, display: 'flex', gap: 5, flexWrap: 'wrap' }}>
                {['stable', 'review', 'critical', 'discharged'].map(s => {
                  const sc = SC[s];
                  return (
                    <button key={s} onClick={() => updStatus(selPt.id, s)} style={{ background: selPt.status === s ? sc.bg : '#1e293b', color: selPt.status === s ? sc.tx : '#475569', border: selPt.status === s ? `1.5px solid ${sc.dot}` : '1px solid #334155', fontSize: 10, padding: '3px 9px', borderRadius: 20, cursor: 'pointer', fontWeight: 700, textTransform: 'uppercase' }}>{s}</button>
                  );
                })}
              </div>
            </div>

            {/* Quick action buttons */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {[
                ['+ Vitals', '#eff6ff', '#1d4ed8', '#bfdbfe', () => setModal('vitals')],
                ['+ Lab', '#f0fdf4', '#166534', '#bbf7d0', () => setModal('lab')],
                ['+ Task', '#fefce8', '#854d0e', '#fef08a', () => setModal('task')],
              ].map(([l, bg, col, bd, fn]) => (
                <button key={l} onClick={fn} style={{ flex: 1, padding: '8px 0', background: bg, color: col, border: `1px solid ${bd}`, borderRadius: 9, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>{l}</button>
              ))}
            </div>

            {/* Detail tabs */}
            <div style={{ display: 'flex', background: '#fff', borderRadius: 10, border: '1px solid #e2e8f0', marginBottom: 8, overflow: 'hidden' }}>
              {DETAIL_TABS.map(t => (
                <button key={t.id} onClick={() => setDtab(t.id)} style={{ flex: 1, padding: '9px 2px', background: dtab === t.id ? '#0f172a' : 'transparent', border: 'none', color: dtab === t.id ? '#fff' : '#64748b', fontSize: 11, fontWeight: dtab === t.id ? 700 : 400, cursor: 'pointer' }}>{t.label}</button>
              ))}
            </div>

            {/* ── VITALS TAB ── */}
            {dtab === 'vitals' && (
              <div>
                <Sec title="Latest Vitals" time={selPt.vitals_time?.slice(11, 16)}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 7 }}>
                    {[
                      { l: 'BP', v: selPt.bp || '—', u: 'mmHg', w: parseInt(selPt.bp) < 90 },
                      { l: 'SpO₂', v: selPt.spo2 ? `${selPt.spo2}%` : '—', u: '', w: parseInt(selPt.spo2) < 93 },
                      { l: 'Pulse', v: selPt.pulse || '—', u: 'bpm', w: parseInt(selPt.pulse) > 110 },
                      { l: 'Temp', v: selPt.temp || '—', u: '°C', w: parseFloat(selPt.temp) > 38.5 },
                      { l: 'RR', v: selPt.rr || '—', u: '/min', w: parseInt(selPt.rr) > 25 },
                      { l: 'GCS', v: selPt.gcs || '—', u: '/15', w: parseInt(selPt.gcs) < 13 },
                      { l: 'UOP', v: selPt.uop || '—', u: 'ml/hr', w: parseInt(selPt.uop) < 20 && selPt.uop },
                      { l: 'RBS', v: selPt.rbs || '—', u: 'mg/dL', w: parseInt(selPt.rbs) > 250 || parseInt(selPt.rbs) < 70 },
                    ].map(({ l, v, u, w }) => (
                      <div key={l} style={{ background: w && v !== '—' ? '#fff1f2' : '#f8fafc', borderRadius: 8, padding: '8px 9px', border: `1px solid ${w && v !== '—' ? '#fecdd3' : '#e2e8f0'}` }}>
                        <div style={{ fontSize: 9, color: w && v !== '—' ? '#9f1239' : '#94a3b8', marginBottom: 1 }}>{l}</div>
                        <div style={{ fontFamily: "'DM Mono',monospace", fontWeight: 700, fontSize: 15, color: w && v !== '—' ? '#be123c' : '#0f172a', lineHeight: 1 }}>{v}</div>
                        {u && <div style={{ fontSize: 9, color: '#cbd5e1', marginTop: 1 }}>{u}</div>}
                      </div>
                    ))}
                  </div>
                </Sec>
                {vitals.length > 0 && (
                  <Sec title="Vitals Trend">
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', fontSize: 11, borderCollapse: 'collapse', fontFamily: "'DM Mono',monospace" }}>
                        <thead><tr style={{ background: '#f8fafc' }}>
                          {['Time', 'BP', 'SpO₂', 'HR', 'Temp', 'RR', 'GCS', 'UOP', 'RBS'].map(h => (
                            <th key={h} style={{ padding: '4px 5px', textAlign: 'left', color: '#64748b', fontWeight: 600, fontSize: 10, borderBottom: '1px solid #e2e8f0', whiteSpace: 'nowrap' }}>{h}</th>
                          ))}
                        </tr></thead>
                        <tbody>
                          {vitals.slice(0, 20).map((v, i) => (
                            <tr key={i} style={{ borderBottom: '1px solid #f1f5f9' }}>
                              <td style={{ padding: '4px 5px', color: '#64748b', whiteSpace: 'nowrap' }}>{v.recorded_at?.slice(11, 16)}</td>
                              <td style={{ padding: '4px 5px', color: parseInt(v.bp) < 90 ? '#ef4444' : '#0f172a' }}>{v.bp || '—'}</td>
                              <td style={{ padding: '4px 5px', color: parseFloat(v.spo2) < 93 ? '#ef4444' : '#0f172a' }}>{v.spo2 ? `${v.spo2}%` : '—'}</td>
                              <td style={{ padding: '4px 5px' }}>{v.pulse || '—'}</td>
                              <td style={{ padding: '4px 5px', color: parseFloat(v.temp) > 38.5 ? '#ef4444' : '#0f172a' }}>{v.temp || '—'}</td>
                              <td style={{ padding: '4px 5px' }}>{v.rr || '—'}</td>
                              <td style={{ padding: '4px 5px', color: parseFloat(v.gcs) < 13 ? '#ef4444' : '#0f172a' }}>{v.gcs || '—'}</td>
                              <td style={{ padding: '4px 5px' }}>{v.uop || '—'}</td>
                              <td style={{ padding: '4px 5px' }}>{v.rbs || '—'}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Sec>
                )}
              </div>
            )}

            {/* ── LABS TAB ── */}
            {dtab === 'labs' && (
              <div>
                <LabChart labs={labs} />
              </div>
            )}

            {/* ── TREATMENT TAB ── */}
            {dtab === 'treatment' && (
              <TreatmentSheet
                drugs={drugs}
                patientName={selPt.name}
                onAddDrug={async (drugData) => { await api(`/drugs/${sel}`, 'POST', drugData); loadDetail(sel); }}
                onToggleDrug={async (id, is_active) => { await api(`/drugs/${id}`, 'PATCH', { is_active }); loadDetail(sel); }}
              />
            )}

            {/* ── TASKS TAB ── */}
            {dtab === 'tasks' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <span style={{ fontSize: 12, color: '#64748b' }}>{ptTasks.length} tasks</span>
                  <button onClick={() => setModal('task')} style={{ ...SMBTN, background: '#3b82f6', color: '#fff', border: 'none' }}>+ Task</button>
                </div>
                {ptTasks.length === 0 ? <div style={{ color: '#cbd5e1', fontSize: 13, textAlign: 'center', marginTop: 20 }}>No tasks.</div> : ptTasks.map(t => <TaskCard key={t.id} task={t} onChange={updTaskStatus} />)}
              </div>
            )}

            {/* ── PROGRESS NOTE TAB ── */}
            {dtab === 'progress' && (
              <ProgressNote
                patient={selPt} vitals={vitals} labs={labs} drugs={drugs}
                existingNotes={selPt.notes}
                onSave={async (note, subjective) => {
                  const ts = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata', day: '2-digit', month: '2-digit', year: '2-digit', hour: '2-digit', minute: '2-digit' });
                  const full = `[${ts}]\nS: ${subjective || '—'}\n${note}`;
                  const combined = selPt.notes ? `${selPt.notes}\n\n---\n\n${full}` : full;
                  await saveNotes(sel, combined);
                }}
                onGenerateAI={generateProgressNote}
              />
            )}

            {/* ── DISCHARGE TAB ── */}
            {dtab === 'discharge' && (
              <div>
                <Sec title="Discharge Summary" action={
                  <button onClick={generateHospitalCourse} style={{ ...EBTN, background: '#1d4ed8', color: '#fff', border: 'none' }}>AI Generate</button>
                }>
                  <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: 8 }}>{selPt.status !== 'discharged' ? 'Patient still admitted. Pre-generate discharge card.' : 'Patient discharged.'}</div>
                </Sec>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 11, overflow: 'auto', maxHeight: '60vh' }}>
                  <DischargeCard ref={printDischargeRef} patient={selPt} vitals={vitals} labs={labs} drugs={drugs} aiCourse={aiCourse} onCourseChange={setAiCourse} extraFields={extraFields} onFieldChange={(k, v) => setExtraFields(f => ({ ...f, [k]: v }))} onGenerate={generateHospitalCourse} />
                </div>
                <button onClick={printDischarge} style={{ ...SBTN, marginTop: 10 }}>🖨️ Print Discharge</button>
                {selPt.status !== 'discharged' && (
                  <button onClick={discharge} style={{ ...SBTN, marginTop: 6, background: '#991b1b' }}>Discharge Patient</button>
                )}
              </div>
            )}

            {/* ── PRINT TAB ── */}
            {dtab === 'print' && (
              <div>
                <div style={{ border: '1px solid #e2e8f0', borderRadius: 11, overflow: 'auto', maxHeight: '60vh', marginBottom: 10 }}>
                  <PrintCaseSheet ref={printCaseRef} patient={selPt} vitals={vitals} labs={labs} drugs={drugs} tasks={ptTasks} />
                </div>
                <button onClick={printCaseSheet} style={SBTN}>🖨️ Print Case Sheet</button>
              </div>
            )}

            {/* ── FILES TAB ── */}
            {dtab === 'files' && (
              <FileUpload files={files} patientName={selPt.name} onUpload={async (fileData) => { await api(`/files/${sel}`, 'POST', fileData); loadDetail(sel); }} />
            )}
          </div>
        )}

        {/* ══════════════ TASKS VIEW ══════════════ */}
        {view === 'tasks' && !sel && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: '#64748b' }}>{pending.length} active tasks</span>
              <button onClick={() => setModal('task')} style={{ ...SMBTN, background: '#3b82f6', color: '#fff', border: 'none' }}>+ Task</button>
            </div>
            {tasks.length === 0 && <div style={{ color: '#cbd5e1', fontSize: 13, textAlign: 'center', marginTop: 20 }}>No tasks yet.</div>}
            {tasks.filter(t => t.status !== 'done').map(t => <TaskCard key={t.id} task={t} onChange={updTaskStatus} showPt />)}
            {tasks.filter(t => t.status === 'done').length > 0 && (
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#065f46', background: '#d1fae5', border: '1px solid #6ee7b7', borderRadius: 7, padding: '4px 10px', marginBottom: 6, display: 'inline-block' }}>Completed ✓</div>
                {tasks.filter(t => t.status === 'done').map(t => <TaskCard key={t.id} task={t} onChange={updTaskStatus} showPt />)}
              </div>
            )}
          </div>
        )}

        {/* ══════════════ HANDOVER VIEW ══════════════ */}
        {view === 'handover' && !sel && (
          <div>
            <Sec title="Shift Handover">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                <div><Lbl c="Outgoing Doctor" /><input value={handoverOut} onChange={e => setHandoverOut(e.target.value)} style={INP} placeholder="Dr. ..." /></div>
                <div><Lbl c="Incoming Doctor" /><input value={handoverIn} onChange={e => setHandoverIn(e.target.value)} style={INP} placeholder="Dr. ..." /></div>
              </div>
            </Sec>
            <div style={{ border: '1px solid #e2e8f0', borderRadius: 11, overflow: 'auto', maxHeight: '60vh', marginBottom: 10 }}>
              <ShiftHandover ref={printHandoverRef} patients={activePatients} vitals={allVitals} tasks={tasks} drugs={allDrugs} outgoing={handoverOut} incoming={handoverIn} />
            </div>
            <button onClick={printHandover} style={SBTN}>🖨️ Print Handover</button>
          </div>
        )}
      </div>

      {/* ══════════════ MODALS ══════════════ */}

      {/* VITALS MODAL */}
      {modal === 'vitals' && (
        <Mdl title={`Record Vitals — ${selPt?.name}`} onClose={closeModal}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 12 }}>
            {[['bp', 'BP (e.g. 120/80)'], ['spo2', 'SpO₂ (%)'], ['pulse', 'Pulse (bpm)'], ['temp', 'Temp (°C)'], ['rr', 'RR (/min)'], ['gcs', 'GCS (/15)'], ['uop', 'UOP (ml/hr)'], ['rbs', 'RBS (mg/dL)']].map(([k, l]) => (
              <div key={k}><Lbl c={l} /><input value={vForm[k] || ''} onChange={e => setVForm(f => ({ ...f, [k]: e.target.value }))} style={INP} placeholder="—" /></div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveVitals} style={{ ...SBTN, flex: 2 }}>Save Vitals</button>
            <button onClick={closeModal} style={{ ...CBTN, flex: 1 }}>Cancel</button>
          </div>
        </Mdl>
      )}

      {/* LAB MODAL */}
      {modal === 'lab' && (
        <Mdl title={`Add Lab Result — ${selPt?.name}`} onClose={closeModal}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 12 }}>
            <div><Lbl c="Test name" /><input value={lForm.test_name} onChange={e => setLForm(f => ({ ...f, test_name: e.target.value }))} style={INP} placeholder="e.g. Lactate, ABG, CBC" /></div>
            <div><Lbl c="Result / value" /><input value={lForm.value} onChange={e => setLForm(f => ({ ...f, value: e.target.value }))} style={INP} placeholder="e.g. 4.2 mmol/L" /></div>
            <div>
              <Lbl c="Flag" />
              <div style={{ display: 'flex', gap: 6 }}>
                {[['normal', '#f0fdf4', '#166534', '#bbf7d0'], ['high', '#fff7ed', '#9a3412', '#fed7aa'], ['critical', '#fff1f2', '#9f1239', '#fecdd3']].map(([f, bg, col, bd]) => (
                  <button key={f} onClick={() => setLForm(x => ({ ...x, flag: f }))} style={{ flex: 1, padding: '7px 0', background: lForm.flag === f ? bg : '#fff', color: lForm.flag === f ? col : '#64748b', border: `1.5px solid ${lForm.flag === f ? bd : '#e2e8f0'}`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>{f}</button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveLab} style={{ ...SBTN, flex: 2 }}>Save Result</button>
            <button onClick={closeModal} style={{ ...CBTN, flex: 1 }}>Cancel</button>
          </div>
        </Mdl>
      )}

      {/* TASK MODAL */}
      {modal === 'task' && (
        <Mdl title="Assign Task" onClose={closeModal}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div><Lbl c="Task description" /><textarea value={tForm.task} onChange={e => setTForm(f => ({ ...f, task: e.target.value }))} rows={3} style={{ ...INP, resize: 'none', lineHeight: 1.5 }} placeholder="e.g. Check ABG and adjust NIV" /></div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div><Lbl c="Assign to" /><input value={tForm.assigned_to} onChange={e => setTForm(f => ({ ...f, assigned_to: e.target.value }))} style={INP} placeholder="Dr. / Nurse" /></div>
              <div><Lbl c="Due time" /><input type="time" value={tForm.due_time} onChange={e => setTForm(f => ({ ...f, due_time: e.target.value }))} style={INP} /></div>
            </div>
            <div>
              <Lbl c="Priority" />
              <div style={{ display: 'flex', gap: 6 }}>
                {[['low', '#f0fdf4', '#166534', '#bbf7d0'], ['medium', '#fefce8', '#854d0e', '#fef08a'], ['high', '#fff1f2', '#9f1239', '#fecdd3']].map(([p, bg, col, bd]) => (
                  <button key={p} onClick={() => setTForm(f => ({ ...f, priority: p }))} style={{ flex: 1, padding: '7px 0', background: tForm.priority === p ? bg : '#fff', color: tForm.priority === p ? col : '#64748b', border: `1.5px solid ${tForm.priority === p ? bd : '#e2e8f0'}`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>{p}</button>
                ))}
              </div>
            </div>
            <div><Lbl c="Notes (optional)" /><input value={tForm.notes} onChange={e => setTForm(f => ({ ...f, notes: e.target.value }))} style={INP} placeholder="e.g. Target MAP ≥65" /></div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={addTask} style={{ ...SBTN, flex: 2 }}>Assign Task</button>
              <button onClick={closeModal} style={{ ...CBTN, flex: 1 }}>Cancel</button>
            </div>
          </div>
        </Mdl>
      )}

      {/* ADD PATIENT MODAL */}
      {modal === 'addpt' && (
        <Mdl title="Admit Patient" onClose={closeModal}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[['name', 'Full Name', 'text', 'Ramesh Patil'], ['age', 'Age', 'number', '55'], ['bed', 'Bed / Location', 'text', 'ICU-4'], ['diagnosis', 'Primary Diagnosis', 'text', 'Septic shock']].map(([k, l, t, ph]) => (
              <div key={k}><Lbl c={l} /><input type={t} value={ptForm[k] || ''} onChange={e => setPtForm(p => ({ ...p, [k]: e.target.value }))} style={INP} placeholder={ph} /></div>
            ))}
            <div><Lbl c="Active Drips" /><input value={ptForm.drips} onChange={e => setPtForm(p => ({ ...p, drips: e.target.value }))} style={INP} placeholder="Noradrenaline 0.2 mcg/kg/min" /></div>
            <div><Lbl c="Attending" /><input value={ptForm.attending} onChange={e => setPtForm(p => ({ ...p, attending: e.target.value }))} style={INP} placeholder="Dr. ..." /></div>
            <div>
              <Lbl c="Initial Status" />
              <div style={{ display: 'flex', gap: 6 }}>
                {['stable', 'review', 'critical'].map(s => {
                  const sc = SC[s];
                  return (
                    <button key={s} onClick={() => setPtForm(p => ({ ...p, status: s }))} style={{ flex: 1, padding: '7px 0', background: ptForm.status === s ? sc.bg : '#fff', color: ptForm.status === s ? sc.tx : '#64748b', border: `1.5px solid ${ptForm.status === s ? sc.dot : '#e2e8f0'}`, borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', textTransform: 'capitalize' }}>{s}</button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={addPt} style={{ ...SBTN, flex: 2 }}>Admit & Save</button>
              <button onClick={closeModal} style={{ ...CBTN, flex: 1 }}>Cancel</button>
            </div>
          </div>
        </Mdl>
      )}

      {/* ══════════════ AI CHAT ══════════════ */}
      {modal === 'ai' && (
        <div style={{ position: 'fixed', inset: 0, background: '#0c1526', zIndex: 200, maxWidth: 480, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
          <div style={{ padding: '13px 15px', borderBottom: '1px solid #1e293b', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>Ward AI <span style={{ color: '#3b82f6' }}>✦</span></div>
              <div style={{ color: '#475569', fontSize: 11 }}>Knows all patients · clinical context</div>
            </div>
            <button onClick={closeModal} style={{ background: '#1e293b', border: 'none', color: '#94a3b8', fontSize: 14, width: 30, height: 30, borderRadius: 8, cursor: 'pointer' }}>✕</button>
          </div>
          <div style={{ flex: 1, overflowY: 'auto', padding: '12px 13px', display: 'flex', flexDirection: 'column', gap: 9 }}>
            {aiMsgs.map((m, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start' }}>
                <div style={{ background: m.role === 'user' ? '#1d4ed8' : '#1e293b', color: '#e2e8f0', borderRadius: m.role === 'user' ? '14px 14px 4px 14px' : '14px 14px 14px 4px', padding: '10px 13px', maxWidth: '88%', fontSize: 13, lineHeight: 1.7, whiteSpace: 'pre-wrap' }}>{m.text}</div>
              </div>
            ))}
            {aiLoad && <div style={{ display: 'flex' }}><div style={{ background: '#1e293b', color: '#475569', borderRadius: '14px 14px 14px 4px', padding: '10px 13px', fontSize: 13 }}>Thinking…</div></div>}
          </div>
          <div style={{ padding: '7px 12px 5px', display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            {['Summarise ICU patients', 'Night handover note', 'Overdue tasks', 'Vasopressor dose range'].map(q => (
              <button key={q} onClick={() => setAiIn(q)} style={{ fontSize: 11, background: '#1e293b', border: '1px solid #334155', color: '#64748b', borderRadius: 20, padding: '4px 10px', cursor: 'pointer' }}>{q}</button>
            ))}
          </div>
          <div style={{ padding: '5px 12px 24px', display: 'flex', gap: 8 }}>
            <input value={aiIn} onChange={e => setAiIn(e.target.value)} onKeyDown={e => e.key === 'Enter' && !aiLoad && sendAi()} placeholder="Ask anything clinical…" style={{ flex: 1, background: '#1e293b', border: '1px solid #334155', color: '#e2e8f0', borderRadius: 10, padding: '11px 12px', fontSize: 13, outline: 'none', fontFamily: "'DM Sans',sans-serif" }} />
            <button onClick={sendAi} disabled={aiLoad} style={{ background: '#1d4ed8', border: 'none', color: '#fff', borderRadius: 10, padding: '11px 15px', fontSize: 15, cursor: 'pointer', opacity: aiLoad ? 0.5 : 1 }}>↑</button>
          </div>
        </div>
      )}

      <style>{`
        * { box-sizing: border-box; }
        body { margin: 0; background: #f0f4f8; }
        #root { width: 100% !important; border: none !important; text-align: left !important; max-width: 480px !important; margin: 0 auto !important; }
        ::-webkit-scrollbar { width: 4px; height: 4px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: #cbd5e1; border-radius: 4px; }
        @keyframes slideIn { from { opacity: 0; transform: translateY(-8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
