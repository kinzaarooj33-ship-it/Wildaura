import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Navbar from "./components/Navbar";
import "./feedbackview.css";

function FeedbackView() {
  const navigate = useNavigate();
  const location = useLocation();
  const currentUser = JSON.parse(localStorage.getItem("user") || "{}");
  const { email, role } = location.state || {};
  const isSentView = !email;

  const [feedbacks, setFeedbacks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser.email) { setLoading(false); return; }
    const fetchUrl = isSentView
      ? `http://localhost:3000/api/feedback/sent/${currentUser.email}`
      : `http://localhost:3000/api/feedback/${email}`;

    fetch(fetchUrl)
      .then(res => res.json())
      .then(data => { setFeedbacks(data.feedbacks || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [email]);

  const renderStars = (rating) =>
    [1, 2, 3, 4, 5].map(s => (
      <span key={s} style={{ color: s <= rating ? "#f4a261" : "#d1d5db", fontSize: "20px" }}>★</span>
    ));

  return (
    <>
      <Navbar />
      <div className="fbv-page">
        <div className="fbv-container">
          <button className="fbv-back-btn" onClick={() => navigate(-1)}>← Back</button>

          <h2 className="fbv-title">
            {isSentView ? "📤 My Feedback" : "💬 Feedback"}
          </h2>
          {isSentView && <p className="fbv-subtitle">Feedbacks you have given to guiders</p>}

          {loading ? (
            <p className="fbv-empty">Loading...</p>
          ) : feedbacks.length === 0 ? (
            <div className="fbv-empty-box">
              <p>💬 {isSentView ? "You haven't given any feedback yet" : "No feedback yet"}</p>
            </div>
          ) : (
            <div className="fbv-list">
              {feedbacks.map((fb, i) => (
                <div className="fbv-card" key={i}>
                  <div className="fbv-card-top">
                    <div className="fbv-avatar">
                      {isSentView
                        ? (fb.to_email?.[0]?.toUpperCase() || "G")
                        : (fb.from_name?.[0]?.toUpperCase() || "U")}
                    </div>
                    <div style={{ flex: 1 }}>
                      {isSentView ? (
                        <>
                          <p className="fbv-from">To: <strong>{fb.to_email}</strong></p>
                          <p className="fbv-role-tag">{fb.to_role}</p>
                        </>
                      ) : (
                        <p className="fbv-from">{fb.from_name || fb.from_email}</p>
                      )}
                      <div className="fbv-stars">{renderStars(fb.rating)}</div>
                    </div>
                    <span className="fbv-date">
                      {new Date(fb.created_at).toLocaleDateString("en-PK", {
                        day: "numeric", month: "short", year: "numeric"
                      })}
                    </span>
                  </div>

                  <p className="fbv-comment">{fb.comment}</p>

                  {/* ✅ Guider replies — multiple */}
                  {fb.replies && fb.replies.length > 0 && (
                    <div className="fbv-replies">
                      <p className="fbv-replies-label">Guider Replies:</p>
                      {fb.replies.map((r, j) => (
                        <div key={j} className="fbv-reply-item">
                          <p className="fbv-reply-text">💬 {r.reply}</p>
                          <span className="fbv-reply-date">
                            {new Date(r.created_at).toLocaleDateString("en-PK", {
                              day: "numeric", month: "short", year: "numeric"
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* ✅ Old single reply fallback */}
                  {!fb.replies && fb.guider_reply && (
                    <div className="fbv-reply-item">
                      <p className="fbv-reply-text">💬 {fb.guider_reply}</p>
                    </div>
                  )}

                  {/* ✅ Seen status */}
                  {isSentView && (
                    <div className="fbv-seen-status">
                      {fb.is_seen
                        ? <span className="fbv-seen">✅ Seen by guider</span>
                        : <span className="fbv-unseen">⏳ Not seen yet</span>}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default FeedbackView;