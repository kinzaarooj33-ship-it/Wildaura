import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import "./huntinglaws.css";
import "./shared-detail.css";
import Navbar from "./components/Navbar";

function HuntingLaws() {
  const [laws, setLaws] = useState([]);
  const [filter, setFilter] = useState("All");
  const [search, setSearch] = useState("");

  const navigate = useNavigate();
  const location = useLocation();
  const isGuider = location.pathname.startsWith('/guider/');

  useEffect(() => {
    fetch("http://localhost:3000/api/laws")
      .then((res) => res.json())
      .then((data) => setLaws(data))
      .catch((err) => console.log("Error:", err.message));
  }, []);

  const filteredLaws = laws.filter((law) => {
    const matchFilter = filter === "All" || law.category === filter;
    const matchSearch = law.title.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const goToAct = (id) => {
    navigate(isGuider ? `/guider/act/${id}` : `/act/${id}`);
  };

  return (
    <>
      {!isGuider && <Navbar />}
      <div className="sd-page">
        <div className="sd-container">

          {/* ── HEADER ── */}
          <div className="sd-hero">
            <button className="sd-back-btn" onClick={() => navigate(-1)}>
              ← Back
            </button>
            <div className="laws-header-icon">⚖</div>
            <h1 style={{ fontSize: "2rem", fontWeight: 700, margin: "0 0 4px" }}>
              Hunting Laws
            </h1>
            <p style={{ margin: "0 0 12px", opacity: 0.75 }}>
              Pakistan — Wildlife Regulations
            </p>

            <div className="laws-badge-row">
              <span className="laws-badge" onClick={() => goToAct(1)}>Punjab Wildlife Act 2025</span>
              <span className="laws-badge" onClick={() => goToAct(2)}>Islamabad Wildlife Act 2024</span>
              <span className="laws-badge" onClick={() => goToAct(3)}>Punjab Protected Areas Act 2020</span>
              <span className="laws-badge" onClick={() => goToAct(4)}>KP Wildlife Act 2015</span>
            </div>
          </div>

          {/* ── SUMMARY ── */}
          <div className="laws-summary-row">
            <div className="laws-stat-card">
              <div className="laws-stat-num">4</div>
              <div>Provincial Acts</div>
            </div>
            <div className="laws-stat-card">
              <div className="laws-stat-num">{laws.length}+</div>
              <div>Total Laws</div>
            </div>
          </div>

          {/* ── SEARCH ── */}
          <div className="laws-search-bar">
            <input
              type="text"
              placeholder="Search laws..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* ── FILTER CHIPS ── */}
          <div className="laws-filter-row">
            {["All", "Prohibited", "License", "Seasonal", "Special Permit"].map((f) => (
              <span
                key={f}
                className={"laws-filter-chip" + (filter === f ? " active" : "")}
                onClick={() => setFilter(f)}
              >
                {f}
              </span>
            ))}
          </div>

          {/* ── LAW CARDS ── */}
          {filteredLaws.map((law) => (
            <div className="law-card" key={law.id}>
              <div className="law-card-header">
                <span className="law-title">{law.title}</span>
                <span className={getTagClass(law.category)}>{law.category}</span>
              </div>
              <div className="law-desc">{law.description}</div>
              <div className="law-footer">
                <span className="footer-label">{law.footerLabel}: </span>
                <span className="footer-val">{law.footerValue}</span>
              </div>
              <div className="act-ref">{law.reference}</div>
            </div>
          ))}

        </div>
      </div>
    </>
  );
}

function getTagClass(type) {
  switch (type) {
    case "Prohibited":     return "tag-prohibited";
    case "License":        return "tag-license";
    case "Seasonal":       return "tag-seasonal";
    case "Special Permit": return "tag-special";
    default:               return "";
  }
}

export default HuntingLaws;