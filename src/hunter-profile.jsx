import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./hunter-profile.css";

function HunterProfile() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    cnic_number: "",
    phone_number: "+92",
    license_number: "",
    province: "",
    address: "",           // ✅ city ki jagah address
    hunting_experience: "",
  });

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);

  const provinceLicenseFormats = {
    "Punjab":                     { regex: /^PB-HL-\d{4}-\d{5}$/,  example: "PB-HL-2024-00123"  },
    "Sindh":                      { regex: /^SD-WL-\d{4}-\d{5}$/,  example: "SD-WL-2024-00123"  },
    "Khyber Pakhtunkhwa":         { regex: /^KP-HL-\d{4}-\d{5}$/,  example: "KP-HL-2024-00123"  },
    "Balochistan":                { regex: /^BL-HL-\d{4}-\d{5}$/,  example: "BL-HL-2024-00123"  },
    "Gilgit-Baltistan":           { regex: /^GB-HL-\d{4}-\d{5}$/,  example: "GB-HL-2024-00123"  },
    "Azad Kashmir":               { regex: /^AK-HL-\d{4}-\d{5}$/,  example: "AK-HL-2024-00123"  },
    "Islamabad Capital Territory":{ regex: /^ICT-HL-\d{4}-\d{5}$/, example: "ICT-HL-2024-00123" },
  };

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Phone number — sirf digits after +92
    if (name === "phone_number") {
      if (!value.startsWith("+92")) return;
      const afterPrefix = value.slice(3);
      if (!/^\d*$/.test(afterPrefix)) return;
      if (afterPrefix.length > 10) return;
      setFormData({ ...formData, [name]: value });
      return;
    }

    // CNIC auto-hyphen
    if (name === "cnic_number") {
      if (!/^[\d-]*$/.test(value)) return;
      let raw = value.replace(/-/g, "");
      if (raw.length > 13) return;
      let formatted = raw;
      if (raw.length > 5)  formatted = raw.slice(0, 5) + "-" + raw.slice(5);
      if (raw.length > 12) formatted = formatted.slice(0, 13) + "-" + formatted.slice(13);
      setFormData({ ...formData, [name]: formatted });
      return;
    }

    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // ── Validate Name
    if (!formData.name.trim()) {
      showMessage("❌ Name is required.", "error");
      return;
    }

    // ── Validate Phone
    const phoneDigits = formData.phone_number.replace("+92", "");
    if (phoneDigits.length === 0) {
      showMessage("❌ Phone number is required after +92.", "error");
      return;
    }
    if (!/^\d{10}$/.test(phoneDigits)) {
      showMessage(`❌ Phone number must be exactly 10 digits after +92. You entered ${phoneDigits.length} digit(s).`, "error");
      return;
    }

    // ── Validate CNIC
    if (!formData.cnic_number) {
      showMessage("❌ CNIC number is required.", "error");
      return;
    }
    if (!/^\d{5}-\d{7}-\d{1}$/.test(formData.cnic_number)) {
      showMessage("❌ Invalid CNIC format. Correct example: 35201-1234567-1", "error");
      return;
    }

    // ── Validate Province
    if (!formData.province) {
      showMessage("❌ Please select your province.", "error");
      return;
    }

    // ── Validate License
    if (!formData.license_number) {
      showMessage("❌ Hunting license number is required.", "error");
      return;
    }
    const format = provinceLicenseFormats[formData.province];
    if (format && !format.regex.test(formData.license_number)) {
      showMessage(`❌ Invalid license format for ${formData.province}. Correct example: ${format.example}`, "error");
      return;
    }

    // ── Validate Experience
    if (formData.hunting_experience === "" || formData.hunting_experience < 0) {
      showMessage("❌ Please enter your hunting experience (years).", "error");
      return;
    }

    // ── Validate Address
    if (!formData.address.trim()) {           // ✅ city ki jagah address
      showMessage("❌ Address is required.", "error");
      return;
    }

    // ── Submit
    setLoading(true);

    const user = JSON.parse(localStorage.getItem("user"));
    const userEmail = user?.email;

    if (!userEmail) {
      showMessage("❌ Please login first!", "error");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/hunter-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: userEmail,
          name: formData.name,
          cnic_number: formData.cnic_number,
          license_number: formData.license_number,
          hunting_experience: Number(formData.hunting_experience),
          phone_number: formData.phone_number,
          province: formData.province,
          address: formData.address,        // ✅ city ki jagah address
        }),
      });
      const result = await res.json();

      if (res.ok) {
        showMessage("✅ Profile saved successfully!", "success");
        setTimeout(() => navigate("/home"), 2000);
      } else {
        showMessage("❌ " + (result.message || "Error occurred"), "error");
      }
    } catch (err) {
      showMessage("❌ Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const selectedFormat = formData.province
    ? provinceLicenseFormats[formData.province]
    : null;

  const provinces = [
    "Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan",
    "Gilgit-Baltistan", "Azad Kashmir", "Islamabad Capital Territory",
  ];

  return (
    <div className="page">

      {/* ── TOAST POPUP ── */}
      {showToast && (
        <div className={`toast ${messageType}`} onClick={() => setShowToast(false)}>
          <span className="toast-msg">{message}</span>
          <span className="toast-close">✕</span>
        </div>
      )}

      <div className="hunter-container">

        <button type="button" className="back-btn-n" onClick={() => navigate(-1)}>
          ← Back
        </button>

        <h2>Complete Your Hunter Profile</h2>
        <p className="subtitle">
          This information helps us ensure responsible and regulated hunting.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="form-grid">

            {/* Name */}
            <div>
              <label>Name</label>
              <input
                type="text"
                name="name"
                placeholder="Your full name"
                value={formData.name}
                onChange={handleChange}
              />
            </div>

            {/* Phone */}
            <div>
              <label>Phone Number</label>
              <input
                type="tel"
                name="phone_number"
                placeholder="+92XXXXXXXXXX"
                value={formData.phone_number}
                onChange={handleChange}
                maxLength={13}
              />
            </div>

            {/* CNIC */}
            <div>
              <label>CNIC Number</label>
              <input
                type="text"
                name="cnic_number"
                placeholder="e.g. 35201-1234567-1"
                value={formData.cnic_number}
                onChange={handleChange}
                maxLength={15}
              />
            </div>

            {/* Province */}
            <div>
              <label>Province</label>
              <select
                name="province"
                value={formData.province}
                onChange={handleChange}
              >
                <option value="">Select Province</option>
                {provinces.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>

            {/* License */}
            <div>
              <label>Hunting License Number</label>
              <input
                type="text"
                name="license_number"
                placeholder={
                  selectedFormat ? `e.g. ${selectedFormat.example}` : "Select province first"
                }
                value={formData.license_number}
                onChange={handleChange}
              />
              {selectedFormat && (
                <span className="field-hint">Format: {selectedFormat.example}</span>
              )}
            </div>

            {/* Experience */}
            <div>
              <label>Hunting Experience (Years)</label>
              <input
                type="number"
                name="hunting_experience"
                placeholder="Years of experience"
                value={formData.hunting_experience}
                onChange={handleChange}
                min={0}
              />
            </div>

            {/* ✅ Address */}
            <div>
              <label>Address</label>
              <input
                type="text"
                name="address"
                placeholder="Your full address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>

          </div>

          <button type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Information"}
          </button>

          <button type="button" className="skip-btn" onClick={() => navigate("/home")}>
            Skip for Now
          </button>

        </form>
      </div>
    </div>
  );
}

export default HunterProfile;