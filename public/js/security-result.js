function fmtTime(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

async function load() {
  const [riskRes, eventsRes] = await Promise.all([
    fetch("/api/security/risk"),
    fetch("/api/security/events")
  ]);
  const riskData = await riskRes.json();
  const eventsData = await eventsRes.json();

  const { score, level } = riskData.risk;
  document.getElementById("riskScoreVal").textContent = `${score} / 100`;
  const badge = document.getElementById("riskLevelBadge");
  badge.textContent = level;
  badge.className = "badge " + (level === "CRITICAL" ? "badge-critical" : level === "ELEVATED" ? "badge-elevated" : "badge-low");

  const fill = document.getElementById("riskMeterFill");
  fill.style.width = score + "%";
  fill.style.background = level === "CRITICAL" ? "var(--danger)" : level === "ELEVATED" ? "var(--warning)" : "var(--success)";

  const list = document.getElementById("eventsTimeline");
  if (!eventsData.events.length) {
    list.innerHTML = `<li><span class="time">—</span> No events yet.</li>`;
    return;
  }
  list.innerHTML = eventsData.events
    .slice()
    .reverse()
    .map((ev) => {
      const icon = ev.level === "critical" ? "🚨" : ev.level === "danger" ? "⚠" : ev.level === "success" ? "✓" : "•";
      return `<li><span class="time">${fmtTime(ev.time)}</span> ${icon} ${ev.text}</li>`;
    })
    .join("");
}

load();
