import { useState, useEffect } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import "./bluesheep.css";
import "./shared-detail.css";
import Navbar from "./components/Navbar";

const Section = ({ title, children }) => (
  <div className="section-block">
    <h2 className="section-heading">{title}</h2>
    {children}
  </div>
);

export default function SpeciesDetail() {
  const { species } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isGuider = location.pathname.startsWith('/guider/');

  const [d, setD] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetch(`http://localhost:3000/api/species/${species}`)
      .then(res => res.json())
      .then(data => {
        setD(data.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [species]);

  useEffect(() => {
    if (!d) return;
    const saved = JSON.parse(localStorage.getItem("savedSpecies") || "[]");
    setIsSaved(saved.some(s => s.scientific_name === d.scientific_name));
  }, [d]);

  const showToast = (type) => {
    setToast(type);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSaveToggle = () => {
    const saved = JSON.parse(localStorage.getItem("savedSpecies") || "[]");
    if (isSaved) {
      const updated = saved.filter(s => s.scientific_name !== d.scientific_name);
      localStorage.setItem("savedSpecies", JSON.stringify(updated));
      setIsSaved(false);
      showToast("removed");
    } else {
      saved.push({ ...d, savedAt: new Date().toISOString() });
      localStorage.setItem("savedSpecies", JSON.stringify(saved));
      setIsSaved(true);
      showToast("saved");
    }
  };

  const handleDownloadPDF = async () => {
    showToast("downloading");

    const html2pdf = (await import("html2pdf.js")).default;

    const content = `
      <div style="font-family: Arial, sans-serif; padding: 32px; background: #fff; color: #222;">

        <div style="background: #8a7d2e; color: #fff; padding: 24px 28px; border-radius: 10px; margin-bottom: 24px;">
          <h1 style="margin: 0 0 4px; font-size: 28px;">${d.name}</h1>
          <p style="margin: 0 0 8px; font-size: 14px; opacity: 0.85;">${d.subtitle}</p>
          <p style="margin: 0; font-size: 13px; line-height: 1.6; opacity: 0.9;">${d.description}</p>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 16px; color: #8a7d2e; border-bottom: 2px solid #e0d9a0; padding-bottom: 6px; margin-bottom: 12px;">Basic Information</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 12px; background: #f9f7ed; border: 1px solid #e0d9a0; width: 50%;"><strong>Scientific Name:</strong> ${d.scientific_name}</td>
              <td style="padding: 8px 12px; background: #f9f7ed; border: 1px solid #e0d9a0; width: 50%;"><strong>Common Name:</strong> ${d.common_name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; background: #fff; border: 1px solid #e0d9a0;"><strong>Animal Type:</strong> ${d.animal_type}</td>
              <td style="padding: 8px 12px; background: #fff; border: 1px solid #e0d9a0;"><strong>Lifespan:</strong> ${d.lifespan}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 16px; color: #8a7d2e; border-bottom: 2px solid #e0d9a0; padding-bottom: 6px; margin-bottom: 12px;">Habitat & Distribution</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 12px; background: #f9f7ed; border: 1px solid #e0d9a0; width: 50%;"><strong>Found In:</strong> ${d.found_in}</td>
              <td style="padding: 8px 12px; background: #f9f7ed; border: 1px solid #e0d9a0; width: 50%;"><strong>Common Areas:</strong> ${d.common_areas}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; background: #fff; border: 1px solid #e0d9a0;"><strong>Habitat Type:</strong> ${d.habitat_type}</td>
              <td style="padding: 8px 12px; background: #fff; border: 1px solid #e0d9a0;"><strong>Climate:</strong> ${d.climate}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 16px; color: #8a7d2e; border-bottom: 2px solid #e0d9a0; padding-bottom: 6px; margin-bottom: 12px;">Hunting Information</h2>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 12px; background: #f9f7ed; border: 1px solid #e0d9a0; width: 50%;"><strong>Legal Status:</strong> ${d.legal_status}</td>
              <td style="padding: 8px 12px; background: #f9f7ed; border: 1px solid #e0d9a0; width: 50%;"><strong>Hunting Season:</strong> ${d.hunting_season}</td>
            </tr>
            <tr>
              <td style="padding: 8px 12px; background: #fff; border: 1px solid #e0d9a0;"><strong>Permit Required:</strong> ${d.permit_required}</td>
              <td style="padding: 8px 12px; background: #fff; border: 1px solid #e0d9a0;"><strong>Average Weight:</strong> ${d.average_weight}</td>
            </tr>
          </table>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 16px; color: #8a7d2e; border-bottom: 2px solid #e0d9a0; padding-bottom: 6px; margin-bottom: 12px;">Allowed Hunting Methods</h2>
          <div style="display: flex; gap: 8px; flex-wrap: wrap;">
            ${d.hunting_methods?.split(",").map(m => `<span style="background: #8a7d2e; color: #fff; padding: 5px 14px; border-radius: 20px; font-size: 13px; display: inline-block; margin: 4px;">${m.trim()}</span>`).join("")}
          </div>
        </div>

        <div style="margin-bottom: 20px;">
          <h2 style="font-size: 16px; color: #8a7d2e; border-bottom: 2px solid #e0d9a0; padding-bottom: 6px; margin-bottom: 12px;">Conservation Status</h2>
          <div style="background: #f0f7ec; border: 2px solid #4a7c2f; border-radius: 8px; padding: 12px 20px; display: inline-block; color: #2d5a1b; font-weight: 700; font-size: 16px;">
            ${d.conservation_status}
          </div>
        </div>

        <div style="text-align: center; margin-top: 32px; padding-top: 16px; border-top: 1px solid #e0d9a0; color: #aaa; font-size: 11px;">
          Wild Aura — Downloaded on ${new Date().toLocaleDateString("en-PK")}
        </div>
      </div>
    `;

    const element = document.createElement("div");
    element.innerHTML = content;

    const opt = {
      margin: 10,
      filename: `${d.name || "species"}.pdf`,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, background: "#ffffff" },
      jsPDF: { unit: "mm", format: "a4", orientation: "portrait" }
    };

    await html2pdf().set(opt).from(element).save();
    showToast("downloaded");
  };

  if (loading) return <h3 style={{ textAlign: "center", marginTop: "120px" }}>Loading...</h3>;
  if (!d) return <h3 style={{ textAlign: "center", marginTop: "120px" }}>Species not found</h3>;

  return (
    <>
      {!isGuider && <Navbar />}

      {toast && (
        <div style={{
          position: "fixed", top: "80px", right: "24px", zIndex: 9999,
          background: toast === "removed" ? "#c0392b" : toast === "downloading" ? "#8a7d2e" : "#4a7c2f",
          color: "#fff", padding: "12px 20px", borderRadius: "8px",
          fontSize: "14px", fontWeight: "500", boxShadow: "0 4px 12px rgba(0,0,0,0.2)"
        }}>
          {toast === "saved" && "✅ Species saved to your collection!"}
          {toast === "removed" && "🗑️ Removed from saved species."}
          {toast === "downloading" && "⏳ PDF downloading..."}
          {toast === "downloaded" && "📥 PDF downloaded!"}
        </div>
      )}

      <div className="sd-page bs-page">
        <div className="sd-container sdp-wrapper">

          <div className="sd-hero sdp-hero">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
              <button onClick={() => navigate(-1)} className="sd-back-btn">
                ← Back
              </button>
              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={handleSaveToggle}
                  style={{
                    padding: "8px 18px", borderRadius: "8px",
                    border: "2px solid #fff",
                    background: isSaved ? "#fff" : "transparent",
                    color: isSaved ? "#7a6a00" : "#fff",
                    fontWeight: "600", fontSize: "14px", cursor: "pointer",
                    display: "flex", alignItems: "center", gap: "6px",
                    transition: "all 0.2s ease"
                  }}
                >
                  {isSaved ? "🔖 Saved" : "🔖 Save"}
                </button>
                <button
                  onClick={handleDownloadPDF}
                  style={{
                    padding: "8px 18px", borderRadius: "8px",
                    border: "2px solid #fff", background: "transparent",
                    color: "#fff", fontWeight: "600", fontSize: "14px",
                    cursor: "pointer", display: "flex", alignItems: "center", gap: "6px"
                  }}
                >
                  📥 Download PDF
                </button>
              </div>
            </div>

            <h1 className="sdp-title" style={{ marginTop: "16px" }}>
              {d.name} <span className="sdp-title-sub">({d.subtitle})</span>
            </h1>
            <p className="sdp-desc">{d.description}</p>
          </div>

          <div className="sdp-body">

            <Section title="Basic Information">
              <div className="info-grid">
                <div className="info-cell"><span className="info-label">Scientific Name: </span><span className="info-value">{d.scientific_name}</span></div>
                <div className="info-cell"><span className="info-label">Common Name: </span><span className="info-value">{d.common_name}</span></div>
                <div className="info-cell"><span className="info-label">Animal Type: </span><span className="info-value">{d.animal_type}</span></div>
                <div className="info-cell"><span className="info-label">Average Lifespan: </span><span className="info-value">{d.lifespan}</span></div>
              </div>
            </Section>

            <Section title="Habitat & Distribution">
              <div className="info-grid">
                <div className="info-cell"><span className="info-label">Found In: </span><span className="info-value">{d.found_in}</span></div>
                <div className="info-cell"><span className="info-label">Common Areas: </span><span className="info-value">{d.common_areas}</span></div>
                <div className="info-cell"><span className="info-label">Habitat Type: </span><span className="info-value">{d.habitat_type}</span></div>
                <div className="info-cell"><span className="info-label">Climate: </span><span className="info-value">{d.climate}</span></div>
              </div>
            </Section>

            <Section title="Hunting Information">
              <div className="info-grid">
                <div className="info-cell"><span className="info-label">Legal Status: </span><span className="info-value">{d.legal_status}</span></div>
                <div className="info-cell"><span className="info-label">Hunting Season: </span><span className="info-value">{d.hunting_season}</span></div>
                <div className="info-cell"><span className="info-label">Permit Required: </span><span className="info-value">{d.permit_required}</span></div>
                <div className="info-cell"><span className="info-label">Average Weight: </span><span className="info-value">{d.average_weight}</span></div>
              </div>
            </Section>

            <Section title="Allowed Hunting Methods">
              <div className="badge-row">
                {d.hunting_methods?.split(",").map((m, i) => (
                  <span className="badge" key={i}>{m.trim()}</span>
                ))}
              </div>
            </Section>

            <Section title="Conservation Status">
              <div className="conservation-box">
                <span className="con-status">{d.conservation_status}</span>
              </div>
            </Section>

          </div>
        </div>
      </div>
    </>
  );
}