const express = require("express");
const cors = require("cors");
const { DecoyShield } = require("../DecoyShield");
require("dotenv").config();

const app = express();
const shield = new DecoyShield();
const clients = new Set();

app.use(cors());
app.use(express.json());

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "DecoyShield", status: shield.status() });
});

app.get("/api/decoyshield/status", (_req, res) => {
  res.json(shield.status());
});

app.get("/api/decoyshield/events", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 20, 100);
  res.json({ events: shield.events.slice(0, limit) });
});

app.get("/api/decoyshield/stream", (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders();

  clients.add(res);
  res.write(`data: ${JSON.stringify({ type: "connected" })}\n\n`);

  req.on("close", () => {
    clients.delete(res);
  });
});

app.post("/api/decoyshield/scan", async (_req, res) => {
  try {
    const result = await shield.scan();
    res.json({ ok: true, ...result });
  } catch (error) {
    res.status(500).json({ ok: false, error: error.message });
  }
});

app.post("/api/decoyshield/start", (_req, res) => {
  shield.start();
  res.json(shield.status());
});

app.post("/api/decoyshield/stop", (_req, res) => {
  shield.stop();
  res.json(shield.status());
});

shield.onAlert = (event) => {
  const payload = JSON.stringify(event);
  for (const client of clients) {
    client.write(`data: ${payload}\n\n`);
  }
};

const PORT = Number(process.env.PORT || 5000);

async function startServer() {
  await shield.initialize();
  shield.start();

  app.listen(PORT, () => {
    console.log(`DecoyShield API running on http://localhost:${PORT}`);
  });
}

startServer().catch((error) => {
  console.error("Failed to start DecoyShield:", error);
  process.exit(1);
});

module.exports = { app, shield };
