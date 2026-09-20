const API = "http://localhost:5000/api/decoyshield";

const statusBadge = document.getElementById("statusBadge");
const engineState = document.getElementById("engineState");
const directoryPath = document.getElementById("directoryPath");
const riskLevel = document.getElementById("riskLevel");
const filesScanned = document.getElementById("filesScanned");
const alertCount = document.getElementById("alertCount");
const eventList = document.getElementById("eventList");
const scanBtn = document.getElementById("scanBtn");

function setBadge(online) {
  if (online) {
    statusBadge.textContent = "Online";
    statusBadge.className = "badge online";
  } else {
    statusBadge.textContent = "Offline";
    statusBadge.className = "badge offline";
  }
}

function renderEvent(event) {
  const item = document.createElement("div");
  const severity = (event.severity || "medium").toLowerCase();
  item.className = `event-item ${severity}`;

  item.innerHTML = `
    <div>
      <strong>${event.file || "unknown"}</strong>
      <p>${event.reason || "No reason provided"}</p>
    </div>
    <div class="score">${event.score ?? 0}</div>
  `;

  eventList.prepend(item);
  while (eventList.children.length > 10) {
    eventList.removeChild(eventList.lastChild);
  }
}

async function fetchStatus() {
  try {
    const response = await fetch(`${API}/status`);
    const data = await response.json();
    setBadge(true);
    engineState.textContent = data.running ? "Monitoring" : "Stopped";
    directoryPath.textContent = data.directory || "—";

    const recent = data.recentEvents || [];
    const maxSeverity = recent.reduce((highest, event) => {
      const order = { low: 1, medium: 2, high: 3, critical: 4 };
      return order[event.severity] > order[highest] ? event.severity : highest;
    }, "low");

    riskLevel.textContent = maxSeverity.toUpperCase();
    filesScanned.textContent = data.recentEvents?.length ? data.recentEvents.length : "0";
    alertCount.textContent = recent.filter((event) => event.severity === "high" || event.severity === "critical").length;

    eventList.innerHTML = "";
    if (recent.length === 0) {
      eventList.innerHTML = '<p class="empty-state">No suspicious activity detected.</p>';
      return;
    }

    recent.slice(0, 8).forEach(renderEvent);
  } catch (error) {
    setBadge(false);
    engineState.textContent = "Unavailable";
  }
}

async function runManualScan() {
  scanBtn.disabled = true;
  try {
    await fetch(`${API}/scan`, { method: "POST" });
    await fetchStatus();
  } finally {
    scanBtn.disabled = false;
  }
}

scanBtn.addEventListener("click", runManualScan);

fetchStatus();

const eventSource = new EventSource("http://localhost:5000/api/decoyshield/stream");
eventSource.onmessage = (event) => {
  try {
    const payload = JSON.parse(event.data);
    if (payload.type === "connected") return;
    if (payload.file) renderEvent(payload);
  } catch (error) {
    // ignore malformed events
  }
};

eventSource.onerror = () => {
  setBadge(false);
};

setInterval(fetchStatus, 10000);
