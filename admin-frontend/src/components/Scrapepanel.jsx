import { useState, useEffect, useRef } from "react";

const API = "/api/admin";

const ENTITY_CONFIG = {
  weapons: {
    title:        "🔫 Weapons Scraper",
    allLabel:     "Update all Weapons",
    allDesc:      "All weapons in the database will be freshly scraped and updated from Wikipedia.",
    oneLabel:     "Scrape a Single Weapon",
    oneDesc:      "Want to update just one weapon? Select it here.",
    startAll:     "🚀 Scrape all Weapons",
    startOne:     "🚀 Scrape Selected Weapon",
    dropdown:     "— choose Weapon —",
    scrapeAllUrl: (API) => `${API}/scrape/weapons/all`,
    scrapeOneUrl: (API, id) => `${API}/scrape/weapons/${id}`,
  },
  species: {
    title:        "🐾 Species Scraper",
    allLabel:     "Update all Species",
    allDesc:      "All species in the database will be freshly scraped and updated from Wikipedia & ADW.",
    oneLabel:     "Scrape a Single Species",
    oneDesc:      "Want to update just one species? Select it here.",
    startAll:     "🚀 Scrape all Species",
    startOne:     "🚀 Scrape Selected Species",
    dropdown:     "— choose Species —",
    scrapeAllUrl: (API) => `${API}/scrape/species/all`,
    scrapeOneUrl: (API, id) => `${API}/scrape/species/${id}`,
  },
  
  areas: {
    title:        "🌐 Hunting Areas Scraper",
    allLabel:     "Update all Areas",
    allDesc:      "All hunting areas in the database will be freshly scraped from Wikipedia, WWF, and PTDC.",
    oneLabel:     "Scrape a Single Area",
    oneDesc:      "New area added? Or want to update just one? Select it here.",
    startAll:     "🚀 Scrape all Areas",
    startOne:     "🚀 Scrape Selected Area",
    dropdown:     "— choose Area —",
    scrapeAllUrl: (API) => `${API}/scrape/all`,
    scrapeOneUrl: (API, id) => `${API}/scrape/${id}`,
  },
  laws: {
    title:        "⚖️ Hunting Laws Scraper",
    allLabel:     "Update all Laws",
    allDesc:      "All hunting laws will be freshly scraped from Punjab Wildlife, KP Act 2024, Wikipedia & World Animal Protection.",
    oneLabel:     "Scrape a Single Law",
    oneDesc:      "Want to update just one law? Select it here.",
    startAll:     "🚀 Scrape all Laws",
    startOne:     "🚀 Scrape Selected Law",
    dropdown:     "— choose Law —",
    scrapeAllUrl: (API) => `${API}/scrape/laws/all`,
    scrapeOneUrl: (API, id) => `${API}/scrape/laws/${id}`,
  },
  resorts: {
    title:        "🏨 Resorts Scraper",
    allLabel:     "Update all Resorts",
    allDesc:      "All resorts will be scraped from official websites, Tavily web search & Wikipedia.",
    oneLabel:     "Scrape a Single Resort",
    oneDesc:      "New resort added? Or want to update just one? Select it here.",
    startAll:     "🚀 Scrape all Resorts",
    startOne:     "🚀 Scrape Selected Resort",
    dropdown:     "— choose Resort —",
    scrapeAllUrl: (API) => `${API}/scrape/resorts/all`,
    scrapeOneUrl: (API, id) => `${API}/scrape/resorts/${id}`,
  },
};

