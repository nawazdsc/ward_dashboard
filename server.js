import "dotenv/config";
import express from "express";
import { createClient } from "@supabase/supabase-js";
import Groq from "groq-sdk";

const app = express();
app.use(express.json({ limit: "10mb" }));

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Content-Type");
  res.header("Access-Control-Allow-Methods", "GET,POST,PATCH,DELETE,OPTIONS");
  if (req.method === "OPTIONS") return res.sendStatus(200);
  next();
});

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// ── PATIENTS ─────────────────────────────────────────────────────────────
app.get("/api/patients", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("patients")
      .select("*")
      .order("admit_date", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/patients", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("patients")
      .insert(req.body)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/patients/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("patients")
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete("/api/patients/:id", async (req, res) => {
  try {
    const { error } = await supabase
      .from("patients")
      .delete()
      .eq("id", req.params.id);
    if (error) return res.status(500).json({ error: error.message });
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── VITALS ───────────────────────────────────────────────────────────────
app.get("/api/vitals/:patientId", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("vitals")
      .select("*")
      .eq("patient_id", req.params.patientId)
      .order("recorded_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/vitals/:patientId", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("vitals")
      .insert({ ...req.body, patient_id: req.params.patientId })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });

    // Also update patient's latest vitals
    const latest = {};
    if (req.body.bp) latest.bp = req.body.bp;
    if (req.body.spo2) latest.spo2 = req.body.spo2;
    if (req.body.pulse) latest.pulse = req.body.pulse;
    if (req.body.temp) latest.temp = req.body.temp;
    if (req.body.rr) latest.rr = req.body.rr;
    if (req.body.gcs) latest.gcs = req.body.gcs;
    if (req.body.uop) latest.uop = req.body.uop;
    if (req.body.rbs) latest.rbs = req.body.rbs;
    if (Object.keys(latest).length > 0) {
      latest.vitals_time = new Date().toISOString();
      latest.updated_at = new Date().toISOString();
      await supabase
        .from("patients")
        .update(latest)
        .eq("id", req.params.patientId);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── LABS ─────────────────────────────────────────────────────────────────
app.get("/api/labs/:patientId", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("labs")
      .select("*")
      .eq("patient_id", req.params.patientId)
      .order("recorded_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/labs/:patientId", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("labs")
      .insert({ ...req.body, patient_id: req.params.patientId })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── TASKS ────────────────────────────────────────────────────────────────
app.get("/api/tasks", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/tasks", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .insert(req.body)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/tasks/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("tasks")
      .update(req.body)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── DRUGS ────────────────────────────────────────────────────────────────
app.get("/api/drugs/:patientId", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("drugs")
      .select("*")
      .eq("patient_id", req.params.patientId)
      .order("created_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/drugs/:patientId", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("drugs")
      .insert({ ...req.body, patient_id: req.params.patientId })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch("/api/drugs/:id", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("drugs")
      .update(req.body)
      .eq("id", req.params.id)
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── FILES ────────────────────────────────────────────────────────────────
app.get("/api/files/:patientId", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("files")
      .select("*")
      .eq("patient_id", req.params.patientId)
      .order("uploaded_at", { ascending: false });
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/files/:patientId", async (req, res) => {
  try {
    const { file_name, file_data, file_type } = req.body;
    // Upload to Supabase Storage
    const path = `patients/${req.params.patientId}/${Date.now()}_${file_name}`;
    const buffer = Buffer.from(file_data, "base64");
    const { error: uploadError } = await supabase.storage
      .from("patient-files")
      .upload(path, buffer, { contentType: file_type || "application/octet-stream" });
    if (uploadError) return res.status(500).json({ error: uploadError.message });

    const { data: urlData } = supabase.storage
      .from("patient-files")
      .getPublicUrl(path);

    const { data, error } = await supabase
      .from("files")
      .insert({
        patient_id: req.params.patientId,
        file_name,
        file_url: urlData.publicUrl,
        file_type: req.body.category || "other",
      })
      .select()
      .single();
    if (error) return res.status(500).json({ error: error.message });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ── AI (GROQ) ────────────────────────────────────────────────────────────
app.post("/api/ai", async (req, res) => {
  try {
    const { system, messages, max_tokens } = req.body;
    const completion = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: system || "You are a clinical AI assistant." },
        ...(messages || []),
      ],
      max_tokens: max_tokens || 1500,
      temperature: 0.3,
    });
    const text = completion.choices?.[0]?.message?.content || "";
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => console.log("Server running on :3001"));
