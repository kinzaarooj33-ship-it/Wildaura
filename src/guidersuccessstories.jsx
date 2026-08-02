import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./guidersuccessstories.css";

function GuiderSuccessStories() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [stories, setStories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [imagePreview, setImagePreview] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });
  const [confirmPopup, setConfirmPopup] = useState({ show: false, storyId: null });
  const [form, setForm] = useState({ title: "", description: "", location: "" });

  const user = JSON.parse(localStorage.getItem("user"));
  const userEmail = user?.email;

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000);
  };

  const fetchStories = async () => {
    setFetchLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/success-stories/${userEmail}`);
      const data = await res.json();
      setStories(data.stories || []);
    } catch {
      showToast("Could not load stories.", "error");
    } finally {
      setFetchLoading(false);
    }
  };

  useEffect(() => { if (userEmail) fetchStories(); }, []);

  const handleChange = (e) => setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) { showToast("Sirf image file select karein.", "error"); return; }
    if (file.size > 5 * 1024 * 1024) { showToast("Image 5MB se kam honi chahiye.", "error"); return; }
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.title.trim()) { showToast("Title required.", "error"); return; }
    if (!form.description.trim()) { showToast("Description required.", "error"); return; }
    if (!form.location.trim()) { showToast("Location required.", "error"); return; }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("email", userEmail);
      formData.append("title", form.title);
      formData.append("description", form.description);
      formData.append("location", form.location);
      if (fileInputRef.current?.files[0]) formData.append("image", fileInputRef.current.files[0]);

      const res = await fetch("http://localhost:3000/success-stories", { method: "POST", body: formData });
      const data = await res.json();

      if (res.ok) {
        showToast("Story uploaded successfully!");
        setForm({ title: "", description: "", location: "" });
        setImagePreview(null);
        if (fileInputRef.current) fileInputRef.current.value = "";
        setShowForm(false);
        fetchStories();
      } else {
        showToast(data.message || "Error occurred.", "error");
      }
    } catch {
      showToast("Server error. Try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (id) => setConfirmPopup({ show: true, storyId: id });

  const handleConfirmDelete = async () => {
    const id = confirmPopup.storyId;
    setConfirmPopup({ show: false, storyId: null });
    try {
      const res = await fetch(`http://localhost:3000/success-stories/${id}`, { method: "DELETE" });
      if (res.ok) { showToast("Story deleted."); fetchStories(); }
      else showToast("Could not delete.", "error");
    } catch {
      showToast("Server error.", "error");
    }
  };

  return (
    <div className="ss-page">
      {toast.show && <div className={`ss-toast ${toast.type}`}>{toast.message}</div>}

      {/* CONFIRM DELETE POPUP */}
      {confirmPopup.show && (
        <div className="ss-confirm-overlay">
          <div className="ss-confirm-box">
            <div className="ss-confirm-icon">🗑️</div>
            <h3 className="ss-confirm-title">Delete Story?</h3>
            <p className="ss-confirm-msg">Are you sure? This cannot be undone.</p>
            <div className="ss-confirm-btns">
              <button className="ss-confirm-yes" onClick={handleConfirmDelete}>Yes, Delete</button>
              <button className="ss-confirm-no" onClick={() => setConfirmPopup({ show: false, storyId: null })}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <div className="ss-header">
        <h1 className="ss-title">🏆 My Success Stories</h1>
        <button className="ss-add-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? "✕ Cancel" : "+ Add Story"}
        </button>
      </div>

      {/* UPLOAD FORM — show karo */}
      {showForm && (
        <div className="ss-form-card">
          <h2 className="ss-form-title">📝 Share Your Story</h2>
          <form onSubmit={handleSubmit}>
            <div className="ss-form-grid">
              <div className="ss-field">
                <label>Title</label>
                <input type="text" name="title" placeholder="e.g. Guided a Trophy Hunt in GB" value={form.title} onChange={handleChange} />
              </div>
              <div className="ss-field">
                <label>Location</label>
                <input type="text" name="location" placeholder="e.g. Gilgit-Baltistan" value={form.location} onChange={handleChange} />
              </div>
              <div className="ss-field ss-full">
                <label>Description</label>
                <textarea name="description" rows={4} placeholder="Tell the story of your successful hunt or tour..." value={form.description} onChange={handleChange} />
              </div>
              <div className="ss-field ss-full">
                <label>Photo (Optional)</label>
                <div className="ss-image-upload" onClick={() => fileInputRef.current?.click()}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="preview" className="ss-img-preview" />
                  ) : (
                    <div className="ss-upload-placeholder">
                      <span style={{ fontSize: 36 }}>📷</span>
                      <p>Click to upload photo</p>
                      <span style={{ fontSize: 12, color: "#c0c0c0" }}>Max 5MB</span>
                    </div>
                  )}
                </div>
                <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageChange} style={{ display: "none" }} />
              </div>
            </div>
            <button type="submit" className="ss-submit-btn" disabled={loading}>
              {loading ? "⏳ Uploading..." : "📤 Upload Story"}
            </button>
          </form>
        </div>
      )}

      {/* STORIES LIST — sirf tab dikhe jab form band ho */}
      {!showForm && (
        fetchLoading ? (
          <div className="ss-loading">
            <span style={{ fontSize: 36 }}>⏳</span>
            <p>Loading stories...</p>
          </div>
        ) : stories.length === 0 ? (
          <div className="ss-empty">
            <span style={{ fontSize: 56 }}>🏕️</span>
            <h3>No Stories Yet</h3>
            <p>Share your first hunting success story!</p>
          </div>
        ) : (
          <div className="ss-grid">
            {stories.map(story => (
              <div key={story.id} className="ss-card">
                {story.image ? (
                  <img src={`http://localhost:3000/uploads/${story.image}`} alt={story.title} className="ss-card-img" />
                ) : (
                  <div className="ss-card-no-img">🏆</div>
                )}
                <div className="ss-card-body">
                  <div className="ss-card-meta">
                    <span className="ss-location">📍 {story.location}</span>
                    <span className="ss-date">
                      {new Date(story.created_at).toLocaleDateString("en-PK", {
                        year: "numeric", month: "short", day: "numeric"
                      })}
                    </span>
                  </div>
                  <h3 className="ss-card-title">{story.title}</h3>
                  <p className="ss-card-desc">{story.description}</p>
                  <button className="ss-delete-btn" onClick={() => handleDeleteClick(story.id)}>
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
}

export default GuiderSuccessStories;