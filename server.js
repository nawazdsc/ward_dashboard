import 'dotenv/config'
import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

const NOTION_TOKEN = process.env.NOTION_TOKEN;
const NOTION_DB = process.env.NOTION_DB_ID;
const ANTHROPIC_KEY = process.env.ANTHROPIC_API_KEY;

const notionHeaders = {
  "Authorization": `Bearer ${NOTION_TOKEN}`,
  "Content-Type": "application/json",
  "Notion-Version": "2022-06-28",
};

// Helper: convert Notion page to patient object
function notionToPatient(page) {
  const p = page.properties;
  const getText = (field) => p[field]?.rich_text?.[0]?.plain_text || "";
  const getTitle = (field) => p[field]?.title?.[0]?.plain_text || "";
  const getNum = (field) => p[field]?.number?.toString() || "";
  const getSelect = (field) => p[field]?.select?.name?.toLowerCase() || "stable";
  const getDate = (field) => p[field]?.date?.start || "";
  const getMultiText = (field) => p[field]?.rich_text?.[0]?.plain_text || "";

  return {
    id: page.id,
    notionId: page.id,
    name: getTitle("Name"),
    bed: getText("Bed"),
    age: getNum("Age"),
    diagnosis: getText("Diagnosis"),
    status: getSelect("Status"),
    admitDate: getDate("Admit Date"),
    drips: getText("Drips") ? getText("Drips").split("\n").filter(Boolean) : [],
    bp: getText("BP"),
    spo2: getText("SpO2"),
    pulse: getText("Pulse"),
    temp: getText("Temp"),
    rr: getText("RR"),
    gcs: getText("GCS"),
    uop: getText("UOP"),
    rbs: getText("RBS"),
    vitalsTime: getText("Vitals Time"),
    notes: getMultiText("Notes"),
    meds: getText("Medications") ? getText("Medications").split("\n").filter(Boolean) : [],
    labs: getText("Labs") ? getText("Labs").split("\n").filter(Boolean) : [],
    attending: getText("Attending") || "—",
    vitalsHistory: [],
    labHistory: [],
    protocols: [],
  };
}

// Helper: convert patient object to Notion properties
function patientToNotion(pt) {
  return {
    "Name": { title: [{ text: { content: pt.name || "" } }] },
    "Bed": { rich_text: [{ text: { content: pt.bed || "" } }] },
    "Age": { number: parseInt(pt.age) || null },
    "Diagnosis": { rich_text: [{ text: { content: pt.diagnosis || "" } }] },
    "Status": { select: { name: capitalize(pt.status || "stable") } },
    "Admit Date": { date: { start: pt.admitDate || new Date().toISOString().slice(0, 10) } },
    "Drips": { rich_text: [{ text: { content: Array.isArray(pt.drips) ? pt.drips.join("\n") : (pt.drips || "") } }] },
    "BP": { rich_text: [{ text: { content: pt.bp || "" } }] },
    "SpO2": { rich_text: [{ text: { content: pt.spo2?.toString() || "" } }] },
    "Pulse": { rich_text: [{ text: { content: pt.pulse?.toString() || "" } }] },
    "Temp": { rich_text: [{ text: { content: pt.temp?.toString() || "" } }] },
    "RR": { rich_text: [{ text: { content: pt.rr?.toString() || "" } }] },
    "GCS": { rich_text: [{ text: { content: pt.gcs?.toString() || "" } }] },
    "UOP": { rich_text: [{ text: { content: pt.uop?.toString() || "" } }] },
    "RBS": { rich_text: [{ text: { content: pt.rbs?.toString() || "" } }] },
    "Vitals Time": { rich_text: [{ text: { content: pt.vitalsTime || "" } }] },
    "Notes": { rich_text: [{ text: { content: pt.notes || "" } }] },
    "Medications": { rich_text: [{ text: { content: Array.isArray(pt.meds) ? pt.meds.join("\n") : (pt.meds || "") } }] },
    "Labs": { rich_text: [{ text: { content: Array.isArray(pt.labs) ? pt.labs.join("\n") : (pt.labs || "") } }] },
    "Attending": { rich_text: [{ text: { content: pt.attending || "" } }] },
  };
}

function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1);
}

// GET /api/patients — fetch all patients from Notion
app.get("/api/patients", async (req, res) => {
  try {
    const response = await fetch(`https://api.notion.com/v1/databases/${NOTION_DB}/query`, {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({ sorts: [{ property: "Admit Date", direction: "descending" }] }),
    });
    const data = await response.json();
    if (!data.results) return res.status(500).json({ error: "No results from Notion", data });
    const patients = data.results.map(notionToPatient);
    res.json(patients);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/patients — create new patient in Notion
app.post("/api/patients", async (req, res) => {
  try {
    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({
        parent: { database_id: NOTION_DB },
        properties: patientToNotion(req.body),
      }),
    });
    const data = await response.json();
    res.json(notionToPatient(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH /api/patients/:id — update patient in Notion
app.patch("/api/patients/:id", async (req, res) => {
  try {
    const response = await fetch(`https://api.notion.com/v1/pages/${req.params.id}`, {
      method: "PATCH",
      headers: notionHeaders,
      body: JSON.stringify({ properties: patientToNotion(req.body) }),
    });
    const data = await response.json();
    res.json(notionToPatient(data));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/claude — Claude AI proxy
app.post("/api/claude", async (req, res) => {
  try {
    const body = req.body;
    if (body.mcp_servers) {
      body.mcp_servers = body.mcp_servers.map(s =>
        s.url.includes("notion")
          ? { ...s, authorization_token: NOTION_TOKEN }
          : s
      );
    }
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_KEY,
        "anthropic-version": "2023-06-01",
        "anthropic-beta": "mcp-client-2025-04-04",
      },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
// ── TASKS ─────────────────────────────────────────────────────────────────
const TASKS_DB_ID = process.env.NOTION_TASKS_DB_ID;

app.get("/api/notion/tasks", async (req, res) => {
  try {
    const r = await fetch(`https://api.notion.com/v1/databases/${TASKS_DB_ID}/query`, {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({ sorts: [{ property: "Status", direction: "ascending" }] }),
    });
    res.json(await r.json());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.post("/api/notion/tasks", async (req, res) => {
  try {
    const r = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: notionHeaders,
      body: JSON.stringify({ parent: { database_id: TASKS_DB_ID }, properties: req.body }),
    });
    res.json(await r.json());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.patch("/api/notion/tasks/:id", async (req, res) => {
  try {
    const r = await fetch(`https://api.notion.com/v1/pages/${req.params.id}`, {
      method: "PATCH",
      headers: notionHeaders,
      body: JSON.stringify({ properties: req.body }),
    });
    res.json(await r.json());
  } catch (err) { res.status(500).json({ error: err.message }); }
});

app.listen(3001, () => console.log("Server running on :3001"));
