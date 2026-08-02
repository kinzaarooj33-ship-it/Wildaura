import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Navbar from "./components/Navbar";
import "./guiderlist.css";

const ITEMS_PER_PAGE = 10;

function GuiderList() {
  const [guiders, setGuiders] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/guiders")
      .then((res) => {
        const data = res.data;
        const list = data.guiders || data.data || data || [];
        setGuiders(Array.isArray(list) ? list : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = guiders.filter((g) =>
    g.name?.toLowerCase().includes(search.toLowerCase()) ||
    g.address?.toLowerCase().includes(search.toLowerCase()) ||
    g.specialization?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const getInitial = (name) => (name ? name.charAt(0).toUpperCase() : "G");

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="gl-loading">
          <div className="gl-spinner"></div>
          <p>Loading guiders...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="gl-page">
        <div className="gl-container">

          <h1 className="gl-title">Our Expert Guiders</h1>

          {/* SEARCH */}
          <div className="gl-search-wrap">
            <span className="gl-search-icon">🔍</span>
            <input
              className="gl-search"
              type="text"
              placeholder="Search here"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>

          {/* GRID — no extra white box wrapper */}
          <div className="gl-grid">
            {currentItems.length > 0 ? currentItems.map((guider) => (
              <div className="gl-card" key={guider.id}>
                <div className="gl-img-wrap">
                  {guider.photo ? (
                    <img
                      className="gl-img"
                      src={guider.photo}
                      alt={guider.name}
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                  ) : null}
                  <div
                    className="gl-img-placeholder"
                    style={{ display: guider.photo ? "none" : "flex" }}
                  >
                    {getInitial(guider.name)}
                  </div>
                </div>
                <p className="gl-name">{guider.name}</p>
                <p className="gl-area-small">
                  <i className="fa-solid fa-location-dot"></i>
                  {guider.address || "—"}
                </p>
                <button
                  className="gl-btn"
                  onClick={() => navigate(`/guider/${guider.id}`)}
                >
                  Details
                </button>
              </div>
            )) : (
              <p className="gl-empty">
                {search ? `No guiders found for "${search}"` : "No guiders available yet."}
              </p>
            )}
          </div>

          {/* PAGINATION */}
          {totalPages > 1 && (
            <div className="gl-pagination">
              <button className="gl-page-btn" onClick={() => setCurrentPage((p) => p - 1)} disabled={currentPage === 1}>← Prev</button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button key={page} className={`gl-page-btn ${currentPage === page ? "active" : ""}`} onClick={() => setCurrentPage(page)}>{page}</button>
              ))}
              <button className="gl-page-btn" onClick={() => setCurrentPage((p) => p + 1)} disabled={currentPage === totalPages}>Next →</button>
            </div>
          )}

        </div>
      </div>
    </>
  );
}

export default GuiderList;