export default function ScrapePanel({ entity = "areas", items = [], areas = [] }) {
  const list = items.length > 0 ? items : areas;
  const cfg  = ENTITY_CONFIG[entity] || ENTITY_CONFIG.areas;

  const [open,    setOpen]    = useState(false);
  const [mode,    setMode]    = useState("all");
  const [selId,   setSelId]   = useState("");
  const [running, setRunning] = useState(false);
  const [paused,  setPaused]  = useState(false);
  const [done,    setDone]    = useState(false);
  const [logs,    setLogs]    = useState([]);
  const [error,   setError]   = useState(null);

  const pollRef   = useRef(null);
  const logBoxRef = useRef(null);

  useEffect(() => {
    if (logBoxRef.current)
      logBoxRef.current.scrollTop = logBoxRef.current.scrollHeight;
  }, [logs]);

  useEffect(() => () => clearInterval(pollRef.current), []);

  function startPolling() {
    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`${API}/scrape/status`);
        const data = await res.json();
        setLogs(data.log || []);
        setPaused(!!data.paused);
        if (!data.running) {
          clearInterval(pollRef.current);
          setRunning(false);
          setPaused(false);
          if (data.error) setError(data.error);
          else setDone(true);
        }
      } catch {
        clearInterval(pollRef.current);
        setRunning(false);
        setPaused(false);
        setError("Cannot connect to server.");
      }
    }, 1500);
  }

  async function handleStart() {
    setLogs([]);
    setDone(false);
    setError(null);
    setRunning(true);
    setPaused(false);

    const url = mode === "all"
      ? cfg.scrapeAllUrl(API)
      : cfg.scrapeOneUrl(API, selId);

    try {
      const res  = await fetch(url, { method: "POST" });
      const data = await res.json();
      if (!data.success) {
        setRunning(false);
        setError(data.message);
        return;
      }
      startPolling();
    } catch {
      setRunning(false);
      setError("Request failed. Try again.");
    }
  }

  async function handleStop() {
    try {
      await fetch(`${API}/scrape/stop`, { method: "POST" });
    } catch { /* ignore network errors */ }
    clearInterval(pollRef.current);
    setRunning(false);
    setPaused(false);
    setDone(true);
  }

  async function handlePauseResume() {
    if (paused) {
      try {
        await fetch(`${API}/scrape/resume`, { method: "POST" });
        setPaused(false);
      } catch { /* ignore */ }
    } else {
      try {
        await fetch(`${API}/scrape/pause`, { method: "POST" });
        setPaused(true);
      } catch { /* ignore */ }
    }
  }

  function handleClose() {
    if (running) return;
    setOpen(false);
    setDone(false);
    setLogs([]);
    setError(null);
    setMode("all");
    setSelId("");
    setPaused(false);
  }

  function getCurrentItem() {
    const last = [...logs].reverse().find(l =>
      l.msg.includes("▶") || l.msg.match(/\[\d+\/\d+\]/)
    );
    if (!last) return null;
    const m = last.msg.match(/▶\s+(.+)/);
    return m ? m[1].trim() : null;
  }

  function getProgress() {
    const last = [...logs].reverse().find(l => l.msg.match(/\[(\d+)\/(\d+)\]/));
    if (!last) return null;
    const m = last.msg.match(/\[(\d+)\/(\d+)\]/);
    return m ? { current: parseInt(m[1]), total: parseInt(m[2]) } : null;
  }

  const progress    = getProgress();
  const currentItem = getCurrentItem();
  const pct         = progress ? Math.round((progress.current / progress.total) * 100) : 0;

  return (
    <>
      {/* ── Trigger Button ── */}
      <button onClick={() => setOpen(true)} style={styles.triggerBtn}>
        🔄 Scrape Data
      </button>

      {/* ── Modal ── */}
      {open && (
        <div style={styles.overlay} onClick={!running ? handleClose : undefined}>
          <div style={styles.modal} onClick={e => e.stopPropagation()}>

            {/* Header */}
            <div style={styles.header}>
              <span style={styles.headerTitle}>{cfg.title}</span>
              <span style={styles.countBadge}>{list.length} {entity} in DB</span>
              {!running && (
                <button onClick={handleClose} style={styles.closeBtn}>✕</button>
              )}
            </div>

            {/* Mode selector */}
            {!running && !done && (
              <div style={styles.body}>
                <p style={styles.desc}>Which data would you like to refresh?</p>

                <div style={styles.optionRow}>
                  <div
                    style={{ ...styles.option, ...(mode === "all" ? styles.optionActive : {}) }}
                    onClick={() => setMode("all")}
                  >
                    <div style={styles.optionIcon}>📋</div>
                    <div>
                      <div style={styles.optionTitle}>{cfg.allLabel}</div>
                      <div style={styles.optionSub}>{cfg.allDesc}</div>
                    </div>
                  </div>

                  <div
                    style={{ ...styles.option, ...(mode === "one" ? styles.optionActive : {}) }}
                    onClick={() => setMode("one")}
                  >
                    <div style={styles.optionIcon}>🎯</div>
                    <div>
                      <div style={styles.optionTitle}>{cfg.oneLabel}</div>
                      <div style={styles.optionSub}>{cfg.oneDesc}</div>
                    </div>
                  </div>
                </div>

                {mode === "one" && (
                  <select value={selId} onChange={e => setSelId(e.target.value)} style={styles.select}>
                    <option value="">{cfg.dropdown}</option>
                    {list.map(item => (
                      <option key={item.id} value={item.id}>#{item.id} — {item.name}</option>
                    ))}
                  </select>
                )}

                {error && <div style={styles.errorBox}>⚠️ {error}</div>}

                <button
                  onClick={handleStart}
                  disabled={mode === "one" && !selId}
                  style={{ ...styles.startBtn, ...(mode === "one" && !selId ? styles.startBtnDisabled : {}) }}
                >
                  {mode === "all" ? cfg.startAll : cfg.startOne}
                </button>

                <p style={styles.warning}>⚠️ Don't close this page while scraping. It may take 10–15 minutes.</p>
              </div>
            )}

            {/* ── Live scraping view ── */}
            {(running || done) && (
              <div style={styles.liveSection}>

                {/* Progress bar */}
                {progress && (
                  <div style={styles.progressWrap}>
                    <div style={{ ...styles.progressBar, width: `${pct}%` }} />
                    <span style={styles.progressPct}>{pct}% &nbsp;({progress.current}/{progress.total})</span>
                  </div>
                )}

                {/* Current item */}
                {running && currentItem && (
                  <div style={styles.currentItem}>
                    <span style={{ ...styles.pulse, color: paused ? "#f59e0b" : "#22c55e" }}>●</span>
                    &nbsp;
                    {paused
                      ? <span style={{ color: "#f59e0b" }}>Paused — <strong>{currentItem}</strong></span>
                      : <>Currently scraping: <strong style={{ color: "#f1f5f9" }}>{currentItem}</strong></>
                    }
                  </div>
                )}

                {/* Stop / Pause buttons */}
                {running && (
                  <div style={styles.controlRow}>
                    <button onClick={handlePauseResume} style={styles.pauseBtn}>
                      {paused ? "▶ Resume" : "⏸ Pause"}
                    </button>
                    <button onClick={handleStop} style={styles.stopBtn}>
                      ⏹ Stop
                    </button>
                  </div>
                )}

                {done && (
                  <div style={styles.doneMsg}>
                    ✅ Scraping complete! All {entity} updated successfully.
                  </div>
                )}

                {/* Log header */}
                <div style={styles.logHeader}>
                  <span>📋 Detailed Log</span>
                  <span style={{ fontSize: "11px", color: "#475569" }}>{logs.length} entries</span>
                </div>

                {/* Log box */}
                <div ref={logBoxRef} style={styles.logBox}>
                  {logs.map((l, i) => {
                    const parsed = parseLog(l.msg);
                    return (
                      <div key={i} style={styles.logLine}>
                        <span style={styles.logTime}>
                          {new Date(l.time).toLocaleTimeString("en-PK")}
                        </span>
                        <span style={{ color: parsed.color, display: "flex", alignItems: "center", gap: "6px" }}>
                          {parsed.icon && <span>{parsed.icon}</span>}
                          <span>{parsed.text}</span>
                        </span>
                      </div>
                    );
                  })}
                  {running && !paused && <div style={styles.blinkCursor}>▌</div>}
                </div>

                {done && (
                  <button onClick={handleClose} style={styles.doneBtn}>✓ Close</button>
                )}
                {error && <div style={styles.errorBox}>❌ {error}</div>}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}

// ── Log parser ────────────────────────────────────────────
function parseLog(msg) {
  if (msg.includes("✅") && (msg.includes("UPDATED") || msg.includes("INSERTED") || msg.includes("saved") || msg.includes("Saved")))
    return { color: "#22c55e", icon: "✅", text: msg.replace("✅", "").trim() };
  if (msg.includes("DONE") || msg.includes("completed") || msg.includes("Complete"))
    return { color: "#22c55e", icon: "🎉", text: msg };
  if (msg.includes("[AI]") && (msg.includes("filled") || msg.includes("Fields filled")))
    return { color: "#818cf8", icon: "🤖", text: msg.replace("[AI]", "").trim() };
  if (msg.includes("[AI]") && msg.includes("Skip"))
    return { color: "#475569", icon: "⏭️", text: msg.replace("[AI]", "").trim() };
  if (msg.includes("[AI]"))
    return { color: "#a78bfa", icon: "🤖", text: msg.replace("[AI]", "").trim() };
  if (msg.includes("[Search]") || msg.includes("Data mila") || msg.includes("Kuch nahi"))
    return { color: "#38bdf8", icon: "🔍", text: msg.replace(/\[Search\]/, "").trim() };
  if (msg.includes("[Wiki]"))
    return { color: "#60a5fa", icon: "📖", text: msg.replace("[Wiki]", "").trim() };
  if (msg.includes("[Website]"))
    return { color: "#67e8f9", icon: "🌐", text: msg.replace("[Website]", "").trim() };
  if (msg.includes("[WWF]"))  return { color: "#4ade80", icon: "🌿", text: msg.replace("[WWF]", "").trim() };
  if (msg.includes("[PTDC]")) return { color: "#34d399", icon: "🏛️", text: msg.replace("[PTDC]", "").trim() };
  if (msg.includes("[ADW]"))  return { color: "#6ee7b7", icon: "🐾", text: msg.replace("[ADW]", "").trim() };
  if (msg.match(/\[\d+\/\d+\]/))
    return { color: "#fbbf24", icon: "▶", text: msg.replace(/▶/, "").trim() };
  if (msg.includes("⏳") || msg.includes("pause") || msg.includes("sec"))
    return { color: "#f59e0b", icon: "⏳", text: msg.replace("⏳", "").trim() };
  if (msg.includes("❌") || msg.includes("ERROR") || msg.includes("error"))
    return { color: "#f87171", icon: "❌", text: msg.replace("❌", "").trim() };
  if (msg.includes("Empty fields"))
    return { color: "#94a3b8", icon: "🔎", text: msg };
  if (msg.match(/^[-=]{5,}/))
    return { color: "#1e293b", icon: "", text: "" };
  return { color: "#cbd5e1", icon: "", text: msg };
}

const styles = {
  triggerBtn: {
    background: "linear-gradient(135deg, #d97706, #92400e)",
    color: "#fff", border: "none", borderRadius: "8px",
    padding: "10px 20px", fontWeight: "600", fontSize: "14px",
    cursor: "pointer", display: "flex", alignItems: "center",
    gap: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
    whiteSpace: "nowrap",
  },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.65)",
    backdropFilter: "blur(4px)", display: "flex",
    alignItems: "center", justifyContent: "center", zIndex: 9999,
  },
  modal: {
    background: "#1e293b", borderRadius: "16px",
    width: "min(660px, 95vw)", maxHeight: "88vh",
    overflow: "hidden", display: "flex", flexDirection: "column",
    boxShadow: "0 24px 60px rgba(0,0,0,0.5)", border: "1px solid #334155",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "18px 24px", borderBottom: "1px solid #334155",
    background: "#0f172a", gap: "12px",
  },
  headerTitle: { fontSize: "17px", fontWeight: "700", color: "#f1f5f9", flex: 1 },
  countBadge:  {
    background: "#334155", color: "#94a3b8", fontSize: "12px",
    fontWeight: "600", padding: "4px 10px", borderRadius: "20px", whiteSpace: "nowrap",
  },
  closeBtn: {
    background: "none", border: "none", color: "#94a3b8",
    fontSize: "18px", cursor: "pointer", padding: "4px 8px", borderRadius: "6px",
  },
  body:       { padding: "24px", overflowY: "auto" },
  desc:       { color: "#94a3b8", marginBottom: "16px", fontSize: "14px" },
  optionRow:  { display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" },
  option: {
    display: "flex", gap: "14px", alignItems: "flex-start",
    padding: "16px", borderRadius: "12px", border: "2px solid #334155",
    background: "#0f172a", cursor: "pointer",
  },
  optionActive: { borderColor: "#d97706", background: "#1c1408" },
  optionIcon:   { fontSize: "28px", flexShrink: 0 },
  optionTitle:  { fontSize: "15px", fontWeight: "600", color: "#f1f5f9", marginBottom: "4px" },
  optionSub:    { fontSize: "13px", color: "#64748b", lineHeight: "1.5" },
  select: {
    width: "100%", padding: "10px 14px", borderRadius: "8px",
    border: "1px solid #334155", background: "#0f172a", color: "#f1f5f9",
    fontSize: "14px", marginBottom: "20px", outline: "none",
  },
  startBtn: {
    width: "100%", padding: "13px",
    background: "linear-gradient(135deg, #d97706, #b45309)",
    color: "#fff", border: "none", borderRadius: "10px",
    fontWeight: "700", fontSize: "15px", cursor: "pointer", marginBottom: "12px",
  },
  startBtnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  warning: { fontSize: "12px", color: "#64748b", textAlign: "center" },

  // ── Live section ──
  liveSection: {
    display: "flex", flexDirection: "column",
    padding: "20px 24px", flex: 1, minHeight: 0, overflowY: "auto", gap: "12px",
  },
  progressWrap: {
    background: "#0f172a", borderRadius: "8px", height: "10px",
    overflow: "hidden", position: "relative", border: "1px solid #334155",
  },
  progressBar: {
    height: "100%", background: "linear-gradient(90deg, #d97706, #22c55e)",
    borderRadius: "8px", transition: "width 0.5s ease",
  },
  progressPct: {
    position: "absolute", right: "8px", top: "-1px",
    fontSize: "10px", color: "#94a3b8", fontWeight: "600",
  },
  currentItem: {
    background: "#0f172a", border: "1px solid #334155",
    borderRadius: "8px", padding: "10px 14px",
    fontSize: "13px", color: "#94a3b8", display: "flex", alignItems: "center",
  },
  pulse: { fontSize: "10px" },

  // ── Stop / Pause controls ──
  controlRow: {
    display: "flex", gap: "8px",
  },
  pauseBtn: {
    flex: 1, padding: "8px 0",
    background: "#1c1408", border: "1px solid #d97706",
    color: "#fbbf24", borderRadius: "8px",
    fontWeight: "600", fontSize: "13px", cursor: "pointer",
  },
  stopBtn: {
    flex: 1, padding: "8px 0",
    background: "#1a0505", border: "1px solid #7f1d1d",
    color: "#f87171", borderRadius: "8px",
    fontWeight: "600", fontSize: "13px", cursor: "pointer",
  },

  doneMsg: {
    background: "#052e16", border: "1px solid #166534",
    borderRadius: "8px", padding: "12px 16px",
    color: "#86efac", fontSize: "14px", fontWeight: "600", textAlign: "center",
  },
  logHeader: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    fontSize: "13px", fontWeight: "600", color: "#64748b",
  },
  logBox: {
    background: "#0a0f1a", borderRadius: "10px", padding: "12px",
    fontFamily: "'Fira Code', 'Courier New', monospace",
    fontSize: "12px", lineHeight: "1.7", overflowY: "auto",
    maxHeight: "260px", border: "1px solid #1e293b",
  },
  logLine:     { display: "flex", gap: "10px", marginBottom: "1px" },
  logTime:     { color: "#334155", flexShrink: 0, fontSize: "11px", paddingTop: "2px" },
  blinkCursor: { color: "#d97706" },
  doneBtn: {
    width: "100%", padding: "11px",
    background: "#166534", color: "#bbf7d0", border: "none",
    borderRadius: "8px", fontWeight: "600", fontSize: "14px", cursor: "pointer",
  },
  errorBox: {
    background: "#450a0a", border: "1px solid #7f1d1d",
    borderRadius: "8px", padding: "12px", color: "#fca5a5", fontSize: "13px",
  },
};