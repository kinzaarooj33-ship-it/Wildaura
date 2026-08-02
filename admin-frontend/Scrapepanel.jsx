import { useState, useEffect, useRef } from "react";

const API = "/api/admin";

// Entity ke hisaab se config
const ENTITY_CONFIG = {
  weapons: {
    title:       "🔫 Weapons Scraper",
    allLabel:    "Update all Weapons",
    allDesc:     "All weapons in the database will be freshly scraped and updated from Wikipedia.",
    oneLabel:    "Scrape a Single Weapon",
    oneDesc:     "Want to update just one weapon? Select it here.",
    startAll:    "🚀 Scrape all Weapons",
    startOne:    "🚀 Scrape Selected Weapon",
    dropdown:    "— Weapon chunain —",
    scrapeAllUrl: (API) => `${API}/scrape/weapons/all`,
    scrapeOneUrl: (API, id) => `${API}/scrape/weapons/${id}`,
  },
  species: {
    title:       "🐾 Species Scraper",
    allLabel:    "Update all Species",
    allDesc:     "All species in the database will be freshly scraped and updated from Wikipedia & ADW.",
    oneLabel:    "Scrape a Single Species",
    oneDesc:     "Want to update just one species? Select it here.",
    startAll:    "🚀 Scrape all Species",
    startOne:    "🚀 Scrape Selected Species",
    dropdown:    "— Species chunain —",
    scrapeAllUrl: (API) => `${API}/scrape/species/all`,
    scrapeOneUrl: (API, id) => `${API}/scrape/species/${id}`,
  },
  areas: {
    title:       "🌐 Hunting Areas Scraper",
    allLabel:    "Update all Areas",
    allDesc:     "All hunting areas in the database will be freshly scraped from Wikipedia, WWF, and PTDC.",
    oneLabel:    "Scrape a Single Area",
    oneDesc:     "New area added? Or want to update just one? Select it here.",
    startAll:    "🚀 Scrape all Areas",
    startOne:    "🚀 Scrape Selected Area",
    dropdown:    "— Area chunain —",
    scrapeAllUrl: (API) => `${API}/scrape/all`,
    scrapeOneUrl: (API, id) => `${API}/scrape/${id}`,
  },
};

