require("dotenv").config();
const express = require("express");
const cron = require("node-cron");
const { syncRange } = require("./services/syncService");

const app = express();
app.use(express.json());

app.get("/health", (req, res) => res.json({ ok: true }));

app.post("/sync", async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ error: "Faltan query params start y end (YYYY-MM-DD)" });
    }
    const result = await syncRange(start, end);
    res.json({ success: true, result });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// opcional: cron diario para guardar "ayer" completo
cron.schedule("0 8 * * *", async () => {
  try {
    const now = new Date();
    const y = new Date(now);
    y.setDate(now.getDate() - 1);
    const ymd = y.toISOString().slice(0, 10);

    await syncRange(ymd, ymd);
    console.log("Cron sync ok:", ymd);
  } catch (e) {
    console.error("Cron sync failed:", e.message);
  }
}, { timezone: process.env.TZ || "America/Mexico_City" });

const port = Number(process.env.PORT || 3001);
app.listen(port, () => console.log(`API running on http://localhost:${port}`));
