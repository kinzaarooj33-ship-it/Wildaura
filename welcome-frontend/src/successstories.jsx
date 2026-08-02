import { useState, useEffect } from "react";
import "./successstories.css";
import Navbar from "./components/Navbar";
import { useNavigate } from "react-router-dom";
const BACKEND_URL = "http://localhost:3000";

export default function SuccessStories() {

  const [stories, setStories] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [validationMsg, setValidationMsg] = useState("");
  const [validationStatus, setValidationStatus] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const [huntingAreas, setHuntingAreas] = useState([]);
  const [species, setSpecies] = useState([]);

  const [editingStory, setEditingStory] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", location: "", trophy: "", description: "" });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [editMsg, setEditMsg] = useState("");
  const [editMsgStatus, setEditMsgStatus] = useState("");

  const currentUser = JSON.parse(localStorage.getItem("user"));

  const [form, setForm] = useState({
    title: "", location: "", trophy: "", description: "", image: null,
  });

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/success-stories`)
      .then((res) => res.json())
      .then((data) => {
        if (data.success) {
          const formattedStories = data.stories.map((s) => ({
            ...s,
            date: s.created_at
              ? new Date(s.created_at).toLocaleDateString("en-PK", {
                  month: "long", year: "numeric",
                })
              : "Recently",
          }));
          setStories(formattedStories);
        }
        setLoading(false);
      })
      .catch((err) => { console.log("❌ Fetch error:", err); setLoading(false); });
  }, []);

  useEffect(() => {
  fetch(`${BACKEND_URL}/api/hunting-areas`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setHuntingAreas(data);
        else if (data.data) setHuntingAreas(data.data);
        else if (data.areas) setHuntingAreas(data.areas);
      })
      .catch((err) => console.log("❌ Areas error:", err));
  }, []);

  useEffect(() => {
    fetch(`${BACKEND_URL}/api/species`)
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setSpecies(data);
        else if (data.data) setSpecies(data.data);
        else if (data.species) setSpecies(data.species);
      })
      .catch((err) => console.log("❌ Species error:", err));
  }, []);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "title") {
      const lettersOnly = value.replace(/[^a-zA-Z\s\u0600-\u06FF]/g, "");
      setForm({ ...form, title: lettersOnly });
      setValidationMsg("");
      return;
    }

    setForm({ ...form, [name]: files ? files[0] : value });
    setValidationMsg("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title || !form.location || !form.description) {
      setValidationMsg("Fill all required fields.");
      setValidationStatus("error");
      return;
    }

    setSubmitting(true);
    setValidationStatus("pending");
    setValidationMsg("Submitting your story...");

    try {
      const formData = new FormData();
      formData.append("guider_email", currentUser?.email || "");
      formData.append("title", form.title);
      formData.append("location", form.location);
      formData.append("trophy", form.trophy);
      formData.append("description", form.description);
      if (form.image) formData.append("image", form.image);

      const res = await fetch(`${BACKEND_URL}/api/success-stories/submit`, {
        method: "POST", body: formData,
      });
      const data = await res.json();

      if (data.success) {
        setValidationMsg("✅ Story submitted successfully!");
        setValidationStatus("success");

        const newStory = {
          id: data.story?.id || Date.now(),
          ...form,
          guider_email: currentUser?.email || "",
          hunter_name: currentUser?.name || currentUser?.email || "",
          image: form.image ? URL.createObjectURL(form.image) : null,
          date: new Date().toLocaleDateString("en-PK", { month: "long", year: "numeric" }),
        };

        setStories((prev) => [newStory, ...prev]);
        setForm({ title: "", location: "", trophy: "", description: "", image: null });

        setTimeout(() => {
          setShowForm(false);
          setValidationMsg("");
          setValidationStatus("");
        }, 2000);
      } else {
        setValidationMsg(`❌ ${data.message}`);
        setValidationStatus("error");
      }
    } catch (err) {
      console.log(err);
      setValidationMsg("Server error. Please try again later.");
      setValidationStatus("error");
    } finally {
      setSubmitting(false);
    }
  };

  const openEdit = (s) => {
    setEditingStory(s);
    setEditForm({ title: s.title || "", location: s.location || "", trophy: s.trophy || "", description: s.description || "" });
    setEditMsg(""); setEditMsgStatus("");
  };

  const handleEditChange = (e) => {
    const { name, value } = e.target;

    if (name === "title") {
      const lettersOnly = value.replace(/[^a-zA-Z\s\u0600-\u06FF]/g, "");
      setEditForm({ ...editForm, title: lettersOnly });
      setEditMsg("");
      return;
    }

    setEditForm({ ...editForm, [name]: value });
    setEditMsg("");
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();

    if (!editForm.title || !editForm.location || !editForm.description) {
      setEditMsg("Fill all required fields."); setEditMsgStatus("error"); return;
    }

    setEditSubmitting(true); setEditMsgStatus("pending"); setEditMsg("Updating your story...");

    try {
      const res = await fetch(`${BACKEND_URL}/api/success-stories/${editingStory.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guider_email: currentUser?.email || "", ...editForm }),
      });
      const data = await res.json();

      if (data.success) {
        setEditMsg("✅ Story updated successfully!"); setEditMsgStatus("success");
        setStories((prev) => prev.map((s) => s.id === editingStory.id ? { ...s, ...editForm } : s));
        setTimeout(() => { setEditingStory(null); setEditMsg(""); setEditMsgStatus(""); }, 1500);
      } else {
        setEditMsg(`❌ ${data.message}`); setEditMsgStatus("error");
      }
    } catch (err) {
      console.log(err); setEditMsg("Server error."); setEditMsgStatus("error");
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleDelete = async (storyId) => {
    if (!window.confirm("Are you sure you want to delete this story?")) return;

    try {
      const res = await fetch(`${BACKEND_URL}/api/success-stories/${storyId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guider_email: currentUser?.email || "" }),
      });
      const data = await res.json();

      if (data.success) {
        setStories((prev) => prev.filter((s) => s.id !== storyId));
      } else {
        alert(`❌ ${data.message}`);
      }
    } catch (err) {
      console.log(err); alert("Server error. Could not delete story.");
    }
  };

  return (
    <div className="ss-page">
      <Navbar />
      <button className="ss-back-btn" onClick={() => window.history.back()}>← Back</button>

      <div className="ss-hero">
        <div className="ss-hero-overlay" />
        <div className="ss-hero-content">
          <span className="ss-badge">🏆 Hunter's Chronicles</span>
          <h1 className="ss-hero-title">Success Stories</h1>
          <p className="ss-hero-sub">Hunter's real experiences shared by our community.</p>
          <button className="ss-share-btn" onClick={() => setShowForm(true)}>+ Share Your Story</button>
        </div>
      </div>

      <div className="ss-stats-bar">
        <div className="ss-stat">
          <span className="ss-stat-num">{stories.length}+</span>
          <span className="ss-stat-label">Successful Hunts</span>
        </div>
        <div className="ss-stat-divider" />
        <div className="ss-stat">
          <span className="ss-stat-num">24+</span>
          <span className="ss-stat-label">Areas</span>
        </div>
        <div className="ss-stat-divider" />
        <div className="ss-stat">
          <span className="ss-stat-num">100%</span>
          <span className="ss-stat-label">Verified Stories</span>
        </div>
      </div>

      <div className="ss-container">
        {loading ? (
          <div className="ss-loading">Loading stories...</div>
        ) : stories.length === 0 ? (
          <div className="ss-loading">No stories available yet.</div>
        ) : (
          <div className="ss-grid">
            {stories.map((s) => (
              <div key={s.id} className={`ss-card ${expandedId === s.id ? "expanded" : ""}`}>
                <div className="ss-card-header">
                  <div className="ss-avatar" onClick={() => navigate('/my-profile')} style={{ cursor: 'pointer' }}>
                    {(s.hunter_name || s.guider_email || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="ss-card-meta">
                    <h3 className="ss-card-name">{s.hunter_name || s.guider_email || "Unknown Hunter"}</h3>
                    <span className="ss-card-area">📍 {s.location}</span>
                  </div>
                  <div className="ss-verified-badge" title="Verified Story">✓</div>
                </div>

                <h4 className="ss-story-title">{s.title}</h4>

                {s.trophy && <div className="ss-trophy-tag">🎯 {s.trophy}</div>}

                {s.image && (
                  <img
                    src={s.image.startsWith("/uploads") ? `${BACKEND_URL}${s.image}` : s.image}
                    alt="story" className="ss-story-image"
                  />
                )}

                <p className={`ss-card-story ${expandedId === s.id ? "full" : ""}`}>{s.description}</p>

                <div className="ss-card-footer">
                  <span className="ss-card-date">📅 {s.date || "Recently"}</span>
                  <button className="ss-read-more" onClick={() => setExpandedId(expandedId === s.id ? null : s.id)}>
                    {expandedId === s.id ? "See less ▲" : "See more ▼"}
                  </button>
                </div>

                {currentUser?.email && currentUser.email === s.guider_email && (
                  <div className="ss-owner-actions">
                    <button className="ss-edit-btn" onClick={() => openEdit(s)}>✏️ Edit</button>
                    <button className="ss-delete-btn" onClick={() => handleDelete(s.id)}>🗑️ Delete</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <div className="ss-modal-overlay" onClick={(e) => { if (e.target.className === "ss-modal-overlay") setShowForm(false); }}>
          <div className="ss-modal">
            <button className="ss-modal-close" onClick={() => setShowForm(false)}>✕</button>
            <div className="ss-modal-header">
              <span className="ss-modal-icon">🦅</span>
              <h2>Share Your Hunting Story</h2>
            </div>

            <form className="ss-form" onSubmit={handleSubmit}>
              <div className="ss-form-row">
                <div className="ss-form-group">
                  <label>Title *</label>
                  <input
                    type="text"
                    name="title"
                    placeholder="like: First Markhor Hunt"
                    value={form.title}
                    onChange={handleChange}
                    disabled={submitting}
                  />
                  <small style={{ color: "#999", fontSize: "11px" }}>
                    Only letters allowed, no numbers
                  </small>
                </div>

                <div className="ss-form-group">
                  <label>Hunting Area *</label>
                  <select
                    name="location"
                    value={form.location}
                    onChange={handleChange}
                    disabled={submitting}
                    style={{
                      width: "100%", padding: "10px 12px",
                      borderRadius: "8px", border: "1px solid #ddd",
                      fontSize: "14px", background: "#fff",
                      color: form.location ? "#1a1a1a" : "#999",
                      cursor: "pointer"
                    }}
                  >
                    <option value="">-- Select Hunting Area --</option>
                    {huntingAreas.map((area) => (
                      <option key={area.id} value={area.name}>
                        {area.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ss-form-group">
                <label>Hunting Trophy (Optional)</label>
                <select
                  name="trophy"
                  value={form.trophy}
                  onChange={handleChange}
                  disabled={submitting}
                  style={{
                    width: "100%", padding: "10px 12px",
                    borderRadius: "8px", border: "1px solid #ddd",
                    fontSize: "14px", background: "#fff",
                    color: form.trophy ? "#1a1a1a" : "#999",
                    cursor: "pointer"
                  }}
                >
                  <option value="">-- Select Trophy Species --</option>
                  {species.map((sp) => (
                    <option key={sp.id} value={sp.name}>
                      {sp.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="ss-form-group">
                <label>Your Story *</label>
                <textarea
                  name="description" rows={5}
                  placeholder="Share your hunting experience..."
                  value={form.description} onChange={handleChange} disabled={submitting}
                />
                <span className="ss-char-count">{form.description.length} / 1000</span>
              </div>

              <div className="ss-form-group">
                <label>Upload Hunting Image</label>
                <input type="file" name="image" accept="image/*" onChange={handleChange} disabled={submitting} />
              </div>

              {form.image && (
                <img src={URL.createObjectURL(form.image)} alt="preview" className="ss-story-image" />
              )}

              {validationMsg && (
                <div className={`ss-validation-msg ${validationStatus}`}>
                  {validationStatus === "pending" && <span className="ss-spinner" />}
                  {validationMsg}
                </div>
              )}

              <div className="ss-form-actions">
                <button type="button" className="ss-cancel-btn" onClick={() => setShowForm(false)} disabled={submitting}>
                  Cancel
                </button>
                <button type="submit" className="ss-submit-btn" disabled={submitting}>
                  {submitting ? "Validating..." : "Submit Story 🚀"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {editingStory && (
        <div className="ss-modal-overlay" onClick={(e) => { if (e.target.className === "ss-modal-overlay") setEditingStory(null); }}>
          <div className="ss-modal">
            <button className="ss-modal-close" onClick={() => setEditingStory(null)}>✕</button>
            <div className="ss-modal-header">
              <span className="ss-modal-icon">✏️</span>
              <h2>Edit Your Story</h2>
            </div>

            <form className="ss-form" onSubmit={handleEditSubmit}>
              <div className="ss-form-row">
                <div className="ss-form-group">
                  <label>Title *</label>
                  <input
                    type="text" name="title"
                    value={editForm.title} onChange={handleEditChange} disabled={editSubmitting}
                  />
                  <small style={{ color: "#999", fontSize: "11px" }}>Only letters allowed</small>
                </div>

                <div className="ss-form-group">
                  <label>Hunting Area *</label>
                  <select
                    name="location"
                    value={editForm.location}
                    onChange={handleEditChange}
                    disabled={editSubmitting}
                    style={{
                      width: "100%", padding: "10px 12px",
                      borderRadius: "8px", border: "1px solid #ddd",
                      fontSize: "14px", background: "#fff", cursor: "pointer"
                    }}
                  >
                    <option value="">-- Select Hunting Area --</option>
                    {huntingAreas.map((area) => (
                      <option key={area.id} value={area.name}>{area.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="ss-form-group">
                <label>Hunting Trophy (Optional)</label>
                <select
                  name="trophy"
                  value={editForm.trophy}
                  onChange={handleEditChange}
                  disabled={editSubmitting}
                  style={{
                    width: "100%", padding: "10px 12px",
                    borderRadius: "8px", border: "1px solid #ddd",
                    fontSize: "14px", background: "#fff", cursor: "pointer"
                  }}
                >
                  <option value="">-- Select Trophy Species --</option>
                  {species.map((sp) => (
                    <option key={sp.id} value={sp.name}>{sp.name}</option>
                  ))}
                </select>
              </div>

              <div className="ss-form-group">
                <label>Your Story *</label>
                <textarea
                  name="description" rows={5}
                  value={editForm.description} onChange={handleEditChange} disabled={editSubmitting}
                />
                <span className="ss-char-count">{editForm.description.length} / 1000</span>
              </div>

              {editMsg && (
                <div className={`ss-validation-msg ${editMsgStatus}`}>
                  {editMsgStatus === "pending" && <span className="ss-spinner" />}
                  {editMsg}
                </div>
              )}

              <div className="ss-form-actions">
                <button type="button" className="ss-cancel-btn" onClick={() => setEditingStory(null)} disabled={editSubmitting}>
                  Cancel
                </button>
                <button type="submit" className="ss-submit-btn" disabled={editSubmitting}>
                  {editSubmitting ? "Saving..." : "Save Changes ✅"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}