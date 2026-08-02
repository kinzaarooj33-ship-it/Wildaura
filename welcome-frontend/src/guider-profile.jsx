import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./guider-profile.css";

function GuiderProfile() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    cnic_number: "",
    phone_number: "+92",
    license_number: "",
    province: "",
    address: "",
    guiding_experience: "",
    price_per_hour: "",
    specialization: "",
    latitude: "",      // ✅ NEW
    longitude: "",     // ✅ NEW
  });

  const [editData, setEditData] = useState({});
  const [isEditing, setIsEditing] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileExists, setProfileExists] = useState(false);

  const provinceLicenseFormats = {
    "Punjab":                     { regex: /^PB-GL-\d{4}-\d{5}$/,  example: "PB-GL-2024-00123"  },
    "Sindh":                      { regex: /^SD-GL-\d{4}-\d{5}$/,  example: "SD-GL-2024-00123"  },
    "Khyber Pakhtunkhwa":         { regex: /^KP-GL-\d{4}-\d{5}$/,  example: "KP-GL-2024-00123"  },
    "Balochistan":                { regex: /^BL-GL-\d{4}-\d{5}$/,  example: "BL-GL-2024-00123"  },
    "Gilgit-Baltistan":           { regex: /^GB-GL-\d{4}-\d{5}$/,  example: "GB-GL-2024-00123"  },
    "Azad Kashmir":               { regex: /^AK-GL-\d{4}-\d{5}$/,  example: "AK-GL-2024-00123"  },
    "Islamabad Capital Territory":{ regex: /^ICT-GL-\d{4}-\d{5}$/, example: "ICT-GL-2024-00123" },
  };

  const specializationOptions = [
    "Wildlife Photography", "Bird Watching", "Mountain Hunting",
    "Forest Hunting", "Trophy Hunting", "Safari Tours",
    "Fishing & Angling", "Nature Trekking", "Other",
  ];

  const provinces = [
    "Punjab", "Sindh", "Khyber Pakhtunkhwa", "Balochistan",
    "Gilgit-Baltistan", "Azad Kashmir", "Islamabad Capital Territory",
  ];

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    const userEmail = user?.email;
    if (!userEmail) return;

    fetch(`http://localhost:3000/guider-profile/${userEmail}`)
      .then(res => res.json())
      .then(data => {
        if (data.profile) {
          setProfileExists(true);
          setIsEditing(false);
          setFormData({
            name: data.profile.name || "",
            cnic_number: data.profile.cnic_number || "",
            phone_number: data.profile.phone_number || "+92",
            license_number: data.profile.license_number || "",
            province: data.profile.province || "",
            address: data.profile.address || "",
            guiding_experience: data.profile.guiding_experience || "",
            price_per_hour: data.profile.price_per_hour || "",
            specialization: data.profile.specialization || "",
            latitude: data.profile.latitude || "",      // ✅ NEW
            longitude: data.profile.longitude || "",    // ✅ NEW
          });

          if (data.profile.profile_image) {
            setProfileImage(`http://localhost:3000/uploads/${data.profile.profile_image}`);
          }

          const updatedUser = { ...user, name: data.profile.name };
          localStorage.setItem("user", JSON.stringify(updatedUser));
        } else {
          setProfileExists(false);
          setIsEditing(true);
        }
      })
      .catch(() => {
        setProfileExists(false);
        setIsEditing(true);
      });
  }, []);

  const showMessage = (msg, type) => {
    setMessage(msg);
    setMessageType(type);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 5000);
  };

  const handleEditClick = () => {
    setEditData({ ...formData });
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditData({});
    setImagePreview(null);
    setIsEditing(false);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showMessage("❌ Sirf image file select karein.", "error");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      showMessage("❌ Image size 5MB se kam honi chahiye.", "error");
      return;
    }
    setImagePreview(URL.createObjectURL(file));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const update = (val) => setEditData(prev => ({ ...prev, [name]: val }));

    if (name === "phone_number") {
      if (!value.startsWith("+92")) return;
      const afterPrefix = value.slice(3);
      if (!/^\d*$/.test(afterPrefix)) return;
      if (afterPrefix.length > 10) return;
      update(value);
      return;
    }

    if (name === "cnic_number") {
      if (!/^[\d-]*$/.test(value)) return;
      let raw = value.replace(/-/g, "");
      if (raw.length > 13) return;
      let formatted = raw;
      if (raw.length > 5)  formatted = raw.slice(0, 5) + "-" + raw.slice(5);
      if (raw.length > 12) formatted = formatted.slice(0, 13) + "-" + formatted.slice(13);
      update(formatted);
      return;
    }

    if (name === "price_per_hour") {
      if (value !== "" && (isNaN(value) || Number(value) < 0)) return;
      update(value);
      return;
    }

    if (name === "latitude" || name === "longitude") {
      if (value !== "" && isNaN(value)) return;
      update(value);
      return;
    }

    update(value);
  };

  // ✅ NEW: Auto-detect current location
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      showMessage("❌ Your browser doesn't support geolocation.", "error");
      return;
    }

    setIsLoadingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const lat = position.coords.latitude.toFixed(6);
        const lng = position.coords.longitude.toFixed(6);
        
        setEditData(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng
        }));
        
        showMessage(`✅ Location detected: ${lat}, ${lng}`, "success");
        setIsLoadingLocation(false);
      },
      (error) => {
        console.error("Location error:", error);
        let errorMsg = "❌ Unable to get location. ";
        switch(error.code) {
          case error.PERMISSION_DENIED:
            errorMsg += "Please allow location access in browser settings.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMsg += "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMsg += "Location request timed out.";
            break;
          default:
            errorMsg += "Please enable GPS and try again.";
        }
        showMessage(errorMsg, "error");
        setIsLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const data = editData;

    if (!data.name.trim()) { showMessage("❌ Name is required.", "error"); return; }

    const phoneDigits = data.phone_number.replace("+92", "");
    if (!/^\d{10}$/.test(phoneDigits)) {
      showMessage("❌ Phone must be 10 digits after +92.", "error"); return;
    }

    if (!/^\d{5}-\d{7}-\d{1}$/.test(data.cnic_number)) {
      showMessage("❌ Invalid CNIC format. Example: 35201-1234567-1", "error"); return;
    }

    if (!data.province) { showMessage("❌ Please select province.", "error"); return; }

    const format = provinceLicenseFormats[data.province];
    if (format && !format.regex.test(data.license_number)) {
      showMessage(`❌ Invalid license format. Example: ${format.example}`, "error"); return;
    }

    if (!data.address.trim()) { showMessage("❌ Address is required.", "error"); return; }
    if (!data.specialization) { showMessage("❌ Please select specialization.", "error"); return; }
    if (!data.price_per_hour || Number(data.price_per_hour) <= 0) {
      showMessage("❌ Please enter price per hour.", "error"); return;
    }

    setLoading(true);

    const user = JSON.parse(localStorage.getItem("user"));
    const userEmail = user?.email;

    if (!userEmail) {
      showMessage("❌ Please login first!", "error");
      setTimeout(() => navigate("/login"), 2000);
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("email", userEmail);
      formDataToSend.append("name", data.name);
      formDataToSend.append("cnic_number", data.cnic_number);
      formDataToSend.append("license_number", data.license_number);
      formDataToSend.append("guiding_experience", Number(data.guiding_experience));
      formDataToSend.append("phone_number", data.phone_number);
      formDataToSend.append("province", data.province);
      formDataToSend.append("address", data.address);
      formDataToSend.append("price_per_hour", Number(data.price_per_hour));
      formDataToSend.append("specialization", data.specialization);
      formDataToSend.append("latitude", data.latitude || null);      // ✅ NEW
      formDataToSend.append("longitude", data.longitude || null);    // ✅ NEW

      if (fileInputRef.current?.files[0]) {
        formDataToSend.append("profile_image", fileInputRef.current.files[0]);
      }

      const res = await fetch("http://localhost:3000/guider-profile", {
        method: "POST",
        body: formDataToSend,
      });

      const result = await res.json();

      if (res.ok) {
        setFormData({ ...data });
        setProfileExists(true);
        setIsEditing(false);
        setEditData({});

        if (imagePreview) {
          setProfileImage(imagePreview);
          setImagePreview(null);
        }

        const updatedUser = { ...user, name: data.name };
        localStorage.setItem("user", JSON.stringify(updatedUser));

        showMessage("✅ Profile saved successfully!", "success");

        if (!profileExists) {
          setTimeout(() => navigate("/guider-dashboard"), 2000);
        }
      } else {
        showMessage("❌ " + (result.message || "Error occurred"), "error");
      }
    } catch (err) {
      showMessage("❌ Something went wrong. Please try again.", "error");
    } finally {
      setLoading(false);
    }
  };

  const activeData = isEditing ? editData : formData;
  const selectedFormat = activeData.province ? provinceLicenseFormats[activeData.province] : null;
  const displayImage = imagePreview || profileImage;

  return (
    <div className="page">

      {showToast && (
        <div className={`toast ${messageType}`} onClick={() => setShowToast(false)}>
          <span className="toast-msg">{message}</span>
          <span className="toast-close">✕</span>
        </div>
      )}

      <div className="hunter-container">
        <button type="button" className="back-btn" onClick={() => navigate(-1)}>← Back</button>

        {/* PROFILE IMAGE SECTION */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginBottom: '24px' }}>
          <div style={{ position: 'relative', width: '120px', height: '120px' }}>
            <div style={{
              width: '120px',
              height: '120px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '3px solid #d97706',
              backgroundColor: '#f3f4f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              {displayImage ? (
                <img src={displayImage} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span style={{ fontSize: '48px' }}>👤</span>
              )}
            </div>

            {isEditing && (
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'absolute', bottom: '4px', right: '4px',
                  width: '28px', height: '28px', borderRadius: '50%',
                  backgroundColor: '#d97706', display: 'flex',
                  alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', border: '2px solid white',
                  fontSize: '13px', boxShadow: '0 2px 6px rgba(0,0,0,0.2)',
                }}
              >✏️</div>
            )}
          </div>

          <input type="file" ref={fileInputRef} accept="image/*" onChange={handleImageChange} style={{ display: 'none' }} />

          {!isEditing && formData.name && (
            <h3 style={{ marginTop: '10px', fontSize: '1.1rem', fontWeight: 600, color: '#1f2937' }}>
              {formData.name}
            </h3>
          )}
        </div>

        {/* VIEW MODE */}
        {profileExists && !isEditing ? (
          <>
            <h2>My Profile</h2>

            <div className="profile-view-grid">
              <div className="profile-view-item">
                <span className="view-label">Name</span>
                <span className="view-value">{formData.name || "—"}</span>
              </div>
              <div className="profile-view-item">
                <span className="view-label">Phone Number</span>
                <span className="view-value">{formData.phone_number || "—"}</span>
              </div>
              <div className="profile-view-item">
                <span className="view-label">CNIC Number</span>
                <span className="view-value">{formData.cnic_number || "—"}</span>
              </div>
              <div className="profile-view-item">
                <span className="view-label">Province</span>
                <span className="view-value">{formData.province || "—"}</span>
              </div>
              <div className="profile-view-item">
                <span className="view-label">License Number</span>
                <span className="view-value">{formData.license_number || "—"}</span>
              </div>
              <div className="profile-view-item">
                <span className="view-label">Guiding Experience</span>
                <span className="view-value">
                  {formData.guiding_experience ? `${formData.guiding_experience} years` : "—"}
                </span>
              </div>
              <div className="profile-view-item">
                <span className="view-label">Price Per Hour</span>
                <span className="view-value">
                  {formData.price_per_hour ? `PKR ${Number(formData.price_per_hour).toLocaleString()}/hr` : "—"}
                </span>
              </div>
              <div className="profile-view-item">
                <span className="view-label">Address</span>
                <span className="view-value">{formData.address || "—"}</span>
              </div>
              <div className="profile-view-item">
                <span className="view-label">Specialization</span>
                <span className="view-value">{formData.specialization || "—"}</span>
              </div>
              {/* ✅ NEW: Display Location in View Mode */}
              <div className="profile-view-item">
                <span className="view-label">📍 Latitude</span>
                <span className="view-value">{formData.latitude || "Not set"}</span>
              </div>
              <div className="profile-view-item">
                <span className="view-label">📍 Longitude</span>
                <span className="view-value">{formData.longitude || "Not set"}</span>
              </div>
            </div>

            <div className="profile-btn-row">
              <button type="button" className="edit-profile-btn" onClick={handleEditClick}>
                ✏️ Edit Profile
              </button>
              <button type="button" className="next-btn" onClick={() => navigate("/guider-dashboard")}>
                Next →
              </button>
            </div>
          </>

        ) : (

          /* FORM MODE */
          <>
            <h2>{profileExists ? "Edit Your Profile" : "Complete Your Guider Profile"}</h2>

            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div>
                  <label>Name</label>
                  <input type="text" name="name" placeholder="Your full name"
                    value={activeData.name} onChange={handleChange} />
                </div>
                <div>
                  <label>Phone Number</label>
                  <input type="tel" name="phone_number" placeholder="+92XXXXXXXXXX"
                    value={activeData.phone_number} onChange={handleChange} maxLength={13} />
                </div>
                <div>
                  <label>CNIC Number</label>
                  <input type="text" name="cnic_number" placeholder="e.g. 35201-1234567-1"
                    value={activeData.cnic_number} onChange={handleChange} maxLength={15} />
                </div>
                <div>
                  <label>Province</label>
                  <select name="province" value={activeData.province} onChange={handleChange}>
                    <option value="">Select Province</option>
                    {provinces.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label>Guiding License Number</label>
                  <input type="text" name="license_number"
                    placeholder={selectedFormat ? `e.g. ${selectedFormat.example}` : "Select province first"}
                    value={activeData.license_number} onChange={handleChange} />
                  {selectedFormat && <span className="field-hint">Format: {selectedFormat.example}</span>}
                </div>
                <div>
                  <label>Guiding Experience (Years)</label>
                  <input type="number" name="guiding_experience" placeholder="Years of experience"
                    value={activeData.guiding_experience} onChange={handleChange} min={0} />
                </div>
                <div>
                  <label>Price Per Hour (PKR)</label>
                  <input type="number" name="price_per_hour" placeholder="e.g. 2000"
                    value={activeData.price_per_hour} onChange={handleChange} min={0} />
                </div>
                <div>
                  <label>Address</label>
                  <input type="text" name="address" placeholder="Your full address"
                    value={activeData.address} onChange={handleChange} />
                </div>
                <div>
                  <label>Specialization</label>
                  <select name="specialization" value={activeData.specialization} onChange={handleChange}>
                    <option value="">Select Specialization</option>
                    {specializationOptions.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                {/* ✅ NEW: Location Fields Section */}
                <div className="form-full-width">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                    <label style={{ fontWeight: 'bold', fontSize: '16px' }}>📍 Emergency Location (GPS Coordinates)</label>
                    <button 
                      type="button" 
                      onClick={getCurrentLocation}
                      disabled={isLoadingLocation}
                      style={{
                        padding: '8px 16px',
                        backgroundColor: '#d97706',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px'
                      }}
                    >
                      <i className="fa-solid fa-location-dot"></i>
                      {isLoadingLocation ? "Detecting..." : "📍 Auto-Detect Location"}
                    </button>
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                    <div>
                      <label>Latitude</label>
                      <input 
                        type="text" 
                        name="latitude" 
                        placeholder="e.g., 35.8512"
                        value={activeData.latitude || ''} 
                        onChange={handleChange}
                      />
                    </div>
                    <div>
                      <label>Longitude</label>
                      <input 
                        type="text" 
                        name="longitude" 
                        placeholder="e.g., 71.7864"
                        value={activeData.longitude || ''} 
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  <small style={{ color: '#6b7280', display: 'block', marginTop: '8px' }}>
                    💡 Tip: Click "Auto-Detect Location" to automatically get your current GPS coordinates, 
                    or manually enter from <a href="https://www.google.com/maps" target="_blank" rel="noopener noreferrer">Google Maps</a>
                  </small>
                </div>
              </div>

              <div className="form-action-row">
                <button type="submit" disabled={loading}>
                  {loading ? "Saving..." : profileExists ? "Update Profile" : "Submit Information"}
                </button>
                {profileExists && (
                  <button type="button" className="cancel-edit-btn" onClick={handleCancel}>
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

export default GuiderProfile;