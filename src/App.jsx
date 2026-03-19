import { useState } from 'react';

async function callClaude(systemPrompt, userMessage) {
  const res = await fetch("https://ward-proxy.onrender.com/api/claude", {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      mcp_servers: [
        {
          type: 'url',
          url: 'https://mcp.notion.com/mcp',
          name: 'notion',
        },
      ],
    }),
  });
  const data = await res.json();
  return (data.content || [])
    .filter((b) => b.type === 'text')
    .map((b) => b.text)
    .join('\n');
}

const TEAM = [
  'Dr. Suraj',
  'Dr. Manoj',
  'Dr. Shamal',
  'Dr. Niranjan',
  'Dr. Sharvesh',
  'Nurse ICU',
];

const MONITORING_PROTOCOLS = [
  {
    id: 'bp_1h',
    label: 'BP monitoring — 1 hourly',
    interval: 60,
    vitals: ['bp'],
    icon: '♥',
    color: '#ef4444',
  },
  {
    id: 'bp_2h',
    label: 'BP monitoring — 2 hourly',
    interval: 120,
    vitals: ['bp'],
    icon: '♥',
    color: '#f97316',
  },
  {
    id: 'spo2_15',
    label: 'SpO₂ + RR — 15 min',
    interval: 15,
    vitals: ['spo2', 'rr'],
    icon: '◉',
    color: '#3b82f6',
  },
  {
    id: 'full_1h',
    label: 'Full vitals — 1 hourly',
    interval: 60,
    vitals: ['bp', 'spo2', 'pulse', 'rr'],
    icon: '✦',
    color: '#8b5cf6',
  },
  {
    id: 'rbs_2h',
    label: 'RBS — 2 hourly',
    interval: 120,
    vitals: ['rbs'],
    icon: '◈',
    color: '#06b6d4',
  },
  {
    id: 'uop_1h',
    label: 'Urine output — 1 hourly',
    interval: 60,
    vitals: ['uop'],
    icon: '⬡',
    color: '#10b981',
  },
  {
    id: 'gcs_1h',
    label: 'Neuro obs (GCS) — 1 hourly',
    interval: 60,
    vitals: ['gcs'],
    icon: '◎',
    color: '#f59e0b',
  },
];

const SC = {
  stable: { bg: '#d1fae5', tx: '#065f46', dot: '#10b981' },
  review: { bg: '#fef3c7', tx: '#92400e', dot: '#f59e0b' },
  critical: { bg: '#fee2e2', tx: '#991b1b', dot: '#ef4444' },
  discharged: { bg: '#f3f4f6', tx: '#6b7280', dot: '#9ca3af' },
};
const TC = {
  pending: { bg: '#eff6ff', tx: '#1e40af', bd: '#bfdbfe' },
  inprogress: { bg: '#fef3c7', tx: '#92400e', bd: '#fde68a' },
  done: { bg: '#d1fae5', tx: '#065f46', bd: '#6ee7b7' },
  overdue: { bg: '#fee2e2', tx: '#991b1b', bd: '#fca5a5' },
};

const t0 = () =>
  new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });

const SEED_PTS = [
  {
    id: 'p1',
    name: 'Ramesh Patil',
    age: 62,
    bed: 'ICU-3',
    diagnosis: 'Septic Shock',
    admitDate: '2026-03-15',
    status: 'critical',
    attending: 'Dr. Saili',
    drips: ['Noradrenaline 0.2 mcg/kg/min', 'Vasopressin 0.03 U/min'],
    bp: '88/54',
    spo2: '91',
    pulse: '118',
    temp: '38.9',
    rr: '28',
    gcs: '11',
    uop: '15',
    rbs: '',
    vitalsTime: '07:00',
    notes:
      'Day 3 septic shock. Norad uptitrated 0600h. Target MAP ≥65. ABG pending. Cultures sent.',
    meds: [
      'Inj. Noradrenaline 8mg/50ml NS @ 5.3ml/hr',
      'Inj. Vasopressin 20U/100ml NS @ 9ml/hr',
      'Inj. Pip-Tazo 4.5g TDS',
      'Inj. Hydrocortisone 50mg Q6H',
    ],
    labs: [
      'Procalcitonin — 18.4 (critical ↑)',
      'Lactate — 4.2 mmol/L',
      'ABG: pH 7.29, PaO₂ 58',
      'Creatinine — 2.8 (AKI stage 2)',
    ],
    vitalsHistory: [
      {
        time: '03:00',
        bp: '82/50',
        spo2: '88',
        pulse: '124',
        temp: '39.1',
        rr: '30',
        uop: '10',
        rbs: '',
        gcs: '10',
      },
      {
        time: '04:00',
        bp: '80/48',
        spo2: '87',
        pulse: '128',
        temp: '39.2',
        rr: '32',
        uop: '8',
        rbs: '',
        gcs: '10',
      },
      {
        time: '05:00',
        bp: '84/52',
        spo2: '89',
        pulse: '122',
        temp: '38.9',
        rr: '30',
        uop: '12',
        rbs: '',
        gcs: '11',
      },
      {
        time: '06:00',
        bp: '86/54',
        spo2: '90',
        pulse: '120',
        temp: '38.7',
        rr: '28',
        uop: '14',
        rbs: '',
        gcs: '11',
      },
      {
        time: '07:00',
        bp: '88/54',
        spo2: '91',
        pulse: '118',
        temp: '38.9',
        rr: '28',
        uop: '15',
        rbs: '',
        gcs: '11',
      },
    ],
    labHistory: [
      {
        time: '03:00',
        label: 'Lactate',
        value: '4.8 mmol/L',
        flag: 'critical',
      },
      {
        time: '05:00',
        label: 'ABG',
        value: 'pH 7.27, PaO₂ 55',
        flag: 'critical',
      },
      { time: '07:00', label: 'ABG', value: 'pH 7.29, PaO₂ 58', flag: 'high' },
    ],
    protocols: ['bp_1h', 'spo2_15', 'uop_1h', 'gcs_1h'],
  },
  {
    id: 'p2',
    name: 'Sushila More',
    age: 47,
    bed: 'W2-B8',
    diagnosis: 'DKA',
    admitDate: '2026-03-16',
    status: 'review',
    attending: 'Dr. Saili',
    drips: ['Insulin infusion 2U/hr'],
    bp: '118/74',
    spo2: '98',
    pulse: '96',
    temp: '37.1',
    rr: '18',
    gcs: '15',
    uop: '60',
    rbs: '186',
    vitalsTime: '07:00',
    notes: 'Anion gap closing. Insulin drip reduced. Oral intake started.',
    meds: [
      'Insulin infusion 2U/hr',
      'IV NS + KCl 20mEq @ 100ml/hr',
      'Tab Pantoprazole 40mg OD',
    ],
    labs: ['RBS — 186 mg/dL (improving)', 'ABG pH 7.31', 'K⁺ — 3.8 meq/L'],
    vitalsHistory: [
      {
        time: '01:00',
        bp: '112/70',
        spo2: '97',
        pulse: '108',
        temp: '37.3',
        rr: '22',
        uop: '45',
        rbs: '310',
        gcs: '15',
      },
      {
        time: '03:00',
        bp: '115/72',
        spo2: '98',
        pulse: '104',
        temp: '37.2',
        rr: '20',
        uop: '55',
        rbs: '248',
        gcs: '15',
      },
      {
        time: '05:00',
        bp: '116/73',
        spo2: '98',
        pulse: '100',
        temp: '37.1',
        rr: '19',
        uop: '58',
        rbs: '216',
        gcs: '15',
      },
      {
        time: '07:00',
        bp: '118/74',
        spo2: '98',
        pulse: '96',
        temp: '37.1',
        rr: '18',
        uop: '60',
        rbs: '186',
        gcs: '15',
      },
    ],
    labHistory: [
      {
        time: '00:00',
        label: 'ABG',
        value: 'pH 7.18, AG 24',
        flag: 'critical',
      },
      { time: '04:00', label: 'ABG', value: 'pH 7.27, AG 18', flag: 'high' },
      { time: '07:00', label: 'ABG', value: 'pH 7.31, AG 14', flag: 'normal' },
    ],
    protocols: ['rbs_2h', 'uop_1h'],
  },
  {
    id: 'p3',
    name: 'Vijay Kadam',
    age: 38,
    bed: 'W2-B4',
    diagnosis: 'CAP — moderate',
    admitDate: '2026-03-17',
    status: 'stable',
    attending: 'Dr. Vishal',
    drips: [],
    bp: '122/80',
    spo2: '97',
    pulse: '84',
    temp: '37.6',
    rr: '16',
    gcs: '15',
    uop: '',
    rbs: '',
    vitalsTime: '07:15',
    notes: 'Switched to oral antibiotics. D/C planned tomorrow.',
    meds: ['Tab Amox-Clav 625mg BD', 'Tab Azithromycin 500mg OD'],
    labs: ['CXR — improving', 'CBC — WBC 11.2 (improving)'],
    vitalsHistory: [
      {
        time: '07:15',
        bp: '122/80',
        spo2: '97',
        pulse: '84',
        temp: '37.6',
        rr: '16',
        uop: '',
        rbs: '',
        gcs: '15',
      },
    ],
    labHistory: [],
    protocols: [],
  },
];