export default function ScrapePanel({ entity = "areas", items = [], areas = [] }) {
  // items ya areas jo bhi diya ho use karo
  const list = items.length > 0 ? items : areas;

  const cfg = ENTITY_CONFIG[entity] || ENTITY_CONFIG.areas;

  const [open,    setOpen]    = useState(false);
  const [mode,    setMode]    = useState("all");
  const [selId,   setSelId]   = useState("");
  const [running, setRunning] = useState(false);
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
        if (!data.running) {
          clearInterval(pollRef.current);
          setRunning(false);
          if (data.error) setError(data.error);
          else setDone(true);
        }
      } catch {
        clearInterval(pollRef.current);
        setRunning(false);
        setError("Cannot connect to server.");
      }
    }, 1500);
  }

  async function handleStart() {
    setLogs([]);
    setDone(false);
    setError(null);
    setRunning(true);

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

  function handleClose() {
    if (running) return;
    setOpen(false);
    setDone(false);
    setLogs([]);
    setError(null);
    setMode("all");
    setSelId("");
  }

  return (
    <>
      {/* ── Trigger Button ── */}
      <button
        onClick={() => setOpen(true)}
        style={styles.triggerBtn}
        title={`Refresh ${entity} data by scraping`}
      >
        🔄 Scrape Data
      </button>

      {/* ── Modal ── */}
      {open && (
        <div style={styles.overlay} onClick={!running ? handleClose : undefined}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>

            {/* Header */}
            <div style={styles.header}>
              <span style={styles.headerTitle}>{cfg.title}</span>
              {/* Total count badge */}
              <span style={styles.countBadge}>
                {list.length} {entity} in DB
              </span>
              {!running && (
                <button onClick={handleClose} style={styles.closeBtn}>✕</button>
              )}
            </div>

            {/* Mode selector */}
            {!running && !done && (
              <div style={styles.body}>
                <p style={styles.desc}>Which data would you like to refresh?</p>

                <div style={styles.optionRow}>
                  {/* Option A — All */}
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

                  {/* Option B — One */}
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

                {/* Dropdown for single mode */}
                {mode === "one" && (
                  <select
                    value={selId}
                    onChange={(e) => setSelId(e.target.value)}
                    style={styles.select}
                  >
                    <option value="">{cfg.dropdown}</option>
                    {list.map((item) => (
                      <option key={item.id} value={item.id}>
                        #{item.id} — {item.name}
                      </option>
                    ))}
                  </select>
                )}

                {error && <div style={styles.errorBox}>⚠️ {error}</div>}

                <button
                  onClick={handleStart}
                  disabled={mode === "one" && !selId}
                  style={{
                    ...styles.startBtn,
                    ...(mode === "one" && !selId ? styles.startBtnDisabled : {}),
                  }}
                >
                  {mode === "all" ? cfg.startAll : cfg.startOne}
                </button>

                <p style={styles.warning}>
                  ⚠️ Scraping ke dauraan page band mat karein. Large datasets ke liye 10–15 minute lag sakte hain.
                </p>
              </div>
            )}

            {/* Live Log */}
            {(running || done || logs.length > 0) && (
              <div style={styles.logSection}>
                <div style={styles.logHeader}>
                  {running && <span style={styles.pulse}>●</span>}
                  {running ? " Scraping in progress..." : done ? "✅ Scraping Complete!" : "Log"}
                </div>
                <div ref={logBoxRef} style={styles.logBox}>
                  {logs.map((l, i) => (
                    <div key={i} style={styles.logLine}>
                      <span style={styles.logTime}>
                        {new Date(l.time).toLocaleTimeString("en-PK")}
                      </span>
                      <span style={logStyle(l.msg)}>{l.msg}</span>
                    </div>
                  ))}
                  {running && <div style={styles.blinkCursor}>▌</div>}
                </div>
                {done && (
                  <button onClick={handleClose} style={styles.doneBtn}>
                    ✓ okay, close
                  </button>
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

function logStyle(msg) {
  if (msg.includes("✅") || msg.includes("Done")) return { color: "#22c55e" };
  if (msg.includes("❌") || msg.includes("ERROR")) return { color: "#ef4444" };
  if (msg.includes("⏳"))                           return { color: "#f59e0b" };
  if (msg.includes("[Wiki]") || msg.includes("[WWF]") || msg.includes("[PTDC]") || msg.includes("[ADW]"))
    return { color: "#60a5fa" };
  return { color: "#e2e8f0" };
}

const styles = {
  triggerBtn: {
    background: "linear-gradient(135deg, #d97706, #92400e)",
    color: "#fff", border: "none", borderRadius: "8px",
    padding: "10px 20px", fontWeight: "600", fontSize: "14px",
    cursor: "pointer", display: "flex", alignItems: "center",
    gap: "8px", boxShadow: "0 2px 8px rgba(0,0,0,0.25)",
    transition: "opacity 0.2s", whiteSpace: "nowrap",
  },
  overlay: {
    position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(4px)", display: "flex",
    alignItems: "center", justifyContent: "center", zIndex: 9999,
  },
  modal: {
    background: "#1e293b", borderRadius: "16px",
    width: "min(640px, 95vw)", maxHeight: "85vh",
    overflow: "hidden", display: "flex", flexDirection: "column",
    boxShadow: "0 24px 60px rgba(0,0,0,0.5)", border: "1px solid #334155",
  },
  header: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "20px 24px", borderBottom: "1px solid #334155",
    background: "#0f172a", gap: "12px",
  },
  headerTitle: {
    fontSize: "18px", fontWeight: "700", color: "#f1f5f9",
    letterSpacing: "0.01em", flex: 1,
  },
  countBadge: {
    background: "#334155", color: "#94a3b8", fontSize: "12px",
    fontWeight: "600", padding: "4px 10px", borderRadius: "20px",
    whiteSpace: "nowrap",
  },
  closeBtn: {
    background: "none", border: "none", color: "#94a3b8",
    fontSize: "18px", cursor: "pointer", padding: "4px 8px",
    borderRadius: "6px",
  },
  body:       { padding: "24px", overflowY: "auto" },
  desc:       { color: "#94a3b8", marginBottom: "16px", fontSize: "14px" },
  optionRow:  { display: "flex", flexDirection: "column", gap: "12px", marginBottom: "20px" },
  option: {
    display: "flex", gap: "14px", alignItems: "flex-start",
    padding: "16px", borderRadius: "12px", border: "2px solid #334155",
    background: "#0f172a", cursor: "pointer",
    transition: "border-color 0.2s, background 0.2s",
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
    fontWeight: "700", fontSize: "15px", cursor: "pointer",
    marginBottom: "12px", transition: "opacity 0.2s",
  },
  startBtnDisabled: { opacity: 0.4, cursor: "not-allowed" },
  warning: { fontSize: "12px", color: "#64748b", textAlign: "center" },
  logSection: {
    display: "flex", flexDirection: "column",
    padding: "20px 24px", borderTop: "1px solid #334155",
    flex: 1, minHeight: 0,
  },
  logHeader: {
    fontSize: "14px", fontWeight: "600", color: "#94a3b8",
    marginBottom: "12px", display: "flex", alignItems: "center", gap: "6px",
  },
  pulse:     { color: "#22c55e" },
  logBox: {
    background: "#0a0f1a", borderRadius: "10px", padding: "14px",
    fontFamily: "'Fira Code', 'Courier New', monospace",
    fontSize: "12px", lineHeight: "1.6", overflowY: "auto",
    maxHeight: "260px", flex: 1, border: "1px solid #1e293b",
  },
  logLine:      { display: "flex", gap: "10px", marginBottom: "2px" },
  logTime:      { color: "#475569", flexShrink: 0, fontSize: "11px", paddingTop: "1px" },
  blinkCursor:  { color: "#d97706" },
  doneBtn: {
    marginTop: "16px", width: "100%", padding: "11px",
    background: "#166534", color: "#bbf7d0", border: "none",
    borderRadius: "8px", fontWeight: "600", fontSize: "14px", cursor: "pointer",
  },
  errorBox: {
    marginTop: "12px", background: "#450a0a",
    border: "1px solid #7f1d1d", borderRadius: "8px",
    padding: "12px", color: "#fca5a5", fontSize: "13px",
  },
};