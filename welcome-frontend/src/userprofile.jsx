import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import "./userprofile.css";

function UserProfile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewImg, setPreviewImg] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({});
  const [selectedFile, setSelectedFile] = useState(null);
  const [hunterProfile, setHunterProfile] = useState(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMsg, setToastMsg] = useState("");
  const [toastType, setToastType] = useState("");
  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  const provinceLicenseFormats = {
    "Punjab":                      { regex: /^PB-HL-\d{4}-\d{5}$/,  example: "PB-HL-2024-00123"  },
    "Sindh":                       { regex: /^SD-WL-\d{4}-\d{5}$/,  example: "SD-WL-2024-00123"  },
    "Khyber Pakhtunkhwa":          { regex: /^KP-HL-\d{4}-\d{5}$/,  example: "KP-HL-2024-00123"  },
    "Balochistan":                 { regex: /^BL-HL-\d{4}-\d{5}$/,  example: "BL-HL-2024-00123"  },
    "Gilgit-Baltistan":            { regex: /^GB-HL-\d{4}-\d{5}$/,  example: "GB-HL-2024-00123"  },
    "Azad Kashmir":                { regex: /^AK-HL-\d{4}-\d{5}$/,  example: "AK-HL-2024-00123"  },
    "Islamabad Capital Territory": { regex: /^ICT-HL-\d{4}-\d{5}$/, example: "ICT-HL-2024-00123" },
  };

  const provinces = [
    "Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan",
    "Gilgit-Baltistan", "Azad Kashmir", "Islamabad Capital Territory",
  ];

  // ── Toast helper
  const showMessage = (msg, type) => {
    setToastMsg(msg);
    setToastType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (!user || !user.email) {
      setError("Login first.");
      setLoading(false);
      return;
    }

    fetch(`http://localhost:3000/user-profile/${user.email}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.profile) {
          setProfile(data.profile);
          setEditData(data.profile);
          if (data.profile.profile_image) {
            setPreviewImg(`http://localhost:3000/uploads/${data.profile.profile_image}`);
          }
          setHunterProfile(data.hunterProfileExists ? data.profile : null);
        } else {
          setError("Profile not found.");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("Server not responding.");
        setLoading(false);
      });
  }, []);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setPreviewImg(URL.createObjectURL(file));
      setSelectedFile(file);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Phone
    if (name === "phone_number") {
      if (!value.startsWith("+92")) return;
      const afterPrefix = value.slice(3);
      if (!/^\d*$/.test(afterPrefix)) return;
      if (afterPrefix.length > 10) return;
      setEditData({ ...editData, [name]: value });
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
      setEditData({ ...editData, [name]: formatted });
      return;
    }

    setEditData({ ...editData, [name]: value });
  };

  const handleSave = async () => {

    // ── Validate Email
    const emailVal = editData.email || "";
    const invalidSymbols = emailVal.match(/[^a-zA-Z0-9.@_\-]/g);
    if (invalidSymbols) {
      const unique = [...new Set(invalidSymbols)].join(" ");
      showMessage(`❌ Symbol "${unique}" is not allowed in email!`, "error");
      return;
    }
    if (!/^[a-zA-Z][a-zA-Z0-9.]+@/.test(emailVal)) {
      showMessage("❌ Email must start with a letter! Example: name@gmail.com", "error");
      return;
    }
    if (!/^[a-zA-Z0-9._%+-]+@(gmail\.com|yahoo\.com)$/.test(emailVal)) {
      showMessage("❌ Only Gmail or Yahoo email allowed! Example: name@gmail.com", "error");
      return;
    }

    // ── Validate Phone
    const phoneDigits = (editData.phone_number || "").replace("+92", "");
    if (!editData.phone_number || !editData.phone_number.startsWith("+92")) {
      showMessage("❌ Phone number must start with +92.", "error");
      return;
    }
    if (phoneDigits.length === 0) {
      showMessage("❌ Phone number is required after +92.", "error");
      return;
    }
    if (!/^\d{10}$/.test(phoneDigits)) {
      showMessage(`❌ Phone number must be exactly 10 digits after +92. You entered ${phoneDigits.length} digit(s).`, "error");
      return;
    }

    // ── Validate CNIC
    if (editData.cnic_number && !/^\d{5}-\d{7}-\d{1}$/.test(editData.cnic_number)) {
      showMessage("❌ Invalid CNIC format. Correct example: 35201-1234567-1", "error");
      return;
    }

    // ── Validate Province
    if (!editData.province) {
      showMessage("❌ Please select your province.", "error");
      return;
    }

    // ── Validate License
    if (editData.license_number && editData.province && provinceLicenseFormats[editData.province]) {
      if (!provinceLicenseFormats[editData.province].regex.test(editData.license_number)) {
        showMessage(`❌ Invalid license format for ${editData.province}. Correct example: ${provinceLicenseFormats[editData.province].example}`, "error");
        return;
      }
    }

    // ── Validate Address
    // ✅ FIX: address bhi validate karo taake khali address save na ho
    if (!editData.address || !editData.address.trim()) {
      showMessage("❌ Address is required.", "error");
      return;
    }

    // ── Submit
    const user = JSON.parse(localStorage.getItem("user"));
    const formData = new FormData();
    formData.append("email",              editData.email || "");
    formData.append("hunting_experience", editData.hunting_experience || "");
    formData.append("cnic_number",        editData.cnic_number || "");
    formData.append("license_number",     editData.license_number || "");
    formData.append("phone_number",       editData.phone_number || "");
    formData.append("province",           editData.province || "");
    // ✅ FIX: address field bilkul missing thi yahan — isi wajah se backend ko
    // address kabhi nahi milta tha aur UPDATE query usay NULL kar deti thi,
    // chahe pehle se address DB mein save ho. Ab address bhi bheja jayega.
    formData.append("address",            editData.address || "");
    if (selectedFile) formData.append("profile_image", selectedFile);

    try {
      const res = await fetch(`http://localhost:3000/update-profile/${user.email}`, {
        method: "PUT",
        body: formData,
      });
      const result = await res.json();
      if (res.ok) {
        setProfile(editData);
        setIsEditing(false);
        setSelectedFile(null);
        if (result.profile_image) {
          setPreviewImg(`http://localhost:3000/uploads/${result.profile_image}`);
        }
        showMessage("✅ Profile updated successfully!", "success");
      } else {
        showMessage("❌ " + (result.message || "Error occurred"), "error");
      }
    } catch {
      showMessage("❌ Server not responding. Please try again.", "error");
    }
  };

  if (loading) return <div className="profile-wrapper"><p style={{ color: "#fff", textAlign: "center" }}>Loading...</p></div>;
  if (error)   return <div className="profile-wrapper"><p style={{ color: "red",  textAlign: "center" }}>{error}</p></div>;

  return (
    <div className="profile-wrapper">

      {/* ── TOAST POPUP ── */}
      {showToast && (
        <div className={`toast ${toastType}`} onClick={() => setShowToast(false)}>
          <span className="toast-msg">{toastMsg}</span>
          <span className="toast-close">✕</span>
        </div>
      )}

      <div className="profile-box">

        {/* BACK BUTTON */}
        <button type="button" className="back-btn" onClick={() => navigate(-1)}>
          ← Back
        </button>

        {!hunterProfile && (
          <div style={{ textAlign: "center", marginBottom: "16px" }}>
            <button onClick={() => navigate("/hunter-profile")} className="btn-complete-profile">
              ⚠️ Complete Your Profile
            </button>
          </div>
        )}

        <div className="profile-top">
          <div className="profile-header">
            {previewImg ? (
              <img src={previewImg} alt="Hunter" />
            ) : (
              <div className="default-avatar">
                {profile.name ? profile.name.charAt(0).toUpperCase() : "H"}
              </div>
            )}
            <div className="edit-badge" onClick={() => fileInputRef.current.click()}>✎</div>
            <input type="file" accept="image/*" ref={fileInputRef}
              style={{ display: "none" }} onChange={handleImageChange} />
            <h2>{profile.name}</h2>
            <p>ID: HTR-{profile.id}</p>
          </div>
        </div>

        <div className="fields-grid">

          <div className="field">
            <label>Email</label>
            {isEditing ? (
              <input name="email" value={editData.email || ""} onChange={handleChange}
                style={{ width: "100%", boxSizing: "border-box" }} />
            ) : <p>{profile.email}</p>}
          </div>

          <div className="field">
            <label>Phone Number</label>
            {isEditing ? (
              <input name="phone_number" value={editData.phone_number || "+92"}
                onChange={handleChange} maxLength={13} />
            ) : <p>{profile.phone_number || "N/A"}</p>}
          </div>

          <div className="field">
            <label>Hunting Experience</label>
            {isEditing ? (
              <input name="hunting_experience" type="number" min={0}
                value={editData.hunting_experience || ""} onChange={handleChange} />
            ) : <p>{profile.hunting_experience != null ? `${profile.hunting_experience} years` : "N/A"}</p>}
          </div>

          <div className="field">
            <label>Province</label>
            {isEditing ? (
              <select name="province" value={editData.province || ""} onChange={handleChange}
                style={{ width: "100%", boxSizing: "border-box", padding: "6px 8px", borderRadius: "6px", border: "1px solid #ccc" }}>
                <option value="">Select Province</option>
                {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            ) : <p>{profile.province || "N/A"}</p>}
          </div>

          <div className="field">
            <label>Licence Number</label>
            {isEditing ? (
              <>
                <input name="license_number" value={editData.license_number || ""}
                  onChange={handleChange}
                  placeholder={
                    editData.province && provinceLicenseFormats[editData.province]
                      ? `e.g. ${provinceLicenseFormats[editData.province].example}`
                      : "Select province first"
                  }
                />
                {editData.province && provinceLicenseFormats[editData.province] && (
                  <span style={{ color: "#888", fontSize: "11px" }}>
                    Format: {provinceLicenseFormats[editData.province].example}
                  </span>
                )}
              </>
            ) : <p>{profile.license_number || "N/A"}</p>}
          </div>

          <div className="field">
            <label>Account Type</label>
            <p>Hunter</p>
          </div>

          <div className="field">
            <label>CNIC Number</label>
            {isEditing ? (
              <input name="cnic_number" value={editData.cnic_number || ""}
                onChange={handleChange} maxLength={15} />
            ) : <p>{profile.cnic_number || "N/A"}</p>}
          </div>

          {/* ✅ FIX: Address field add ki gayi — pehle ye yahan thi hi nahi,
              isliye dikhti bhi nahi thi aur edit form se bhejti bhi nahi thi */}
          <div className="field">
            <label>Address</label>
            {isEditing ? (
              <input name="address" value={editData.address || ""}
                onChange={handleChange}
                placeholder="Your full address"
                style={{ width: "100%", boxSizing: "border-box" }} />
            ) : <p>{profile.address || "N/A"}</p>}
          </div>

        </div>

        {isEditing ? (
          <div style={{ display: "flex", gap: "10px", justifyContent: "center", marginTop: "20px", width: "50%", margin: "20px auto 0" }}>
            <button className="btn-profile" style={{ width: "50%", margin: 0 }} onClick={handleSave}>Save</button>
            <button className="btn-cancel"  style={{ width: "50%", margin: 0 }}
              onClick={() => { setIsEditing(false); setEditData(profile); }}>
              Cancel
            </button>
          </div>
        ) : (
          <button className="btn-profile" onClick={() => setIsEditing(true)}>Edit Profile</button>
        )}

      </div>
    </div>
  );
}

export default UserProfile;