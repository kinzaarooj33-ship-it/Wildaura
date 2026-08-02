import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import "./feedback.css";

function Feedback() {
  const navigate    = useNavigate();
  const location     = useLocation();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");

  const feedbackTarget = location.state?.to_email
    ? {
        to_email: location.state.to_email,
        to_name: location.state.to_name,
        to_role: location.state.to_role || "guider",
      }
    : null;

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState("");

  const [rating, setRating]   = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitMsg, setSubmitMsg]   = useState("");
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted]   = useState(false);

  useEffect(() => {
    if (feedbackTarget) return;
    if (!currentUser.email) return;
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    setLoading(true);
    try {
      const res  = await fetch(`http://localhost:3000/api/feedback/hunter/${currentUser.email}`);
      const data = await res.json();
      if (res.ok) setFeedbacks(data.feedbacks || []);
      else        setError("Could not load feedbacks.");
    } catch {
      setError("Could not connect to server.");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (r) =>
    [1, 2, 3, 4, 5].map((s) => (
      <span key={s} className={`fb-star ${s <= r ? "active" : ""}`}>★</span>
    ));

  const formatDate = (ts) =>
    new Date(ts).toLocaleString("en-PK", {
      month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });

  const handleSubmitFeedback = async (e) => {
    e.preventDefault();
    setSubmitMsg("");
    setSubmitError("");

    if (rating === 0) {
      setSubmitError("❌ Please select a star rating.");
      return;
    }
    if (!comment.trim()) {
      setSubmitError("❌ Please write a comment.");
      return;
    }
    if (!currentUser.email) {
      setSubmitError("❌ Please login first.");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("http://localhost:3000/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from_email: currentUser.email,
          from_name: currentUser.name || currentUser.email,
          to_email: feedbackTarget.to_email,
          to_name: feedbackTarget.to_name,
          to_role: feedbackTarget.to_role,
          rating,
          comment,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setSubmitMsg("✅ Feedback submitted successfully!");
        setSubmitted(true);
      } else {
        setSubmitError("❌ " + (data.message || "Could not submit feedback."));
      }
    } catch {
      setSubmitError("❌ Server not responding. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  // ════════════════════════════════════════════════════
  // FORM MODE
  // ════════════════════════════════════════════════════
  if (feedbackTarget) {
    return (
      <>
        <Navbar />
        <div className="fb-page">
          <div className="fb-container">
            <div className="fb-outer-box">
              <div className="fb-page-header">
                <span className="fb-header-icon">📝</span>
                <h2>Give Feedback</h2>
                <p>Share your experience with <strong>{feedbackTarget.to_name || feedbackTarget.to_email}</strong></p>
              </div>

              {submitted ? (
                <div className="fb-empty">
                  <span className="fb-success-icon">✅</span>
                  <p>{submitMsg}</p>
                  <button
                    className="fb-submit-btn fb-view-btn"
                    onClick={() => navigate("/feedback")}
                  >
                    View My Feedbacks
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmitFeedback} className="fb-form">

                  {/* Star Rating */}
                  <div className="fb-rating-wrapper">
                    <label className="fb-label">Your Rating</label>
                    <div className="fb-interactive-stars">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <span
                          key={s}
                          onClick={() => setRating(s)}
                          onMouseEnter={() => setHoverRating(s)}
                          onMouseLeave={() => setHoverRating(0)}
                          className={`fb-star ${(hoverRating || rating) >= s ? "active" : ""}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Comment */}
                  <div className="fb-comment-wrapper">
                    <label className="fb-label">Your Comment</label>
                    <textarea
                      rows={5}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      placeholder="Tell us about your experience with this guider..."
                      className="fb-textarea"
                    />
                  </div>

                  {submitError && (
                    <div className="fb-msg error">{submitError}</div>
                  )}

                  <div className="fb-form-actions">
                    <button
                      type="submit"
                      className="fb-submit-btn"
                      disabled={submitting}
                    >
                      {submitting ? "Submitting..." : "Submit Feedback"}
                    </button>
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className="fb-cancel-btn"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </>
    );
  }

  // ════════════════════════════════════════════════════
  // LIST MODE
  // ════════════════════════════════════════════════════
  return (
    <>
      <Navbar />
      <div className="fb-page">
        <div className="fb-container">
          <div className="fb-outer-box">
            <div className="fb-page-header">
              <span className="fb-header-icon">💬</span>
              <h2>My Feedbacks & Replies</h2>
              <p>Feedbacks you gave to guiders and their responses</p>
            </div>
            {loading ? (
              <div className="fb-loading">Loading feedbacks...</div>
            ) : error ? (
              <div className="fb-msg error">{error}</div>
            ) : feedbacks.length === 0 ? (
              <div className="fb-empty">
                <span className="fb-empty-icon">🔕</span>
                <p>You haven't given any feedback yet.</p>
              </div>
            ) : (
              <div className="fb-list">
                {feedbacks.map((fb) => (
                  <div key={fb.id} className="fb-card">

                    {/* Hunter ka feedback */}
                    <div className="fb-given">
                      <div className="fb-card-header">
                        <div className="fb-avatar">👤</div>
                        <div>
                          <p className="fb-name">
                            You → <strong>{fb.to_name || fb.to_email}</strong>
                          </p>
                          <p className="fb-time">{formatDate(fb.created_at)}</p>
                        </div>
                      </div>
                      <div className="fb-stars">{renderStars(fb.rating)}</div>
                      <p className="fb-comment">{fb.comment}</p>
                    </div>

                    {/* Guider ka reply */}
                    {fb.reply ? (
                      <div className="fb-reply">
                        <div className="fb-reply-header">
                          <span className="fb-reply-icon">🧭</span>
                          <div>
                            <p className="fb-name">
                              <strong>{fb.to_name || fb.to_email}</strong> replied:
                            </p>
                            {fb.reply_at && (
                              <p className="fb-time">{formatDate(fb.reply_at)}</p>
                            )}
                          </div>
                        </div>
                        <p className="fb-reply-text">{fb.reply}</p>
                      </div>
                    ) : (
                      <div className="fb-no-reply">
                        <div className="fb-no-reply-inner">
                          <span className="fb-no-reply-icon">⏳</span>
                          <div>
                            <p className="fb-no-reply-title">No reply yet</p>
                            <p className="fb-no-reply-sub">The guider hasn't responded to your feedback yet.</p>
                          </div>
                        </div>
                      </div>
                    )}

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default Feedback;