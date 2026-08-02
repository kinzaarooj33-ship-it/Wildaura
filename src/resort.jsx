import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./resort.css";
import Navbar from "./components/Navbar";

const ITEMS_PER_PAGE = 10;

function Resort() {
  const [resortsData, setResortsData] = useState([]);
  const [search, setSearch] = useState("");
  const [imgErrors, setImgErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();
  const location = useLocation();
  const isGuider = location.pathname.startsWith('/guider/');

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/resorts")
      .then((res) => {
        setResortsData(res.data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Error fetching resorts:", err);
        setLoading(false);
      });
  }, []);

  const handleImgError = (id) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
  };

  const filtered = resortsData.filter((r) =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  if (loading) {
    return <h3 style={{ textAlign: "center", marginTop: "100px" }}>Loading resorts...</h3>;
  }

  return (
    <>
      {!isGuider && <Navbar />}
      <div className="si-page">
        <div className="si-container">
          <h1 className="si-title">Resort Info</h1>

          <div className="si-search-wrap">
            <span className="si-search-icon">&#128269;</span>
            <input
              className="si-search"
              type="text"
              placeholder="Search here"
              value={search}
              onChange={handleSearch}
            />
          </div>

          <div className="si-grid">
            {currentItems.map((resort) => (
              <div className="si-card" key={resort.id}>
                <div className="si-img-wrap">
                  {imgErrors[resort.id] ? (
                    <div className="si-img-placeholder">
                      <span>{resort.name[0]}</span>
                    </div>
                  ) : (
                    <img
                      src={`http://localhost:3000/uploads/${resort.image}`}
                      alt={resort.name}
                      className="si-img"
                      onError={() => handleImgError(resort.id)}
                    />
                  )}
                </div>

                <p className="si-name">{resort.name}</p>

                <button
                  className="si-btn"
                  onClick={() =>
                    navigate(
                      isGuider
                        ? `/guider/resort-detail/${resort.id}`
                        : `/resort-detail/${resort.id}`
                    )
                  }
                >
                  Details
                </button>
              </div>
            ))}

            {filtered.length === 0 && (
              <p className="si-empty">No resorts found for "{search}"</p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="si-pagination">
              <button
                className="si-page-btn"
                onClick={() => setCurrentPage((prev) => prev - 1)}
                disabled={currentPage === 1}
              >
                ← Prev
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  className={`si-page-btn ${currentPage === page ? "active" : ""}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              ))}

              <button
                className="si-page-btn"
                onClick={() => setCurrentPage((prev) => prev + 1)}
                disabled={currentPage === totalPages}
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

export default Resort;