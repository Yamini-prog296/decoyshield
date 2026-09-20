#!/usr/bin/env node
/**
 * DecoyShield - standalone ransomware early-warning monitor
 *
 * Usage:
 *   node DecoyShield.js
 *   DECOY_DIR=/path/to/decoys node DecoyShield.js
 *
 * Safe by design:
 * - monitors only a dedicated decoy directory
 * - never encrypts or destroys real files
 * - raises alerts for investigation
 */

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");

const DEFAULT_DECOY_DIR = path.resolve(
  process.env.DECOY_DIR || path.join(__dirname, "decoys")
);

const SUSPICIOUS_EXTENSIONS = new Set([
  ".locked",
  ".encrypted",
  ".enc",
  ".crypt",
  ".ryk",
  ".wncry",
  ".wannacry",
  ".lockbit",
  ".conti",
  ".revil",
  ".akira",
  ".blackcat",
  ".ransom",
]);

class DecoyShield {
  constructor({ directory = DEFAULT_DECOY_DIR, maxEvents = 100, logger = console } = {}) {
    this.directory = path.resolve(directory);
    this.maxEvents = maxEvents;
    this.logger = logger;
    this.baseline = new Map();
    this.events = [];
    this.changeTimes = [];
    this.watcher = null;
  }

  async initialize() {
    await fs.promises.mkdir(this.directory, { recursive: true });
    await this.createCanaries();
    await this.scan();
    return this;
  }

  async createCanaries() {
    const canaries = {
      "client-contracts.txt": "DECOYSHIELD CANARY\nDo not edit this protected file.\n",
      "studio-finances.csv": "month,category,total\nJanuary,operations,12500\n",
      "project-archive.json": JSON.stringify(
        {
          marker: "DECOYSHIELD-CANARY",
          projects: ["wedding-2026", "portrait-archive"],
        },
        null,
        2
      ),
    };

    for (const [name, content] of Object.entries(canaries)) {
      const file = path.join(this.directory, name);
      try {
        await fs.promises.access(file, fs.constants.F_OK);
      } catch {
        await fs.promises.writeFile(file, content, { flag: "wx" });
      }
    }
  }

  async listFiles() {
    const entries = await fs.promises.readdir(this.directory, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile())
      .map((entry) => path.join(this.directory, entry.name));
  }

  async hash(file) {
    const data = await fs.promises.readFile(file);
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  async scan() {
    const current = new Map();

    for (const file of await this.listFiles()) {
      try {
        current.set(file, await this.hash(file));
      } catch {
        // File may disappear while scanning; next pass will mark it deleted.
      }
    }

    if (this.baseline.size > 0) {
      for (const [file, oldHash] of this.baseline) {
        if (!current.has(file)) {
          this.alert(file, "deleted", 95, "A protected decoy was deleted");
        } else if (current.get(file) !== oldHash) {
          this.alert(file, "modified", 85, "A protected decoy changed unexpectedly");
        }
      }

      for (const file of current.keys()) {
        if (!this.baseline.has(file)) {
          this.alert(file, "created", 45, "A new file appeared in the protected directory");
        }
      }
    }

    this.baseline = current;
    return {
      files: current.size,
      timestamp: new Date().toISOString(),
    };
  }

  alert(file, action, baseScore, reason) {
    const now = Date.now();
    this.changeTimes = this.changeTimes.filter((time) => now - time < 10000);
    this.changeTimes.push(now);

    const extension = path.extname(file).toLowerCase();
    const extensionSignal = SUSPICIOUS_EXTENSIONS.has(extension) ? 25 : 0;
    const rapidChangeSignal = this.changeTimes.length >= 4 ? 10 : 0;
    const score = Math.min(100, baseScore + extensionSignal + rapidChangeSignal);
    const severity = score >= 80 ? "critical" : score >= 50 ? "high" : "medium";

    const event = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      file: path.basename(file),
      action,
      score,
      severity,
      reason: extensionSignal
        ? `${reason}; suspicious extension ${extension}`
        : reason,
    };

    this.events.unshift(event);
    this.events = this.events.slice(0, this.maxEvents);

    this.logger.error(`[DecoyShield ${severity.toUpperCase()}]`, JSON.stringify(event));
    return event;
  }

  start() {
    if (this.watcher) return;

    this.watcher = fs.watch(this.directory, { persistent: true }, async (_event, filename) => {
      if (!filename || filename.toString().startsWith(".")) return;

      try {
        await this.scan();
      } catch (error) {
        this.logger.error("DecoyShield scan failed:", error.message);
      }
    });

    this.logger.log(`DecoyShield monitoring ${this.directory}`);
  }

  stop() {
    if (this.watcher) this.watcher.close();
    this.watcher = null;
  }

  status() {
    return {
      running: Boolean(this.watcher),
      directory: this.directory,
      recentEvents: this.events,
    };
  }
}

if (require.main === module) {
  const shield = new DecoyShield();

  shield.initialize()
    .then(() => shield.start())
    .catch((error) => {
      console.error("DecoyShield startup failed:", error);
      process.exitCode = 1;
    });

  process.on("SIGINT", () => {
    shield.stop();
    process.exit(0);
  });

  process.on("SIGTERM", () => {
    shield.stop();
    process.exit(0);
  });
}

module.exports = { DecoyShield, SUSPICIOUS_EXTENSIONS };
