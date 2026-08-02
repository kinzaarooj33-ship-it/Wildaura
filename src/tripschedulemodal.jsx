import { useState, useEffect } from "react";
import axios from "axios";
import "./tripschedulemodal.css";

function TripScheduleModal({ guider, hunter, onClose }) {
  const [step, setStep] = useState("loading_check");
  const [existingSchedule, setExistingSchedule] = useState(null);
  const [formData, setFormData] = useState({
    target_species: "",
    destination: "",
    start_date: "",
    end_date: "",
    group_detail: "",
    additional_requirements: "",
    message: "",
  });
  const [schedule, setSchedule] = useState(null);
  const [saving, setSaving] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingDone, setBookingDone] = useState(false);

  // ✅ FIX: browser ke "alert()" ki jagah proper in-app popup
  // { type: "success" | "error", title, message }
  const [popup, setPopup] = useState(null);

  useEffect(() => {
    const checkExisting = async () => {
      try {
        const res = await axios.get(
          `http://localhost:3000/api/trip-schedules/${hunter?.email}/${guider?.id}`
        );
        if (res.data?.schedule) {
          setExistingSchedule(res.data.schedule);
          setStep("want_new");
        } else {
          setStep("want_make");
        }
      } catch {
        setStep("want_make");
      }
    };
    if (hunter?.email && guider?.id) checkExisting();
    else setStep("want_make");
  }, []);

  if (step === "loading_check") {
    return (
      <div className="tsm-overlay">
        <div className="tsm-loading-box">
          <div className="tsm-load-spinner"></div>
          <h3>Checking your schedule...</h3>
        </div>
      </div>
    );
  }

  if (step === "want_make") {
    return (
      <div className="tsm-overlay" onClick={onClose}>
        <div className="tsm-popup confirm-popup" onClick={e => e.stopPropagation()}>
          <div className="tsm-popup-icon">🗓️</div>
          <h2>Book {guider?.name}</h2>
          <p>Create a personalized trip schedule with this guider and send a booking request!</p>
          <div className="tsm-confirm-btns">
            <button className="tsm-ok-btn" onClick={() => setStep("form")}>✅ Yes, Make Schedule</button>
            <button className="tsm-cancel-btn" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "want_new") {
    return (
      <div className="tsm-overlay" onClick={onClose}>
        <div className="tsm-popup confirm-popup" onClick={e => e.stopPropagation()}>
          <div className="tsm-popup-icon">📋</div>
          <h2>Schedule Found!</h2>
          <p>You already have a trip schedule with <strong>{guider?.name}</strong>.</p>
          <div className="tsm-confirm-btns">
            <button className="tsm-ok-btn" onClick={() => {
              setSchedule(JSON.parse(existingSchedule.schedule_data));
              setFormData({
                target_species: existingSchedule.target_species,
                destination: existingSchedule.destination,
                start_date: existingSchedule.start_date,
                end_date: existingSchedule.end_date,
                group_detail: existingSchedule.group_detail || "",
                additional_requirements: existingSchedule.additional_requirements || "",
                message: "",
              });
              setStep("schedule");
            }}>👁️ View Existing</button>
            <button className="tsm-ok-btn" style={{ background: "#d97706" }}
              onClick={() => setStep("form")}>🔄 Make New</button>
            <button className="tsm-cancel-btn" onClick={onClose}>Cancel</button>
          </div>
        </div>
      </div>
    );
  }

  const handleFormSubmit = async () => {
    if (!formData.target_species || !formData.destination || !formData.start_date || !formData.end_date) {
      setPopup({ type: "error", title: "Missing Fields", message: "Please fill all required fields." });
      return;
    }
    setStep("loading");
    const start = new Date(formData.start_date);
    const end = new Date(formData.end_date);
    const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

    try {
      const aiRes = await axios.post("http://localhost:3000/api/generate-schedule", {
        hunter_name: hunter?.name,
        guider_name: guider?.name,
        guider_specialization: guider?.specialization,
        guider_province: guider?.province,
        target_species: formData.target_species,
        destination: formData.destination,
        start_date: formData.start_date,
        end_date: formData.end_date,
        duration_days: days,
        group_detail: formData.group_detail,
        additional_requirements: formData.additional_requirements,
      });

      if (!aiRes.data.success) throw new Error("Failed");
      const parsed = aiRes.data.schedule;
      setSchedule(parsed);
      setStep("schedule");
      await saveSchedule(parsed, days);
    } catch {
      setPopup({ type: "error", title: "Generation Failed", message: "Schedule generate karne mein masla hua. Please try again." });
      setStep("form");
    }
  };

  const saveSchedule = async (generatedSchedule, days) => {
    try {
      setSaving(true);
      await axios.post("http://localhost:3000/api/trip-schedules", {
        hunter_id: hunter?.id,
        hunter_name: hunter?.name,
        hunter_email: hunter?.email,
        guider_id: guider?.id,
        guider_name: guider?.name,
        guider_email: guider?.email,
        target_species: formData.target_species,
        destination: formData.destination,
        start_date: formData.start_date,
        end_date: formData.end_date,
        duration_days: days,
        group_detail: formData.group_detail,
        additional_requirements: formData.additional_requirements,
        schedule_data: JSON.stringify(generatedSchedule),
      });
    } catch (err) {
      console.error("Save error:", err);
      setPopup({ type: "error", title: "Save Failed", message: "Schedule save nahi ho saka. Please try again." });
    } finally {
      setSaving(false);
    }
  };

  // ✅ Booking request with proper hunter_name + popup feedback
  const sendBookingRequest = async () => {
    setBookingLoading(true);
    try {
      const start = new Date(formData.start_date);
      const end = new Date(formData.end_date);
      const days = Math.max(1, Math.ceil((end - start) / (1000 * 60 * 60 * 24)));

      let totalAmount = 0;
      if (schedule?.estimated_cost?.total) {
        const totalStr = String(schedule.estimated_cost.total);
        totalAmount = parseFloat(totalStr.replace(/[^0-9.]/g, '')) || 0;
      }
      if (totalAmount === 0) {
        totalAmount = days * 5000;
      }

      const hunterName = hunter?.name || hunter?.full_name || hunter?.email?.split("@")[0] || "Hunter";

      console.log("📤 Sending booking with hunter_name:", hunterName);

      const response = await axios.post("http://localhost:3000/api/booking/create", {
        hunter_id: hunter?.id || hunter?._id,
        hunter_name: hunterName,
        hunter_email: hunter?.email,
        hunter_phone: hunter?.phone || hunter?.phone_number || "",
        hunter_profile_image: hunter?.profile_image || "",
        guider_id: guider?.id || guider?._id,
        guider_name: guider?.name,
        guider_email: guider?.email,
        schedule_id: existingSchedule?.id || "SCH-" + Date.now(),
        start_date: formData.start_date,
        end_date: formData.end_date,
        duration: days,
        destination: formData.destination,
        species: formData.target_species,
        special_requests: formData.message || "",
        total_amount: totalAmount,
      });

      console.log("📥 Booking response:", response.data);

      if (response.data && response.data.success) {
        setBookingDone(true);
        // ✅ FIX: success confirmation ab visible popup ki form mein bhi
        setPopup({
          type: "success",
          title: "Booking Request Sent!",
          message: `Your booking request has been sent to ${guider?.name}. They will review and respond soon.`,
        });
      } else {
        setPopup({
          type: "error",
          title: "Booking Failed",
          message: response.data?.message || "Booking request failed. Please try again.",
        });
      }
    } catch (err) {
      console.error("❌ Booking error:", err.response?.data || err.message);
      // ✅ FIX: error ab visible popup ki form mein
      setPopup({
        type: "error",
        title: "Booking Failed",
        message: err.response?.data?.message || "Booking request send karne mein masla hua. Please try again.",
      });
    } finally {
      setBookingLoading(false);
    }
  };

  const handleDownload = () => {
    if (!schedule) return;
    const content = `
WILD AURA - TRIP SCHEDULE
=========================
Hunter: ${hunter?.name}
Guider: ${guider?.name}
Destination: ${formData.destination}
Species: ${formData.target_species}
Duration: ${formData.start_date} to ${formData.end_date}

DAILY ACTIVITY PLAN
-------------------
${schedule.daily_plan?.map(d => `Day ${d.day} (${d.date}) - ${d.title}\n${d.activities?.map(a => `  • ${a}`).join("\n")}`).join("\n\n")}

BEST ROUTE
----------
${schedule.best_route}

ESTIMATED COST
--------------
Guider Fee: ${schedule.estimated_cost?.guider_fee}
Accommodation: ${schedule.estimated_cost?.accommodation}
Transport: ${schedule.estimated_cost?.transport}
Equipment: ${schedule.estimated_cost?.equipment}
TOTAL: ${schedule.estimated_cost?.total}

REQUIRED ITEMS
--------------
${schedule.required_items?.map(i => `• ${i}`).join("\n")}
    `.trim();
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `WildAura_TripSchedule_${formData.destination.replace(/\s+/g, "_")}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ✅ FIX: reusable popup renderer — proper alert instead of window.alert()
  const renderAlertPopup = () => {
    if (!popup) return null;
    return (
      <div className="tsm-alert-overlay" onClick={() => setPopup(null)}>
        <div className="tsm-alert-box" onClick={e => e.stopPropagation()}>
          <div className="tsm-alert-icon">{popup.type === "success" ? "✅" : "❌"}</div>
          <h4 className={`tsm-alert-title ${popup.type}`}>{popup.title}</h4>
          <p className="tsm-alert-msg">{popup.message}</p>
          <button className="tsm-alert-btn" onClick={() => setPopup(null)}>OK</button>
        </div>
      </div>
    );
  };

  if (step === "form") {
    return (
      <div className="tsm-overlay" onClick={onClose}>
        <div className="tsm-form-container" onClick={e => e.stopPropagation()}>
          {renderAlertPopup()}
          <div className="tsm-form-header">
            <h2>Trip Schedule Form</h2>
            <p>Fill details to generate schedule & send booking request</p>
          </div>
          <div className="tsm-form-body">
            <div className="tsm-field">
              <label>Target Species <span className="req">*</span></label>
              <input type="text" placeholder="e.g. Markhor, Urial"
                value={formData.target_species}
                onChange={e => setFormData({ ...formData, target_species: e.target.value })} />
            </div>
            <div className="tsm-field">
              <label>Destination <span className="req">*</span></label>
              <input type="text" placeholder="e.g. Chitral Valley"
                value={formData.destination}
                onChange={e => setFormData({ ...formData, destination: e.target.value })} />
            </div>
            <div className="tsm-field">
              <label>Trip Duration <span className="req">*</span></label>
              <div className="tsm-date-row">
                <div className="tsm-date-wrap">
                  <input type="date" value={formData.start_date}
                    min={new Date().toISOString().split("T")[0]}
                    onChange={e => setFormData({ ...formData, start_date: e.target.value })} />
                  <span className="date-label">Start Date</span>
                </div>
                <div className="tsm-date-divider">→</div>
                <div className="tsm-date-wrap">
                  <input type="date" value={formData.end_date}
                    min={formData.start_date || new Date().toISOString().split("T")[0]}
                    onChange={e => setFormData({ ...formData, end_date: e.target.value })} />
                  <span className="date-label">End Date</span>
                </div>
              </div>
            </div>
            <div className="tsm-field">
              <label>Group Detail</label>
              <input type="text" placeholder="e.g. 3 hunters, solo"
                value={formData.group_detail}
                onChange={e => setFormData({ ...formData, group_detail: e.target.value })} />
            </div>
            <div className="tsm-field">
              <label>Additional Requirements</label>
              <input type="text" placeholder="e.g. halal food, vehicle"
                value={formData.additional_requirements}
                onChange={e => setFormData({ ...formData, additional_requirements: e.target.value })} />
            </div>
            <div className="tsm-field">
              <label>Message to Guider</label>
              <textarea rows={3} placeholder="Optional message..."
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                style={{ padding: '10px', borderRadius: '8px', border: '1px solid #d1d5db', resize: 'none', width: '100%', fontFamily: 'Arial' }} />
            </div>
            <div className="tsm-guider-info">
              <div className="tsm-guider-chip">
                <i className="fa-solid fa-user-shield"></i>
                <span>Guider: <strong>{guider?.name}</strong></span>
              </div>
              {guider?.specialization && (
                <div className="tsm-guider-chip">
                  <i className="fa-solid fa-crosshairs"></i>
                  <span>{guider.specialization}</span>
                </div>
              )}
            </div>
          </div>
          <div className="tsm-form-footer">
            <button className="tsm-back-btn" onClick={() => setStep("want_make")}>Back</button>
            <button className="tsm-submit-btn" onClick={handleFormSubmit}>
              <i className="fa-solid fa-wand-magic-sparkles"></i> Generate Schedule
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (step === "loading") {
    return (
      <div className="tsm-overlay">
        <div className="tsm-loading-box">
          <div className="tsm-load-spinner"></div>
          <h3>Generating Your Trip Schedule...</h3>
          <p>Planning your perfect hunting adventure</p>
          <div className="tsm-load-steps">
            <span>📍 Analyzing destination...</span>
            <span>🗓️ Planning daily activities...</span>
            <span>💰 Estimating costs...</span>
            <span>🎒 Listing required items...</span>
          </div>
        </div>
      </div>
    );
  }

  if (step === "schedule" && schedule) {
    return (
      <div className="tsm-overlay" onClick={onClose}>
        <div className="tsm-schedule-container" onClick={e => e.stopPropagation()}>
          {renderAlertPopup()}
          <div className="tsm-sched-header">
            <h2><i className="fa-solid fa-calendar-days"></i> Trip Schedule</h2>
            <p>{formData.destination} · {formData.start_date} → {formData.end_date}</p>
            <button className="tsm-close-x" onClick={onClose}>✕</button>
          </div>
          <div className="tsm-sched-body">
            <div className="tsm-section">
              <h3 className="tsm-sec-title"><i className="fa-solid fa-sun"></i> Daily Activity Plan</h3>
              <div className="tsm-days-list">
                {schedule.daily_plan?.map((day, i) => (
                  <div className="tsm-day-card" key={i}>
                    <div className="tsm-day-badge">Day {day.day}</div>
                    <div className="tsm-day-content">
                      <div className="tsm-day-title">{day.date} — {day.title}</div>
                      <ul className="tsm-activity-list">
                        {day.activities?.map((act, j) => (
                          <li key={j}><i className="fa-solid fa-circle-arrow-right"></i> {act}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="tsm-section">
              <h3 className="tsm-sec-title"><i className="fa-solid fa-route"></i> Best Route</h3>
              <p className="tsm-route-text">{schedule.best_route}</p>
            </div>
            <div className="tsm-section">
              <h3 className="tsm-sec-title"><i className="fa-solid fa-money-bill-wave"></i> Estimated Cost</h3>
              <div className="tsm-cost-grid">
                <div className="tsm-cost-item"><span className="tsm-cost-label">Guider Fee</span><span className="tsm-cost-val">{schedule.estimated_cost?.guider_fee}</span></div>
                <div className="tsm-cost-item"><span className="tsm-cost-label">Accommodation</span><span className="tsm-cost-val">{schedule.estimated_cost?.accommodation}</span></div>
                <div className="tsm-cost-item"><span className="tsm-cost-label">Transport</span><span className="tsm-cost-val">{schedule.estimated_cost?.transport}</span></div>
                <div className="tsm-cost-item"><span className="tsm-cost-label">Equipment</span><span className="tsm-cost-val">{schedule.estimated_cost?.equipment}</span></div>
                <div className="tsm-cost-item total"><span className="tsm-cost-label">Total</span><span className="tsm-cost-val">{schedule.estimated_cost?.total}</span></div>
              </div>
            </div>
            <div className="tsm-section">
              <h3 className="tsm-sec-title"><i className="fa-solid fa-list-check"></i> Required Items</h3>
              <div className="tsm-items-grid">
                {schedule.required_items?.map((item, i) => (
                  <div className="tsm-item-chip" key={i}><i className="fa-solid fa-check"></i> {item}</div>
                ))}
              </div>
            </div>

            <div className="tsm-section tsm-booking-section">
              <h3 className="tsm-sec-title">📤 Send Booking Request</h3>
              {bookingDone ? (
                <div className="tsm-booking-success">
                  ✅ Booking request sent to <strong>{guider?.name}</strong>! They will review and respond.
                </div>
              ) : (
                <button className="tsm-book-request-btn" onClick={sendBookingRequest} disabled={bookingLoading}>
                  {bookingLoading ? "Sending..." : `📨 Send Booking Request to ${guider?.name}`}
                </button>
              )}
            </div>
          </div>

          <div className="tsm-sched-footer">
            {saving && <span className="tsm-saving">Saving...</span>}
            <button className="tsm-download-btn" onClick={handleDownload}>
              <i className="fa-solid fa-download"></i> Download
            </button>
            <button className="tsm-done-btn" onClick={onClose}>Done</button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

export default TripScheduleModal;