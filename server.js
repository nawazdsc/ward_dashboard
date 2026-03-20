import 'dotenv/config'
import express from "express";
import fetch from "node-fetch";

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST,PATCH");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

const NOTION_HEADERS = {
  "Authorization": `Bearer ${process.env.NOTION_TOKEN}`,
  "Notion-Version": "2022-06-28",
  "Content-Type": "application/json",
};
const DB_ID = process.env.NOTION_DB_ID;

// ── GET all patients ──────────────────────────────
app.get("/api/notion/patients", async (req, res) => {
  const r = await fetch(`https://api.notion.com/v1/databases/${DB_ID}/query`, {
    method: "POST",
    headers: NOTION_HEADERS,
    body: JSON.stringify({ sorts: [{ property: "Status", direction: "ascending" }] }),
  });
  res.json(await r.json());
});

// ── CREATE patient ────────────────────────────────
app.post("/api/notion/patients", async (req, res) => {
  const r = await fetch("https://api.notion.com/v1/pages", {
    method: "POST",
    headers: NOTION_HEADERS,
    body: JSON.stringify({ parent: { database_id: DB_ID }, properties: req.body }),
  });
  res.json(await r.json());
});

// ── UPDATE patient ────────────────────────────────
app.patch("/api/notion/patients/:id", async (req, res) => {
  const r = await fetch(`https://api.notion.com/v1/pages/${req.params.id}`, {
    method: "PATCH",
    headers: NOTION_HEADERS,
    body: JSON.stringify({ properties: req.body }),
  });
  res.json(await r.json());
});

// ── Claude AI proxy ───────────────────────────────
app.post("/api/claude", async (req, res) => {
  const body = req.body;
  if (body.mcp_servers) {
    body.mcp_servers = body.mcp_servers.map(s =>
      s.url.includes("notion") ? { ...s, authorization_token: process.env.NOTION_TOKEN } : s
    );
  }
  const r = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "mcp-client-2025-04-04",
    },
    body: JSON.stringify(body),
  });
  res.json(await r.json());
});

app.listen(3001, () => console.log("Proxy on :3001"));