const SEED_TASKS = [
  {
    id: 't1',
    patientId: 'p1',
    patientName: 'Ramesh Patil',
    bed: 'ICU-3',
    text: 'BP check — Norad drip 1 hourly (target MAP ≥65)',
    assignedTo: 'Resident 1',
    dueTime: '08:00',
    status: 'overdue',
    priority: 'high',
    isMonitoring: true,
    protocol: 'bp_1h',
  },
  {
    id: 't2',
    patientId: 'p1',
    patientName: 'Ramesh Patil',
    bed: 'ICU-3',
    text: 'SpO₂ + RR monitoring — 15 min',
    assignedTo: 'Nurse ICU',
    dueTime: '08:15',
    status: 'pending',
    priority: 'high',
    isMonitoring: true,
    protocol: 'spo2_15',
  },
  {
    id: 't3',
    patientId: 'p1',
    patientName: 'Ramesh Patil',
    bed: 'ICU-3',
    text: 'Urine output — hourly record',
    assignedTo: 'Nurse ICU',
    dueTime: '08:00',
    status: 'overdue',
    priority: 'high',
    isMonitoring: true,
    protocol: 'uop_1h',
  },
  {
    id: 't4',
    patientId: 'p1',
    patientName: 'Ramesh Patil',
    bed: 'ICU-3',
    text: 'Repeat ABG + Lactate at 9am',
    assignedTo: 'Resident 1',
    dueTime: '09:00',
    status: 'pending',
    priority: 'high',
    isMonitoring: false,
  },
  {
    id: 't5',
    patientId: 'p2',
    patientName: 'Sushila More',
    bed: 'W2-B8',
    text: 'RBS check — adjust insulin sliding scale',
    assignedTo: 'Resident 2',
    dueTime: '09:00',
    status: 'pending',
    priority: 'high',
    isMonitoring: true,
    protocol: 'rbs_2h',
  },
  {
    id: 't6',
    patientId: 'p3',
    patientName: 'Vijay Kadam',
    bed: 'W2-B4',
    text: 'Prepare discharge summary',
    assignedTo: 'Resident 2',
    dueTime: '14:00',
    status: 'pending',
    priority: 'medium',
    isMonitoring: false,
  },
];

function Sparkline({ data, color = '#3b82f6', h = 28, w = 60 }) {
  const nums = data.map(Number).filter((n) => !isNaN(n) && n > 0);
  if (nums.length < 2) return null;
  const mn = Math.min(...nums),
    mx = Math.max(...nums),
    rng = mx - mn || 1;
  const pts = nums
    .map((v, i) => `${(i / (nums.length - 1)) * w},${h - ((v - mn) / rng) * h}`)
    .join(' ');
  const trend = nums[nums.length - 1] - nums[nums.length - 2];
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 2 }}>
      <svg
        width={w}
        height={h + 2}
        style={{ overflow: 'visible', verticalAlign: 'middle' }}
      >
        <polyline
          points={pts}
          fill="none"
          stroke={color}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle
          cx={((nums.length - 1) / (nums.length - 1)) * w}
          cy={h - ((nums[nums.length - 1] - mn) / rng) * h}
          r="2.5"
          fill={color}
        />
      </svg>
      <span
        style={{
          fontSize: 9,
          color: trend > 0 ? '#ef4444' : trend < 0 ? '#10b981' : '#94a3b8',
        }}
      >
        {trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}
      </span>
    </span>
  );
}

function Lbl({ c }) {
  return (
    <div
      style={{
        fontSize: 10,
        fontWeight: 700,
        color: '#64748b',
        textTransform: 'uppercase',
        letterSpacing: '0.4px',
        marginBottom: 4,
      }}
    >
      {c}
    </div>
  );
}
function Sec({ title, time, action, children }) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 11,
        padding: '11px 13px',
        marginBottom: 8,
        border: '1px solid #f1f5f9',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: 9,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
          <span
            style={{
              fontWeight: 700,
              fontSize: 11,
              color: '#0f172a',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {title}
          </span>
          {time && time !== '—' && (
            <span
              style={{
                fontSize: 10,
                color: '#94a3b8',
                fontFamily: "'DM Mono',monospace",
              }}
            >
              {time}
            </span>
          )}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}
function Mdl({ title, onClose, children }) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(12,21,38,0.8)',
        zIndex: 150,
        display: 'flex',
        alignItems: 'flex-end',
        maxWidth: 480,
        margin: '0 auto',
      }}
    >
      <div
        style={{
          background: '#fff',
          borderRadius: '18px 18px 0 0',
          width: '100%',
          padding: '18px 15px 36px',
          maxHeight: '90vh',
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 14,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 15, color: '#0f172a' }}>
            {title}
          </span>
          <button
            onClick={onClose}
            style={{
              background: '#f1f5f9',
              border: 'none',
              color: '#475569',
              width: 28,
              height: 28,
              borderRadius: 8,
              cursor: 'pointer',
              fontSize: 13,
            }}
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const INP = {
  width: '100%',
  boxSizing: 'border-box',
  border: '1.5px solid #e2e8f0',
  borderRadius: 8,
  padding: '8px 10px',
  fontSize: 13,
  color: '#0f172a',
  outline: 'none',
  fontFamily: "'DM Sans',sans-serif",
  background: '#fff',
};
const SBTN = {
  background: '#0c1526',
  color: '#fff',
  border: 'none',
  borderRadius: 10,
  padding: '12px 0',
  width: '100%',
  fontSize: 14,
  fontWeight: 700,
  cursor: 'pointer',
};
const CBTN = {
  background: '#f1f5f9',
  color: '#64748b',
  border: 'none',
  borderRadius: 10,
  padding: '12px 0',
  flex: 1,
  fontSize: 13,
  cursor: 'pointer',
};
const EBTN = {
  background: 'none',
  border: '1px solid #e2e8f0',
  color: '#3b82f6',
  fontSize: 11,
  padding: '3px 10px',
  borderRadius: 6,
  cursor: 'pointer',
  fontWeight: 600,
};
const SMBTN = {
  fontSize: 12,
  fontWeight: 600,
  padding: '5px 11px',
  borderRadius: 8,
  cursor: 'pointer',
};

