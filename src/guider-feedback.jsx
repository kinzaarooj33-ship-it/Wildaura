import { useState, useEffect } from "react";
import "./guider-feedback.css";

function GuiderFeedback() {
  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [replyText, setReplyText] = useState({});
  const [replyLoading, setReplyLoading] = useState({});
  const [editingReply, setEditingReply] = useState(null); // { feedbackId, replyId, text }
  const [addingReplyId, setAddingReplyId] = useState(null);
  const [toast, setToast] = useState({ show: false, message: "", type: "" });

  const user = JSON.parse(localStorage.getItem("user"));
  const userEmail = user?.email;

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "" }), 4000);
  };

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/feedback/${userEmail}`);
      const data = await res.json();
      setFeedbacks(data.feedbacks || []);
    } catch {
      showToast("❌ Could not load feedback.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!userEmail) return;
    fetchFeedbacks();
    fetch(`http://localhost:3000/api/feedback/seen/${userEmail}`, { method: "PUT" }).catch(() => {});
  }, []);

  // ===== ADD NEW REPLY =====
  const handleAddReply = async (feedbackId) => {
    const reply = replyText[feedbackId]?.trim();
    if (!reply) { showToast("❌ Reply cannot be empty.", "error"); return; }

    setReplyLoading(prev => ({ ...prev, [feedbackId]: true }));
    try {
      const res = await fetch(`http://localhost:3000/api/feedback/reply/${feedbackId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply, guider_email: userEmail }),
      });
      if (res.ok) {
        showToast("✅ Reply sent!");
        setReplyText(prev => ({ ...prev, [feedbackId]: "" }));
        setAddingReplyId(null);
        fetchFeedbacks();
      } else {
        showToast("❌ Error sending reply.", "error");
      }
    } catch {
      showToast("❌ Server error.", "error");
    } finally {
      setReplyLoading(prev => ({ ...prev, [feedbackId]: false }));
    }
  };

  // ===== EDIT EXISTING REPLY =====
  const handleEditReply = async (replyId, feedbackId) => {
    const reply = editingReply?.text?.trim();
    if (!reply) { showToast("❌ Reply cannot be empty.", "error"); return; }

    setReplyLoading(prev => ({ ...prev, [feedbackId]: true }));
    try {
      const res = await fetch(`http://localhost:3000/api/feedback/reply/edit/${replyId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reply }),
      });
      if (res.ok) {
        showToast("✅ Reply updated!");
        setEditingReply(null);
        fetchFeedbacks();
      } else {
        showToast("❌ Error updating reply.", "error");
      }
    } catch {
      showToast("❌ Server error.", "error");
    } finally {
      setReplyLoading(prev => ({ ...prev, [feedbackId]: false }));
    }
  };

  // ===== DELETE REPLY =====
  const handleDeleteReply = async (replyId, feedbackId) => {
    if (!window.confirm("Delete this reply?")) return;
    try {
      await fetch(`http://localhost:3000/api/feedback/reply/${replyId}`, { method: "DELETE" });
      showToast("🗑️ Reply deleted.");
      fetchFeedbacks();
    } catch {
      showToast("❌ Could not delete.", "error");
    }
  };

  const renderStars = (rating) =>
    Array.from({ length: 5 }, (_, i) => (
      <span key={i} className={i < rating ? "fb-star filled" : "fb-star"}>★</span>
    ));

  const formatTime = (iso) => {
    if (!iso) return "";
    return new Date(iso).toLocaleString("en-PK", {
      day: "numeric", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
  };

  return (
    <div className="fb-page">
      {toast.show && (
        <div className={`fb-toast ${toast.type}`}>{toast.message}</div>
      )}

      <div className="fb-header">
        <h1 className="fb-title">💬 Hunter Feedback</h1>
        <p className="fb-subtitle">Reviews hunters have left for you</p>
      </div>

      {loading ? (
        <div className="fb-loading">Loading feedback...</div>
      ) : feedbacks.length === 0 ? (
        <div className="fb-empty">
          <span style={{ fontSize: 48 }}>📭</span>
          <p>No feedback received yet.</p>
        </div>
      ) : (
        <div className="fb-list">
          {feedbacks.map(fb => {
            const replies = fb.replies || [];
            const hasReplies = replies.length > 0;

            return (
              <div key={fb.id} className="fb-card">

                {/* TOP ROW */}
                <div className="fb-card-top">
                  <div className="fb-hunter-info">
                    <div className="fb-avatar">
                      {(fb.from_name || fb.from_email || "H")[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="fb-hunter-name">{fb.from_name || fb.from_email}</div>
                      <div className="fb-date">
                        {new Date(fb.created_at).toLocaleDateString("en-PK", {
                          year: "numeric", month: "short", day: "numeric"
                        })}
                      </div>
                    </div>
                  </div>
                  <div className="fb-stars">{renderStars(fb.rating)}</div>
                </div>

                {/* COMMENT */}
                <p className="fb-review-text">{fb.comment}</p>

                {/* ===== ALL REPLIES ===== */}
                {hasReplies && (
                  <div className="fb-replies-section">
                    <div className="fb-replies-label">YOUR REPLIES ({replies.length})</div>

                    {replies.map((r, idx) => (
                      <div key={r.id} className="fb-reply-item">
                        {editingReply?.replyId === r.id ? (
                          // ── Edit mode ──
                          <div className="fb-edit-box">
                            <textarea
                              className="fb-reply-input"
                              rows={2}
                              value={editingReply.text}
                              onChange={(e) => setEditingReply(prev => ({ ...prev, text: e.target.value }))}
                              autoFocus
                            />
                            <div className="fb-edit-actions">
                              <button
                                className="fb-reply-btn"
                                onClick={() => handleEditReply(r.id, fb.id)}
                                disabled={replyLoading[fb.id]}
                              >
                                {replyLoading[fb.id] ? "Saving..." : "Update"}
                              </button>
                              <button className="fb-cancel-btn" onClick={() => setEditingReply(null)}>
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          // ── View mode ──
                          <>
                            <div className="fb-reply-item-header">
                              <span className="fb-reply-num">Reply {idx + 1}</span>
                              {r.created_at && (
                                <span className="fb-reply-time">{formatTime(r.created_at)}</span>
                              )}
                              <div className="fb-reply-actions">
                                <button
                                  className="fb-edit-icon-btn"
                                  title="Edit"
                                  onClick={() => setEditingReply({ replyId: r.id, feedbackId: fb.id, text: r.reply })}
                                >✏️</button>
                                <button
                                  className="fb-delete-icon-btn"
                                  title="Delete"
                                  onClick={() => handleDeleteReply(r.id, fb.id)}
                                >🗑️</button>
                              </div>
                            </div>
                            <p className="fb-reply-text">{r.reply}</p>
                          </>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* ===== ADD REPLY BOX ===== */}
                {addingReplyId === fb.id ? (
                  <div className="fb-edit-box" style={{ marginTop: 12 }}>
                    <textarea
                      className="fb-reply-input"
                      rows={2}
                      placeholder="Write your reply..."
                      value={replyText[fb.id] || ""}
                      onChange={(e) => setReplyText(prev => ({ ...prev, [fb.id]: e.target.value }))}
                      autoFocus
                    />
                    <div className="fb-edit-actions">
                      <button
                        className="fb-reply-btn"
                        onClick={() => handleAddReply(fb.id)}
                        disabled={replyLoading[fb.id]}
                      >
                        {replyLoading[fb.id] ? "Sending..." : "Send Reply"}
                      </button>
                      <button
                        className="fb-cancel-btn"
                        onClick={() => { setAddingReplyId(null); setReplyText(prev => ({ ...prev, [fb.id]: "" })); }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  // "+" button — pehli reply ya additional reply dono k liye
                  <button
                    className="fb-add-reply-btn"
                    onClick={() => {
                      setAddingReplyId(fb.id);
                      setEditingReply(null);
                    }}
                  >
                    {hasReplies ? "+ Add Another Reply" : "+ Add Reply"}
                  </button>
                )}

              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default GuiderFeedback;