export default function App() {
  const [view, setView] = useState('ward');
  const [patients, setPatients] = useState(SEED_PTS);
  const [tasks, setTasks] = useState(SEED_TASKS);
  const [sel, setSel] = useState(null);
  const [dtab, setDtab] = useState('vitals');
  const [modal, setModal] = useState(null); // "task"|"monitor"|"vitals"|"lab"|"addpt"|"setup"|"ai"
  const [vForm, setVForm] = useState({});
  const [lForm, setLForm] = useState({ label: '', value: '', flag: 'normal' });
  const [tForm, setTForm] = useState({
    text: '',
    assignedTo: TEAM[1],
    dueTime: '',
    patientId: '',
    priority: 'high',
    notes: '',
  });
  const [mForm, setMForm] = useState({
    patientId: '',
    protocols: [],
    assignTo: TEAM[1],
  });
  const [ptForm, setPtForm] = useState({
    name: '',
    age: '',
    bed: '',
    diagnosis: '',
    attending: 'Dr. Saili',
    status: 'stable',
    drips: '',
  });
  const [notionDbId, setNotionDbId] = useState('');
  const [aiMsgs, setAiMsgs] = useState([
    {
      role: 'assistant',
      text: 'Hi. I know all your patients. Ask for a clinical summary, handover note, vasopressor titration advice, or drug dose.',
    },
  ]);
  const [aiIn, setAiIn] = useState('');
  const [aiLoad, setAiLoad] = useState(false);

  const selPt = patients.find((p) => p.id === sel);
  const critical = patients.filter((p) => p.status === 'critical');
  const pending = tasks.filter(
    (t) => t.status === 'pending' || t.status === 'overdue'
  );
  const overdue = tasks.filter((t) => t.status === 'overdue');
  const ptTasks = tasks.filter((t) => t.patientId === sel);

  const closeModal = () => setModal(null);

  const saveVitals = () => {
    const pt = patients.find((p) => p.id === sel);
    if (!pt) return;
    const entry = { ...vForm, time: t0() };
    const up = {
      ...pt,
      ...Object.fromEntries(Object.entries(vForm).filter(([, v]) => v)),
      vitalsTime: t0(),
      vitalsHistory: [...(pt.vitalsHistory || []), entry],
    };
    setPatients((prev) => prev.map((p) => (p.id === sel ? up : p)));
    setVForm({});
    closeModal();
  };

  const saveLab = () => {
    const pt = patients.find((p) => p.id === sel);
    if (!pt || !lForm.label || !lForm.value) return;
    const entry = { ...lForm, time: t0() };
    const up = {
      ...pt,
      labs: [`${lForm.label} — ${lForm.value} [${t0()}]`, ...pt.labs],
      labHistory: [entry, ...(pt.labHistory || [])],
    };
    setPatients((prev) => prev.map((p) => (p.id === sel ? up : p)));
    setLForm({ label: '', value: '', flag: 'normal' });
    closeModal();
  };

  const assignMonitor = () => {
    if (!mForm.patientId || !mForm.protocols.length) return;
    const pt = patients.find((p) => p.id === mForm.patientId);
    if (!pt) return;
    const newProtos = [
      ...new Set([...(pt.protocols || []), ...mForm.protocols]),
    ];
    setPatients((prev) =>
      prev.map((p) =>
        p.id === mForm.patientId ? { ...p, protocols: newProtos } : p
      )
    );
    const newTasks = mForm.protocols.map((pid) => {
      const proto = MONITORING_PROTOCOLS.find((x) => x.id === pid);
      return {
        id: `t${Date.now()}_${pid}`,
        patientId: mForm.patientId,
        patientName: pt.name,
        bed: pt.bed,
        text: proto.label,
        assignedTo: mForm.assignTo,
        dueTime: t0(),
        status: 'pending',
        priority: 'high',
        isMonitoring: true,
        protocol: pid,
      };
    });
    setTasks((prev) => [...newTasks, ...prev]);
    setMForm({ patientId: '', protocols: [], assignTo: TEAM[1] });
    closeModal();
  };

  const addTask = () => {
    if (!tForm.text || !tForm.patientId) return;
    const pt = patients.find((p) => p.id === tForm.patientId);
    setTasks((prev) => [
      {
        id: `t${Date.now()}`,
        patientName: pt?.name || '—',
        bed: pt?.bed || '—',
        ...tForm,
        status: 'pending',
        isMonitoring: false,
      },
      ...prev,
    ]);
    setTForm({
      text: '',
      assignedTo: TEAM[1],
      dueTime: '',
      patientId: '',
      priority: 'high',
      notes: '',
    });
    closeModal();
  };

  const addPt = () => {
    if (!ptForm.name || !ptForm.bed) return;
    const pt = {
      id: `p${Date.now()}`,
      ...ptForm,
      drips: ptForm.drips ? ptForm.drips.split('\n').filter(Boolean) : [],
      admitDate: new Date().toISOString().slice(0, 10),
      bp: '—',
      spo2: '—',
      pulse: '—',
      temp: '—',
      rr: '—',
      gcs: '—',
      uop: '—',
      rbs: '—',
      vitalsTime: '—',
      notes: '',
      meds: [],
      labs: [],
      vitalsHistory: [],
      labHistory: [],
      protocols: [],
    };
    setPatients((prev) => [pt, ...prev]);
    setPtForm({
      name: '',
      age: '',
      bed: '',
      diagnosis: '',
      attending: 'Dr. Saili',
      status: 'stable',
      drips: '',
    });
    closeModal();
  };

  const updTaskStatus = (id, status) =>
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  const updStatus = (id, status) =>
    setPatients((prev) =>
      prev.map((p) => (p.id === id ? { ...p, status } : p))
    );

  const sendAi = async () => {
    if (!aiIn.trim() || aiLoad) return;
    const msg = aiIn;
    setAiIn('');
    setAiMsgs((m) => [...m, { role: 'user', text: msg }]);
    setAiLoad(true);
    try {
      const ctx = `Clinical ward AI for Unit 2, CSM Hospital Kalwa.
Critical patients: ${JSON.stringify(
        critical.map((p) => ({
          name: p.name,
          bed: p.bed,
          diagnosis: p.diagnosis,
          drips: p.drips,
          bp: p.bp,
          spo2: p.spo2,
          pulse: p.pulse,
          gcs: p.gcs,
          uop: p.uop,
          notes: p.notes,
          recent: p.vitalsHistory?.slice(-3),
        }))
      )}.
All patients: ${JSON.stringify(
        patients.map((p) => ({
          name: p.name,
          bed: p.bed,
          diag: p.diagnosis,
          status: p.status,
          bp: p.bp,
          spo2: p.spo2,
          pulse: p.pulse,
        }))
      )}.
Pending tasks: ${JSON.stringify(
        pending.map((t) => ({
          text: t.text,
          patient: t.patientName,
          assigned: t.assignedTo,
          due: t.dueTime,
          status: t.status,
        }))
      )}.
Be concise and clinically precise. Include MAP calculations, vasopressor endpoints, specific numbers.`;
      const txt = await callClaude(ctx, msg);
      setAiMsgs((m) => [
        ...m,
        { role: 'assistant', text: txt || 'Try again.' },
      ]);
    } catch {
      setAiMsgs((m) => [
        ...m,
        { role: 'assistant', text: 'Connection error.' },
      ]);
    }
    setAiLoad(false);
  };

  return (
    <div
      style={{
        fontFamily: "'DM Sans','Segoe UI',sans-serif",
        background: '#f0f4f8',
        minHeight: '100vh',
        maxWidth: 480,
        margin: '0 auto',
      }}
    >
      <link
        href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      {/* TOP BAR */}
      <div
        style={{
          background: '#0c1526',
          padding: '11px 15px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          position: 'sticky',
          top: 0,
          zIndex: 100,
        }}
      >
        <div>
          <div
            style={{
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: '-0.3px',
            }}
          >
            Unit <span style={{ color: '#3b82f6' }}>2</span>
          </div>
          <div
            style={{
              color: '#475569',
              fontSize: 10,
              fontFamily: "'DM Mono',monospace",
              marginTop: 1,
            }}
          >
            CSM Hospital · Kalwa · Unit 2 ·{' '}
            {new Date().toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
            })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
          {overdue.length > 0 && (
            <div
              style={{
                background: '#450a0a',
                color: '#ef4444',
                fontSize: 10,
                fontWeight: 700,
                padding: '3px 8px',
                borderRadius: 20,
              }}
            >
              ⚠ {overdue.length} overdue
            </div>
          )}
          <button
            onClick={() => setModal('setup')}
            style={{
              background: '#1e293b',
              border: '1px solid #334155',
              color: '#64748b',
              fontSize: 11,
              padding: '4px 8px',
              borderRadius: 7,
              cursor: 'pointer',
            }}
          >
            ⚙
          </button>
          <button
            onClick={() => setModal('ai')}
            style={{
              background: '#1d4ed8',
              border: 'none',
              color: '#fff',
              fontSize: 11,
              padding: '5px 11px',
              borderRadius: 8,
              cursor: 'pointer',
              fontWeight: 700,
            }}
          >
            AI ✦
          </button>
        </div>
      </div>

      {/* STATS */}
      <div
        style={{ background: '#0f172a', padding: '10px 16px', display: 'flex' }}
      >
        {[
          { l: 'Admitted', v: patients.length, c: '#60a5fa' },
          { l: 'Critical', v: critical.length, c: '#f87171' },
          {
            l: 'On drips',
            v: patients.filter((p) => p.drips?.length > 0).length,
            c: '#fb923c',
          },
          { l: 'Tasks', v: pending.length, c: '#fbbf24' },
        ].map((s, i) => (
          <div
            key={s.l}
            style={{
              flex: 1,
              textAlign: 'center',
              borderRight: i < 3 ? '1px solid #1e293b' : 'none',
            }}
          >
            <div
              style={{
                color: s.c,
                fontWeight: 700,
                fontSize: 20,
                fontFamily: "'DM Mono',monospace",
                lineHeight: 1,
              }}
            >
              {s.v}
            </div>
            <div style={{ color: '#475569', fontSize: 10, marginTop: 2 }}>
              {s.l}
            </div>
          </div>
        ))}
      </div>

      {/* CRITICAL STRIP */}
      {critical.length > 0 && !sel && (
        <div
          style={{
            background: '#1a0505',
            borderBottom: '1px solid #450a0a',
            padding: '8px 11px',
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: '#ef4444',
              fontWeight: 700,
              textTransform: 'uppercase',
              marginBottom: 5,
            }}
          >
            ⚠ Critical — immediate attention
          </div>
          {critical.map((pt) => (
            <div
              key={pt.id}
              onClick={() => {
                setSel(pt.id);
                setView('patients');
                setDtab('vitals');
              }}
              style={{
                background: '#2d0707',
                borderRadius: 8,
                padding: '8px 10px',
                marginBottom: 4,
                cursor: 'pointer',
                border: '1px solid #7f1d1d',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 3,
                }}
              >
                <span
                  style={{ color: '#fca5a5', fontWeight: 700, fontSize: 13 }}
                >
                  {pt.name}
                </span>
                <span style={{ color: '#64748b', fontSize: 11 }}>{pt.bed}</span>
              </div>
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  flexWrap: 'wrap',
                  alignItems: 'center',
                }}
              >
                {[
                  ['BP', pt.bp, parseInt(pt.bp) < 90],
                  ['SpO₂', `${pt.spo2}%`, parseInt(pt.spo2) < 93],
                  ['HR', pt.pulse, parseInt(pt.pulse) > 110],
                  ['UOP', `${pt.uop}ml/h`, parseInt(pt.uop) < 20 && pt.uop],
                ].map(
                  ([l, v, w]) =>
                    v && (
                      <span
                        key={l}
                        style={{
                          fontSize: 10,
                          color: w ? '#fca5a5' : '#94a3b8',
                          fontFamily: "'DM Mono',monospace",
                        }}
                      >
                        <span style={{ color: w ? '#ef4444' : '#475569' }}>
                          {v}
                        </span>{' '}
                        {l}
                      </span>
                    )
                )}
                {pt.drips?.slice(0, 2).map((d, i) => (
                  <span
                    key={i}
                    style={{
                      fontSize: 10,
                      color: '#fb923c',
                      background: '#431407',
                      padding: '2px 6px',
                      borderRadius: 4,
                    }}
                  >
                    💉 {d.split(' ').slice(0, 3).join(' ')}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TABS */}
      <div
        style={{
          display: 'flex',
          background: '#fff',
          borderBottom: '1px solid #e2e8f0',
          position: 'sticky',
          top: 60,
          zIndex: 90,
        }}
      >
        {[
          { k: 'ward', l: 'Ward' },
          { k: 'patients', l: 'Patients' },
          {
            k: 'tasks',
            l: `Tasks${pending.length > 0 ? ` (${pending.length})` : ''}`,
          },
          { k: 'labs', l: 'Labs' },
        ].map((tab) => (
          <button
            key={tab.k}
            onClick={() => {
              setView(tab.k);
              setSel(null);
            }}
            style={{
              flex: 1,
              padding: '10px 4px',
              background: 'none',
              border: 'none',
              borderBottom:
                view === tab.k && !sel
                  ? '2px solid #3b82f6'
                  : '2px solid transparent',
              color: view === tab.k && !sel ? '#1e40af' : '#64748b',
              fontSize: 13,
              fontWeight: view === tab.k && !sel ? 700 : 400,
              cursor: 'pointer',
            }}
          >
            {tab.l}
          </button>
        ))}
      </div>

      <div style={{ padding: '10px 10px 100px' }}>
        {/* WARD VIEW */}
        {view === 'ward' && !sel && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 12, color: '#64748b' }}>All beds</span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setModal('monitor')}
                  style={{
                    ...SMBTN,
                    background: '#fff7ed',
                    color: '#9a3412',
                    border: '1px solid #fed7aa',
                  }}
                >
                  + Protocol
                </button>
                <button
                  onClick={() => setModal('addpt')}
                  style={{
                    ...SMBTN,
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                  }}
                >
                  + Admit
                </button>
              </div>
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              {patients.map((pt) => {
                const sc = SC[pt.status] || SC.stable;
                const ptT = tasks.filter(
                  (t) =>
                    t.patientId === pt.id &&
                    (t.status === 'pending' || t.status === 'overdue')
                );
                const bpH =
                  pt.vitalsHistory
                    ?.map((v) => parseInt(v.bp))
                    .filter(Boolean) || [];
                return (
                  <div
                    key={pt.id}
                    onClick={() => {
                      setSel(pt.id);
                      setView('patients');
                      setDtab('vitals');
                    }}
                    style={{
                      background: '#fff',
                      borderRadius: 12,
                      padding: 11,
                      border: `1.5px solid ${
                        pt.status === 'critical' ? '#fca5a5' : '#e2e8f0'
                      }`,
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 5,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'DM Mono',monospace",
                          fontSize: 11,
                          fontWeight: 600,
                          color: '#475569',
                          background: '#f1f5f9',
                          padding: '2px 6px',
                          borderRadius: 4,
                        }}
                      >
                        {pt.bed}
                      </span>
                      <span
                        style={{
                          background: sc.bg,
                          color: sc.tx,
                          fontSize: 9,
                          padding: '2px 6px',
                          borderRadius: 20,
                          fontWeight: 700,
                          textTransform: 'uppercase',
                        }}
                      >
                        {pt.status}
                      </span>
                    </div>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 13,
                        color: '#0f172a',
                        lineHeight: 1.2,
                      }}
                    >
                      {pt.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#64748b',
                        margin: '2px 0 4px',
                      }}
                    >
                      {pt.diagnosis}
                    </div>
                    {pt.drips?.length > 0 && (
                      <div
                        style={{
                          fontSize: 10,
                          color: '#ea580c',
                          marginBottom: 4,
                        }}
                      >
                        💉 {pt.drips.length} drip
                        {pt.drips.length > 1 ? 's' : ''}
                      </div>
                    )}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 10,
                          color: '#475569',
                          fontFamily: "'DM Mono',monospace",
                        }}
                      >
                        SpO₂ {pt.spo2}% · HR {pt.pulse}
                      </span>
                      {bpH.length > 1 && (
                        <Sparkline
                          data={bpH}
                          color={
                            pt.status === 'critical' ? '#ef4444' : '#3b82f6'
                          }
                          h={20}
                          w={44}
                        />
                      )}
                    </div>
                    {ptT.length > 0 && (
                      <div
                        style={{
                          marginTop: 5,
                          background: '#fef9c3',
                          borderRadius: 5,
                          padding: '2px 6px',
                          fontSize: 10,
                          color: '#854d0e',
                        }}
                      >
                        {ptT.filter((t) => t.status === 'overdue').length > 0
                          ? '⚠'
                          : '•'}{' '}
                        {ptT.length} task{ptT.length > 1 ? 's' : ''} pending
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* PATIENT LIST */}
        {view === 'patients' && !sel && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 12, color: '#64748b' }}>
                {patients.length} patients
              </span>
              <button
                onClick={() => setModal('addpt')}
                style={{
                  ...SMBTN,
                  background: '#3b82f6',
                  color: '#fff',
                  border: 'none',
                }}
              >
                + Admit
              </button>
            </div>
            {patients.map((pt) => {
              const sc = SC[pt.status] || SC.stable;
              return (
                <div
                  key={pt.id}
                  onClick={() => {
                    setSel(pt.id);
                    setDtab('vitals');
                  }}
                  style={{
                    background: '#fff',
                    borderRadius: 11,
                    padding: '11px 13px',
                    marginBottom: 7,
                    border: '1px solid #e2e8f0',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 11,
                  }}
                >
                  <div
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: sc.dot,
                      flexShrink: 0,
                    }}
                  />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: '#0f172a',
                      }}
                    >
                      {pt.name}{' '}
                      <span
                        style={{
                          fontWeight: 400,
                          color: '#94a3b8',
                          fontSize: 12,
                        }}
                      >
                        {pt.age}y
                      </span>
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: '#64748b',
                        display: 'flex',
                        gap: 6,
                        marginTop: 1,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'DM Mono',monospace",
                          fontWeight: 500,
                          color: '#475569',
                        }}
                      >
                        {pt.bed}
                      </span>
                      <span>·</span>
                      <span>{pt.diagnosis}</span>
                    </div>
                    {pt.drips?.length > 0 && (
                      <div
                        style={{ fontSize: 10, color: '#ea580c', marginTop: 2 }}
                      >
                        💉 {pt.drips.join(' · ')}
                      </div>
                    )}
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div
                      style={{
                        background: sc.bg,
                        color: sc.tx,
                        fontSize: 9,
                        padding: '2px 7px',
                        borderRadius: 20,
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      {pt.status}
                    </div>
                    <div
                      style={{ fontSize: 10, color: '#94a3b8', marginTop: 3 }}
                    >
                      {pt.attending}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PATIENT DETAIL */}
        {sel && selPt && (
          <div>
            <button
              onClick={() => setSel(null)}
              style={{
                background: 'none',
                border: 'none',
                color: '#3b82f6',
                fontSize: 13,
                cursor: 'pointer',
                padding: '0 0 8px',
                fontWeight: 500,
              }}
            >
              ← Back
            </button>
            {/* Header */}
            <div
              style={{
                background: '#0c1526',
                borderRadius: 14,
                padding: '13px 15px',
                marginBottom: 8,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <div
                    style={{
                      color: '#fff',
                      fontWeight: 700,
                      fontSize: 17,
                      letterSpacing: '-0.3px',
                    }}
                  >
                    {selPt.name}
                  </div>
                  <div style={{ color: '#94a3b8', fontSize: 12, marginTop: 2 }}>
                    {selPt.age}y · {selPt.diagnosis}
                  </div>
                  {selPt.drips?.length > 0 && (
                    <div
                      style={{
                        marginTop: 6,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 3,
                      }}
                    >
                      {selPt.drips.map((d, i) => (
                        <span
                          key={i}
                          style={{
                            fontSize: 10,
                            color: '#fb923c',
                            background: '#431407',
                            padding: '2px 8px',
                            borderRadius: 5,
                            width: 'fit-content',
                          }}
                        >
                          💉 {d}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div
                    style={{
                      fontFamily: "'DM Mono',monospace",
                      fontWeight: 700,
                      fontSize: 15,
                      color: '#60a5fa',
                    }}
                  >
                    {selPt.bed}
                  </div>
                  <div style={{ color: '#475569', fontSize: 10, marginTop: 2 }}>
                    {selPt.admitDate}
                  </div>
                  <div style={{ color: '#475569', fontSize: 10 }}>
                    {selPt.attending}
                  </div>
                </div>
              </div>
              <div
                style={{
                  marginTop: 9,
                  display: 'flex',
                  gap: 5,
                  flexWrap: 'wrap',
                }}
              >
                {['stable', 'review', 'critical', 'discharged'].map((s) => {
                  const sc = SC[s];
                  return (
                    <button
                      key={s}
                      onClick={() => updStatus(selPt.id, s)}
                      style={{
                        background: selPt.status === s ? sc.bg : '#1e293b',
                        color: selPt.status === s ? sc.tx : '#475569',
                        border:
                          selPt.status === s
                            ? `1.5px solid ${sc.dot}`
                            : '1px solid #334155',
                        fontSize: 10,
                        padding: '3px 9px',
                        borderRadius: 20,
                        cursor: 'pointer',
                        fontWeight: 700,
                        textTransform: 'uppercase',
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Quick actions */}
            <div style={{ display: 'flex', gap: 6, marginBottom: 8 }}>
              {[
                [
                  '+ Vitals',
                  '#eff6ff',
                  '#1d4ed8',
                  '#bfdbfe',
                  () => setModal('vitals'),
                ],
                [
                  '+ Lab',
                  '#f0fdf4',
                  '#166534',
                  '#bbf7d0',
                  () => setModal('lab'),
                ],
                [
                  '+ Task',
                  '#fefce8',
                  '#854d0e',
                  '#fef08a',
                  () => {
                    setTForm((f) => ({ ...f, patientId: sel }));
                    setModal('task');
                  },
                ],
                [
                  'Monitor',
                  '#fff7ed',
                  '#9a3412',
                  '#fed7aa',
                  () => {
                    setMForm((f) => ({ ...f, patientId: sel }));
                    setModal('monitor');
                  },
                ],
              ].map(([l, bg, col, bd, fn]) => (
                <button
                  key={l}
                  onClick={fn}
                  style={{
                    flex: 1,
                    padding: '8px 0',
                    background: bg,
                    color: col,
                    border: `1px solid ${bd}`,
                    borderRadius: 9,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  {l}
                </button>
              ))}
            </div>

            {/* Detail tabs */}
            <div
              style={{
                display: 'flex',
                background: '#fff',
                borderRadius: 10,
                border: '1px solid #e2e8f0',
                marginBottom: 8,
                overflow: 'hidden',
              }}
            >
              {['vitals', 'labs', 'notes', 'tasks'].map((t) => (
                <button
                  key={t}
                  onClick={() => setDtab(t)}
                  style={{
                    flex: 1,
                    padding: '9px 4px',
                    background: dtab === t ? '#0f172a' : 'transparent',
                    border: 'none',
                    color: dtab === t ? '#fff' : '#64748b',
                    fontSize: 12,
                    fontWeight: dtab === t ? 700 : 400,
                    cursor: 'pointer',
                    textTransform: 'capitalize',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            {/* VITALS TAB */}
            {dtab === 'vitals' && (
              <div>
                {selPt.protocols?.length > 0 && (
                  <div
                    style={{
                      background: '#fff7ed',
                      borderRadius: 10,
                      padding: '9px 12px',
                      marginBottom: 8,
                      border: '1px solid #fed7aa',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: '#9a3412',
                        textTransform: 'uppercase',
                        marginBottom: 5,
                      }}
                    >
                      Active Monitoring Protocols
                    </div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
                      {selPt.protocols.map((pid) => {
                        const proto = MONITORING_PROTOCOLS.find(
                          (p) => p.id === pid
                        );
                        if (!proto) return null;
                        return (
                          <span
                            key={pid}
                            style={{
                              fontSize: 11,
                              color: proto.color,
                              background: '#fff',
                              border: `1px solid ${proto.color}22`,
                              padding: '2px 8px',
                              borderRadius: 12,
                            }}
                          >
                            {proto.icon} {proto.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
                <Sec title="Latest Vitals" time={selPt.vitalsTime}>
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 1fr 1fr',
                      gap: 7,
                    }}
                  >
                    {[
                      {
                        l: 'BP',
                        v: selPt.bp,
                        u: 'mmHg',
                        w: parseInt(selPt.bp) < 90,
                        h: selPt.vitalsHistory
                          ?.map((x) => parseInt(x.bp))
                          .filter(Boolean),
                      },
                      {
                        l: 'SpO₂',
                        v: `${selPt.spo2}%`,
                        u: '',
                        w: parseInt(selPt.spo2) < 93,
                        h: selPt.vitalsHistory
                          ?.map((x) => parseInt(x.spo2))
                          .filter(Boolean),
                      },
                      {
                        l: 'Pulse',
                        v: selPt.pulse,
                        u: 'bpm',
                        w: parseInt(selPt.pulse) > 110,
                        h: selPt.vitalsHistory
                          ?.map((x) => parseInt(x.pulse))
                          .filter(Boolean),
                      },
                      {
                        l: 'Temp',
                        v: selPt.temp,
                        u: '°C',
                        w: parseFloat(selPt.temp) > 38.5,
                        h: selPt.vitalsHistory
                          ?.map((x) => parseFloat(x.temp))
                          .filter(Boolean),
                      },
                      {
                        l: 'RR',
                        v: selPt.rr,
                        u: '/min',
                        w: parseInt(selPt.rr) > 25,
                        h: selPt.vitalsHistory
                          ?.map((x) => parseInt(x.rr))
                          .filter(Boolean),
                      },
                      {
                        l: 'GCS',
                        v: selPt.gcs,
                        u: '/15',
                        w: parseInt(selPt.gcs) < 13,
                        h: selPt.vitalsHistory
                          ?.map((x) => parseInt(x.gcs))
                          .filter(Boolean),
                      },
                      {
                        l: 'UOP',
                        v: selPt.uop || '—',
                        u: 'ml/hr',
                        w: parseInt(selPt.uop) < 20 && selPt.uop,
                        h: selPt.vitalsHistory
                          ?.map((x) => parseInt(x.uop))
                          .filter(Boolean),
                      },
                      {
                        l: 'RBS',
                        v: selPt.rbs || '—',
                        u: 'mg/dL',
                        w:
                          parseInt(selPt.rbs) > 250 || parseInt(selPt.rbs) < 70,
                        h: selPt.vitalsHistory
                          ?.map((x) => parseInt(x.rbs))
                          .filter(Boolean),
                      },
                    ].map(({ l, v, u, w, h }) => (
                      <div
                        key={l}
                        style={{
                          background: w && v !== '—' ? '#fff1f2' : '#f8fafc',
                          borderRadius: 8,
                          padding: '8px 9px',
                          border: `1px solid ${
                            w && v !== '—' ? '#fecdd3' : '#e2e8f0'
                          }`,
                        }}
                      >
                        <div
                          style={{
                            fontSize: 9,
                            color: w && v !== '—' ? '#9f1239' : '#94a3b8',
                            marginBottom: 1,
                          }}
                        >
                          {l}
                        </div>
                        <div
                          style={{
                            fontFamily: "'DM Mono',monospace",
                            fontWeight: 700,
                            fontSize: 15,
                            color: w && v !== '—' ? '#be123c' : '#0f172a',
                            lineHeight: 1,
                          }}
                        >
                          {v}
                        </div>
                        {u && (
                          <div
                            style={{
                              fontSize: 9,
                              color: '#cbd5e1',
                              marginTop: 1,
                            }}
                          >
                            {u}
                          </div>
                        )}
                        {h && h.length > 1 && (
                          <div style={{ marginTop: 3 }}>
                            <Sparkline
                              data={h}
                              color={w ? '#ef4444' : '#3b82f6'}
                              h={18}
                              w={50}
                            />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Sec>
                {selPt.vitalsHistory?.length > 1 && (
                  <Sec title="Vitals Trend">
                    <div style={{ overflowX: 'auto' }}>
                      <table
                        style={{
                          width: '100%',
                          fontSize: 11,
                          borderCollapse: 'collapse',
                          fontFamily: "'DM Mono',monospace",
                        }}
                      >
                        <thead>
                          <tr style={{ background: '#f8fafc' }}>
                            {[
                              'Time',
                              'BP',
                              'SpO₂',
                              'HR',
                              'Temp',
                              'RR',
                              'UOP',
                              'RBS',
                              'GCS',
                            ].map((h) => (
                              <th
                                key={h}
                                style={{
                                  padding: '4px 5px',
                                  textAlign: 'left',
                                  color: '#64748b',
                                  fontWeight: 600,
                                  fontSize: 10,
                                  borderBottom: '1px solid #e2e8f0',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {h}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {[...selPt.vitalsHistory].reverse().map((v, i) => (
                            <tr
                              key={i}
                              style={{ borderBottom: '1px solid #f1f5f9' }}
                            >
                              {[
                                v.time,
                                v.bp,
                                v.spo2 ? `${v.spo2}%` : '—',
                                v.pulse,
                                v.temp,
                                v.rr,
                                v.uop || '—',
                                v.rbs || '—',
                                v.gcs || '—',
                              ].map((c, j) => (
                                <td
                                  key={j}
                                  style={{
                                    padding: '4px 5px',
                                    color: j === 0 ? '#64748b' : '#0f172a',
                                    whiteSpace: 'nowrap',
                                  }}
                                >
                                  {c}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </Sec>
                )}
                <Sec title="Medications">
                  {selPt.meds.length === 0 ? (
                    <div style={{ color: '#cbd5e1', fontSize: 13 }}>None.</div>
                  ) : (
                    selPt.meds.map((m, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: 12,
                          color: '#1e293b',
                          padding: '5px 0',
                          borderBottom:
                            i < selPt.meds.length - 1
                              ? '1px solid #f1f5f9'
                              : 'none',
                          lineHeight: 1.5,
                        }}
                      >
                        <span
                          style={{
                            color: '#94a3b8',
                            fontFamily: "'DM Mono',monospace",
                            marginRight: 5,
                            fontSize: 10,
                          }}
                        >
                          Rx
                        </span>
                        {m}
                      </div>
                    ))
                  )}
                </Sec>
              </div>
            )}

            {/* LABS TAB */}
            {dtab === 'labs' && (
              <div>
                {selPt.labHistory?.length > 0 && (
                  <Sec title="Lab Timeline">
                    {selPt.labHistory.map((l, i) => {
                      const fc =
                        l.flag === 'critical'
                          ? { bg: '#450a0a', tx: '#f87171', bd: '#7f1d1d' }
                          : l.flag === 'high'
                          ? { bg: '#451a03', tx: '#fb923c', bd: '#92400e' }
                          : { bg: '#f0fdf4', tx: '#166534', bd: '#bbf7d0' };
                      return (
                        <div
                          key={i}
                          style={{
                            display: 'flex',
                            gap: 10,
                            marginBottom: 9,
                            alignItems: 'flex-start',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              alignItems: 'center',
                              paddingTop: 4,
                            }}
                          >
                            <div
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background:
                                  l.flag === 'critical'
                                    ? '#ef4444'
                                    : l.flag === 'high'
                                    ? '#f97316'
                                    : '#10b981',
                              }}
                            />
                            {i < selPt.labHistory.length - 1 && (
                              <div
                                style={{
                                  width: 1,
                                  flex: 1,
                                  background: '#e2e8f0',
                                  marginTop: 2,
                                }}
                              />
                            )}
                          </div>
                          <div
                            style={{
                              flex: 1,
                              paddingBottom:
                                i < selPt.labHistory.length - 1 ? 6 : 0,
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                alignItems: 'center',
                                marginBottom: 2,
                              }}
                            >
                              <span
                                style={{
                                  fontFamily: "'DM Mono',monospace",
                                  fontSize: 10,
                                  color: '#64748b',
                                }}
                              >
                                {l.time}
                              </span>
                              <span
                                style={{
                                  background: fc.bg,
                                  color: fc.tx,
                                  fontSize: 9,
                                  padding: '1px 7px',
                                  borderRadius: 10,
                                  fontWeight: 700,
                                  border: `1px solid ${fc.bd}`,
                                }}
                              >
                                {(l.flag || '').toUpperCase()}
                              </span>
                            </div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 600,
                                color: '#0f172a',
                              }}
                            >
                              {l.label}
                            </div>
                            <div
                              style={{
                                fontSize: 12,
                                color: '#475569',
                                fontFamily: "'DM Mono',monospace",
                              }}
                            >
                              {l.value}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </Sec>
                )}
                <Sec title="All Investigations">
                  {selPt.labs.length === 0 ? (
                    <div style={{ color: '#cbd5e1', fontSize: 13 }}>None.</div>
                  ) : (
                    selPt.labs.map((l, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: 12,
                          color: '#334155',
                          padding: '5px 0',
                          borderBottom:
                            i < selPt.labs.length - 1
                              ? '1px solid #f8fafc'
                              : 'none',
                          lineHeight: 1.5,
                        }}
                      >
                        <span style={{ color: '#94a3b8', marginRight: 6 }}>
                          ◦
                        </span>
                        {l}
                      </div>
                    ))
                  )}
                </Sec>
              </div>
            )}

            {/* NOTES TAB */}
            {dtab === 'notes' && (
              <NotesTab
                pt={selPt}
                onSave={(notes) =>
                  setPatients((prev) =>
                    prev.map((p) => (p.id === sel ? { ...p, notes } : p))
                  )
                }
              />
            )}

            {/* TASKS TAB */}
            {dtab === 'tasks' && (
              <div>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 12, color: '#64748b' }}>
                    {ptTasks.length} tasks
                  </span>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <button
                      onClick={() => {
                        setMForm((f) => ({ ...f, patientId: sel }));
                        setModal('monitor');
                      }}
                      style={{
                        ...SMBTN,
                        background: '#fff7ed',
                        color: '#9a3412',
                        border: '1px solid #fed7aa',
                      }}
                    >
                      + Protocol
                    </button>
                    <button
                      onClick={() => {
                        setTForm((f) => ({ ...f, patientId: sel }));
                        setModal('task');
                      }}
                      style={{
                        ...SMBTN,
                        background: '#3b82f6',
                        color: '#fff',
                        border: 'none',
                      }}
                    >
                      + Task
                    </button>
                  </div>
                </div>
                {ptTasks.length === 0 ? (
                  <div
                    style={{
                      color: '#cbd5e1',
                      fontSize: 13,
                      textAlign: 'center',
                      marginTop: 20,
                    }}
                  >
                    No tasks.
                  </div>
                ) : (
                  ptTasks.map((t) => (
                    <TaskCard key={t.id} task={t} onChange={updTaskStatus} />
                  ))
                )}
              </div>
            )}
          </div>
        )}

        {/* TASKS VIEW */}
        {view === 'tasks' && (
          <div>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 8,
              }}
            >
              <span style={{ fontSize: 12, color: '#64748b' }}>
                {pending.length} active tasks
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <button
                  onClick={() => setModal('monitor')}
                  style={{
                    ...SMBTN,
                    background: '#fff7ed',
                    color: '#9a3412',
                    border: '1px solid #fed7aa',
                  }}
                >
                  + Protocol
                </button>
                <button
                  onClick={() => setModal('task')}
                  style={{
                    ...SMBTN,
                    background: '#3b82f6',
                    color: '#fff',
                    border: 'none',
                  }}
                >
                  + Task
                </button>
              </div>
            </div>
            {TEAM.map((member) => {
              const mt = tasks.filter(
                (t) => t.assignedTo === member && t.status !== 'done'
              );
              if (!mt.length) return null;
              const hasOverdue = mt.some((t) => t.status === 'overdue');
              return (
                <div key={member} style={{ marginBottom: 14 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      background: hasOverdue ? '#450a0a' : '#eff6ff',
                      color: hasOverdue ? '#fca5a5' : '#1e40af',
                      border: `1px solid ${hasOverdue ? '#7f1d1d' : '#bfdbfe'}`,
                      borderRadius: 7,
                      padding: '4px 10px',
                      marginBottom: 6,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    {hasOverdue && <span>⚠</span>}
                    {member} <span style={{ opacity: 0.6 }}>({mt.length})</span>
                  </div>
                  {mt.map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onChange={updTaskStatus}
                      showPt
                    />
                  ))}
                </div>
              );
            })}
            {tasks.filter((t) => t.status === 'done').length > 0 && (
              <div style={{ marginTop: 8 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: '#065f46',
                    background: '#d1fae5',
                    border: '1px solid #6ee7b7',
                    borderRadius: 7,
                    padding: '4px 10px',
                    marginBottom: 6,
                    display: 'inline-block',
                  }}
                >
                  Completed ✓
                </div>
                {tasks
                  .filter((t) => t.status === 'done')
                  .map((t) => (
                    <TaskCard
                      key={t.id}
                      task={t}
                      onChange={updTaskStatus}
                      showPt
                    />
                  ))}
              </div>
            )}
          </div>
        )}

        {/* LABS VIEW */}
        {view === 'labs' && (
          <div>
            <div style={{ fontSize: 12, color: '#64748b', marginBottom: 10 }}>
              All investigations · all patients
            </div>
            {critical
              .filter((p) => p.labHistory?.some((l) => l.flag === 'critical'))
              .map((pt) => (
                <div
                  key={pt.id}
                  style={{
                    background: '#1a0505',
                    borderRadius: 10,
                    padding: '10px 12px',
                    marginBottom: 8,
                    border: '1px solid #450a0a',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      marginBottom: 6,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 700,
                        fontSize: 13,
                        color: '#fca5a5',
                      }}
                    >
                      {pt.name}
                    </span>
                    <span
                      style={{
                        fontFamily: "'DM Mono',monospace",
                        fontSize: 11,
                        color: '#64748b',
                      }}
                    >
                      {pt.bed}
                    </span>
                  </div>
                  {pt.labHistory
                    ?.filter((l) => l.flag === 'critical')
                    .map((l, i) => (
                      <div
                        key={i}
                        style={{
                          fontSize: 12,
                          color: '#f87171',
                          marginBottom: 2,
                        }}
                      >
                        ⚠ [{l.time}] {l.label}: {l.value}
                      </div>
                    ))}
                  <button
                    onClick={() => {
                      setSel(pt.id);
                      setModal('lab');
                    }}
                    style={{
                      marginTop: 6,
                      fontSize: 11,
                      background: '#450a0a',
                      color: '#fca5a5',
                      border: '1px solid #7f1d1d',
                      padding: '3px 10px',
                      borderRadius: 6,
                      cursor: 'pointer',
                    }}
                  >
                    + Add result
                  </button>
                </div>
              ))}
            {patients.map((pt) => (
              <div
                key={pt.id}
                style={{
                  background: '#fff',
                  borderRadius: 10,
                  padding: '11px 13px',
                  marginBottom: 8,
                  border: '1px solid #e2e8f0',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 7,
                  }}
                >
                  <div>
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: 14,
                        color: '#0f172a',
                      }}
                    >
                      {pt.name}
                    </span>
                    <span
                      style={{
                        fontSize: 12,
                        color: '#94a3b8',
                        marginLeft: 8,
                        fontFamily: "'DM Mono',monospace",
                      }}
                    >
                      {pt.bed}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSel(pt.id);
                      setModal('lab');
                    }}
                    style={{
                      fontSize: 11,
                      color: '#3b82f6',
                      background: '#eff6ff',
                      border: '1px solid #bfdbfe',
                      padding: '3px 8px',
                      borderRadius: 6,
                      cursor: 'pointer',
                      fontWeight: 600,
                    }}
                  >
                    + Add
                  </button>
                </div>
                {pt.labs.slice(0, 4).map((l, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 12,
                      color: '#334155',
                      padding: '3px 0',
                      borderBottom:
                        i < Math.min(pt.labs.length, 4) - 1
                          ? '1px solid #f8fafc'
                          : 'none',
                    }}
                  >
                    <span style={{ color: '#94a3b8', marginRight: 5 }}>◦</span>
                    {l}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══ VITALS ENTRY MODAL ══ */}
      {modal === 'vitals' && (
        <Mdl title={`Record Vitals — ${selPt?.name}`} onClose={closeModal}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              marginBottom: 12,
            }}
          >
            {[
              ['bp', 'BP (e.g. 120/80)'],
              ['spo2', 'SpO₂ (%)'],
              ['pulse', 'Pulse (bpm)'],
              ['temp', 'Temp (°C)'],
              ['rr', 'RR (/min)'],
              ['gcs', 'GCS (/15)'],
              ['uop', 'UOP (ml/hr)'],
              ['rbs', 'RBS (mg/dL)'],
            ].map(([k, l]) => (
              <div key={k}>
                <Lbl c={l} />
                <input
                  value={vForm[k] || ''}
                  onChange={(e) =>
                    setVForm((f) => ({ ...f, [k]: e.target.value }))
                  }
                  style={INP}
                  placeholder="—"
                />
              </div>
            ))}
          </div>
          {selPt?.drips?.length > 0 && (
            <div
              style={{
                background: '#fff7ed',
                borderRadius: 8,
                padding: '8px 10px',
                marginBottom: 12,
                fontSize: 12,
                color: '#9a3412',
              }}
            >
              <strong>On drips:</strong> {selPt.drips.join(' · ')}
            </div>
          )}
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveVitals} style={{ ...SBTN, flex: 2 }}>
              Save Vitals
            </button>
            <button onClick={closeModal} style={{ ...CBTN, flex: 1 }}>
              Cancel
            </button>
          </div>
        </Mdl>
      )}

      {/* ══ LAB ENTRY MODAL ══ */}
      {modal === 'lab' && (
        <Mdl
          title={`Add Lab Result — ${
            selPt?.name || patients.find((p) => p.id === sel)?.name
          }`}
          onClose={closeModal}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              marginBottom: 12,
            }}
          >
            <div>
              <Lbl c="Test name" />
              <input
                value={lForm.label}
                onChange={(e) =>
                  setLForm((f) => ({ ...f, label: e.target.value }))
                }
                style={INP}
                placeholder="e.g. Lactate, ABG, CBC, Creatinine"
              />
            </div>
            <div>
              <Lbl c="Result / value" />
              <input
                value={lForm.value}
                onChange={(e) =>
                  setLForm((f) => ({ ...f, value: e.target.value }))
                }
                style={INP}
                placeholder="e.g. 4.2 mmol/L, pH 7.29 PaO₂ 58"
              />
            </div>
            <div>
              <Lbl c="Flag" />
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  ['normal', '#f0fdf4', '#166534', '#bbf7d0'],
                  ['high', '#fff7ed', '#9a3412', '#fed7aa'],
                  ['critical', '#fff1f2', '#9f1239', '#fecdd3'],
                ].map(([f, bg, col, bd]) => (
                  <button
                    key={f}
                    onClick={() => setLForm((x) => ({ ...x, flag: f }))}
                    style={{
                      flex: 1,
                      padding: '7px 0',
                      background: lForm.flag === f ? bg : '#fff',
                      color: lForm.flag === f ? col : '#64748b',
                      border: `1.5px solid ${
                        lForm.flag === f ? bd : '#e2e8f0'
                      }`,
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {f}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={saveLab} style={{ ...SBTN, flex: 2 }}>
              Save Result
            </button>
            <button onClick={closeModal} style={{ ...CBTN, flex: 1 }}>
              Cancel
            </button>
          </div>
        </Mdl>
      )}

      {/* ══ MONITORING PROTOCOL MODAL ══ */}
      {modal === 'monitor' && (
        <Mdl
          title="Assign Monitoring Protocol"
          onClose={() => {
            setMForm({ patientId: '', protocols: [], assignTo: TEAM[1] });
            closeModal();
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
              marginBottom: 14,
            }}
          >
            <div>
              <Lbl c="Patient" />
              <select
                value={mForm.patientId}
                onChange={(e) =>
                  setMForm((f) => ({ ...f, patientId: e.target.value }))
                }
                style={INP}
              >
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.bed}) — {p.status}
                    {p.drips?.length > 0 ? ` · ${p.drips.length} drip(s)` : ''}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Lbl c="Select monitoring protocols" />
              {MONITORING_PROTOCOLS.map((proto) => {
                const on = mForm.protocols.includes(proto.id);
                return (
                  <div
                    key={proto.id}
                    onClick={() =>
                      setMForm((f) => ({
                        ...f,
                        protocols: on
                          ? f.protocols.filter((x) => x !== proto.id)
                          : [...f.protocols, proto.id],
                      }))
                    }
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '9px 12px',
                      background: on ? '#f8fafc' : '#fff',
                      border: `1.5px solid ${on ? proto.color : '#e2e8f0'}`,
                      borderRadius: 9,
                      marginBottom: 5,
                      cursor: 'pointer',
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: 5,
                        background: on ? proto.color : '#fff',
                        border: `2px solid ${on ? proto.color : '#cbd5e1'}`,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {on && (
                        <span
                          style={{ color: '#fff', fontSize: 11, lineHeight: 1 }}
                        >
                          ✓
                        </span>
                      )}
                    </div>
                    <div>
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: on ? 700 : 400,
                          color: on ? proto.color : '#0f172a',
                        }}
                      >
                        {proto.icon} {proto.label}
                      </div>
                      <div style={{ fontSize: 10, color: '#94a3b8' }}>
                        Every {proto.interval} min · {proto.vitals.join(', ')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div>
              <Lbl c="Assign to" />
              <select
                value={mForm.assignTo}
                onChange={(e) =>
                  setMForm((f) => ({ ...f, assignTo: e.target.value }))
                }
                style={INP}
              >
                {TEAM.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
            {mForm.protocols.length > 0 && mForm.patientId && (
              <div
                style={{
                  background: '#f0fdf4',
                  border: '1px solid #bbf7d0',
                  borderRadius: 8,
                  padding: '8px 10px',
                }}
              >
                <div
                  style={{ fontSize: 12, color: '#166534', fontWeight: 600 }}
                >
                  ✓ Will create {mForm.protocols.length} monitoring task
                  {mForm.protocols.length > 1 ? 's' : ''} for {mForm.assignTo}
                </div>
                <div style={{ fontSize: 11, color: '#4ade80', marginTop: 2 }}>
                  Protocols added to patient record
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={assignMonitor} style={{ ...SBTN, flex: 2 }}>
              Assign Monitoring
            </button>
            <button
              onClick={() => {
                setMForm({ patientId: '', protocols: [], assignTo: TEAM[1] });
                closeModal();
              }}
              style={{ ...CBTN, flex: 1 }}
            >
              Cancel
            </button>
          </div>
        </Mdl>
      )}

      {/* ══ TASK MODAL ══ */}
      {modal === 'task' && (
        <Mdl title="Assign Task to Resident" onClose={closeModal}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <div>
              <Lbl c="Patient" />
              <select
                value={tForm.patientId}
                onChange={(e) =>
                  setTForm((f) => ({ ...f, patientId: e.target.value }))
                }
                style={INP}
              >
                <option value="">Select patient</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} ({p.bed})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Lbl c="Task description" />
              <textarea
                value={tForm.text}
                onChange={(e) =>
                  setTForm((f) => ({ ...f, text: e.target.value }))
                }
                rows={3}
                style={{
                  ...INP,
                  resize: 'none',
                  fontFamily: "'DM Sans',sans-serif",
                  lineHeight: 1.5,
                }}
                placeholder="e.g. Check ABG and adjust NIV · Repeat ECG after dose"
              />
            </div>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 8,
              }}
            >
              <div>
                <Lbl c="Assign to" />
                <select
                  value={tForm.assignedTo}
                  onChange={(e) =>
                    setTForm((f) => ({ ...f, assignedTo: e.target.value }))
                  }
                  style={INP}
                >
                  {TEAM.map((m) => (
                    <option key={m}>{m}</option>
                  ))}
                </select>
              </div>
              <div>
                <Lbl c="Due time" />
                <input
                  type="time"
                  value={tForm.dueTime}
                  onChange={(e) =>
                    setTForm((f) => ({ ...f, dueTime: e.target.value }))
                  }
                  style={INP}
                />
              </div>
            </div>
            <div>
              <Lbl c="Priority" />
              <div style={{ display: 'flex', gap: 6 }}>
                {[
                  ['low', '#f0fdf4', '#166534', '#bbf7d0'],
                  ['medium', '#fefce8', '#854d0e', '#fef08a'],
                  ['high', '#fff1f2', '#9f1239', '#fecdd3'],
                ].map(([p, bg, col, bd]) => (
                  <button
                    key={p}
                    onClick={() => setTForm((f) => ({ ...f, priority: p }))}
                    style={{
                      flex: 1,
                      padding: '7px 0',
                      background: tForm.priority === p ? bg : '#fff',
                      color: tForm.priority === p ? col : '#64748b',
                      border: `1.5px solid ${
                        tForm.priority === p ? bd : '#e2e8f0'
                      }`,
                      borderRadius: 8,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                      textTransform: 'capitalize',
                    }}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <Lbl c="Target / Notes (optional)" />
              <input
                value={tForm.notes}
                onChange={(e) =>
                  setTForm((f) => ({ ...f, notes: e.target.value }))
                }
                style={INP}
                placeholder="e.g. Target MAP ≥65, adjust if SBP <90"
              />
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={addTask} style={{ ...SBTN, flex: 2 }}>
                Assign Task
              </button>
              <button onClick={closeModal} style={{ ...CBTN, flex: 1 }}>
                Cancel
              </button>
            </div>
          </div>
        </Mdl>
      )}

      {/* ══ ADD PATIENT ══ */}
      {modal === 'addpt' && (
        <Mdl title="Admit Patient" onClose={closeModal}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              ['name', 'Full Name', 'text', 'Ramesh Patil'],
              ['age', 'Age', 'number', '55'],
              ['bed', 'Bed / Location', 'text', 'ICU-4'],
              ['diagnosis', 'Primary Diagnosis', 'text', 'Septic shock'],
            ].map(([k, l, t, ph]) => (
              <div key={k}>
                <Lbl c={l} />
                <input
                  type={t}
                  value={ptForm[k]}
                  onChange={(e) =>
                    setPtForm((p) => ({ ...p, [k]: e.target.value }))
                  }
                  style={INP}
                  placeholder={ph}
                />
              </div>
            ))}
            <div>
              <Lbl c="Active Drips (one per line)" />
              <textarea
                value={ptForm.drips}
                onChange={(e) =>
                  setPtForm((p) => ({ ...p, drips: e.target.value }))
                }
                rows={3}
                style={{
                  ...INP,
                  resize: 'none',
                  fontFamily: "'DM Sans',sans-serif",
                }}
                placeholder={
                  'Noradrenaline 0.2 mcg/kg/min\nVasopressin 0.03 U/min'
                }
              />
            </div>
            <div>
              <Lbl c="Attending" />
              <select
                value={ptForm.attending}
                onChange={(e) =>
                  setPtForm((p) => ({ ...p, attending: e.target.value }))
                }
                style={INP}
              >
                {['Dr. Saili', 'Dr. Vishal', 'Dr. Deepa Banjan', 'Other'].map(
                  (d) => (
                    <option key={d}>{d}</option>
                  )
                )}
              </select>
            </div>
            <div>
              <Lbl c="Initial Status" />
              <div style={{ display: 'flex', gap: 6 }}>
                {['stable', 'review', 'critical'].map((s) => {
                  const sc = SC[s];
                  return (
                    <button
                      key={s}
                      onClick={() => setPtForm((p) => ({ ...p, status: s }))}
                      style={{
                        flex: 1,
                        padding: '7px 0',
                        background: ptForm.status === s ? sc.bg : '#fff',
                        color: ptForm.status === s ? sc.tx : '#64748b',
                        border: `1.5px solid ${
                          ptForm.status === s ? sc.dot : '#e2e8f0'
                        }`,
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: 'pointer',
                        textTransform: 'capitalize',
                      }}
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
              <button onClick={addPt} style={{ ...SBTN, flex: 2 }}>
                Admit & Save
              </button>
              <button onClick={closeModal} style={{ ...CBTN, flex: 1 }}>
                Cancel
              </button>
            </div>
          </div>
        </Mdl>
      )}

      {/* ══ SETUP ══ */}
      {modal === 'setup' && (
        <Mdl title="Notion Setup" onClose={closeModal}>
          <div
            style={{
              fontSize: 13,
              color: '#64748b',
              lineHeight: 1.7,
              marginBottom: 12,
            }}
          >
            1. Create a Notion database —{' '}
            <strong style={{ color: '#0f172a' }}>Ward Patients — Unit 2</strong>
            <br />
            2. Copy the database ID from the URL
            <br />
            3. Paste below — all data syncs automatically
          </div>
          <Lbl c="Notion Database ID" />
          <input
            value={notionDbId}
            onChange={(e) => setNotionDbId(e.target.value)}
            style={{
              ...INP,
              fontFamily: "'DM Mono',monospace",
              marginBottom: 12,
            }}
            placeholder="xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
          />
          <button onClick={closeModal} style={SBTN}>
            Save Configuration
          </button>
        </Mdl>
      )}

      {/* ══ AI CHAT ══ */}
      {modal === 'ai' && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: '#0c1526',
            zIndex: 200,
            maxWidth: 480,
            margin: '0 auto',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              padding: '13px 15px',
              borderBottom: '1px solid #1e293b',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div>
              <div style={{ color: '#fff', fontWeight: 700, fontSize: 15 }}>
                Ward AI <span style={{ color: '#3b82f6' }}>✦</span>
              </div>
              <div style={{ color: '#475569', fontSize: 11 }}>
                Knows all patients · vasopressor protocols · clinical context
              </div>
            </div>
            <button
              onClick={closeModal}
              style={{
                background: '#1e293b',
                border: 'none',
                color: '#94a3b8',
                fontSize: 14,
                width: 30,
                height: 30,
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              ✕
            </button>
          </div>
          <div
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '12px 13px',
              display: 'flex',
              flexDirection: 'column',
              gap: 9,
            }}
          >
            {aiMsgs.map((m, i) => (
              <div
                key={i}
                style={{
                  display: 'flex',
                  justifyContent: m.role === 'user' ? 'flex-end' : 'flex-start',
                }}
              >
                <div
                  style={{
                    background: m.role === 'user' ? '#1d4ed8' : '#1e293b',
                    color: '#e2e8f0',
                    borderRadius:
                      m.role === 'user'
                        ? '14px 14px 4px 14px'
                        : '14px 14px 14px 4px',
                    padding: '10px 13px',
                    maxWidth: '88%',
                    fontSize: 13,
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {aiLoad && (
              <div style={{ display: 'flex' }}>
                <div
                  style={{
                    background: '#1e293b',
                    color: '#475569',
                    borderRadius: '14px 14px 14px 4px',
                    padding: '10px 13px',
                    fontSize: 13,
                  }}
                >
                  Thinking…
                </div>
              </div>
            )}
          </div>
          <div
            style={{
              padding: '7px 12px 5px',
              display: 'flex',
              flexWrap: 'wrap',
              gap: 5,
            }}
          >
            {[
              'Summarise ICU patients',
              'Norad titration for MAP <65',
              'Night handover note',
              'Overdue tasks',
              'Vasopressin dose range',
            ].map((q) => (
              <button
                key={q}
                onClick={() => setAiIn(q)}
                style={{
                  fontSize: 11,
                  background: '#1e293b',
                  border: '1px solid #334155',
                  color: '#64748b',
                  borderRadius: 20,
                  padding: '4px 10px',
                  cursor: 'pointer',
                }}
              >
                {q}
              </button>
            ))}
          </div>
          <div style={{ padding: '5px 12px 24px', display: 'flex', gap: 8 }}>
            <input
              value={aiIn}
              onChange={(e) => setAiIn(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !aiLoad && sendAi()}
              placeholder="Ask anything clinical…"
              style={{
                flex: 1,
                background: '#1e293b',
                border: '1px solid #334155',
                color: '#e2e8f0',
                borderRadius: 10,
                padding: '11px 12px',
                fontSize: 13,
                outline: 'none',
                fontFamily: "'DM Sans',sans-serif",
              }}
            />
            <button
              onClick={sendAi}
              disabled={aiLoad}
              style={{
                background: '#1d4ed8',
                border: 'none',
                color: '#fff',
                borderRadius: 10,
                padding: '11px 15px',
                fontSize: 15,
                cursor: 'pointer',
                opacity: aiLoad ? 0.5 : 1,
              }}
            >
              ↑
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function NotesTab({ pt, onSave }) {
  const [ed, setEd] = useState(false);
  const [txt, setTxt] = useState(pt.notes);
  return (
    <Sec
      title="Doctor Notes"
      action={
        <button
          onClick={() => {
            setTxt(pt.notes);
            setEd(true);
          }}
          style={EBTN}
        >
          Edit
        </button>
      }
    >
      {ed ? (
        <div>
          <textarea
            value={txt}
            onChange={(e) => setTxt(e.target.value)}
            rows={7}
            style={{
              ...INP,
              resize: 'vertical',
              fontFamily: "'DM Sans',sans-serif",
              lineHeight: 1.7,
              marginBottom: 8,
            }}
            placeholder="SOAP note, clinical observations, plan…"
          />
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => {
                onSave(txt);
                setEd(false);
              }}
              style={{ ...SBTN, flex: 2 }}
            >
              Save
            </button>
            <button onClick={() => setEd(false)} style={{ ...CBTN, flex: 1 }}>
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div
          style={{
            fontSize: 13,
            color: '#334155',
            lineHeight: 1.8,
            whiteSpace: 'pre-wrap',
            minHeight: 50,
          }}
        >
          {pt.notes || <span style={{ color: '#cbd5e1' }}>No notes yet.</span>}
        </div>
      )}
    </Sec>
  );
}

function TaskCard({ task, onChange, showPt }) {
  const tc = TC[task.status] || TC.pending;
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 9,
        padding: '9px 11px',
        marginBottom: 6,
        border: `1px solid ${tc.bd}`,
        borderLeft: `3px solid ${tc.bd}`,
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          marginBottom: 3,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            style={{
              fontSize: 13,
              color: '#0f172a',
              fontWeight: 500,
              lineHeight: 1.4,
            }}
          >
            {task.isMonitoring && (
              <span
                style={{
                  fontSize: 9,
                  color: '#7c3aed',
                  background: '#ede9fe',
                  borderRadius: 4,
                  padding: '1px 5px',
                  marginRight: 5,
                  fontWeight: 700,
                }}
              >
                PROTO
              </span>
            )}
            {task.text}
          </div>
          {task.notes && (
            <div
              style={{
                fontSize: 11,
                color: '#64748b',
                marginTop: 2,
                fontStyle: 'italic',
              }}
            >
              → {task.notes}
            </div>
          )}
          {showPt && (
            <div style={{ fontSize: 11, color: '#64748b', marginTop: 2 }}>
              {task.bed} · {task.patientName}
            </div>
          )}
          <div style={{ fontSize: 11, color: '#94a3b8', marginTop: 2 }}>
            {task.assignedTo}
            {task.dueTime ? ` · ⏱ ${task.dueTime}` : ''}
          </div>
        </div>
        <select
          value={task.status}
          onChange={(e) => onChange(task.id, e.target.value)}
          style={{
            fontSize: 10,
            border: `1px solid ${tc.bd}`,
            background: tc.bg,
            color: tc.tx,
            fontWeight: 700,
            borderRadius: 6,
            padding: '3px 5px',
            cursor: 'pointer',
            marginLeft: 8,
            fontFamily: "'DM Sans',sans-serif",
          }}
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
