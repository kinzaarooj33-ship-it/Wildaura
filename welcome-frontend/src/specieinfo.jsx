import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "axios";
import "./specieinfo.css";
import Navbar from "./components/Navbar";

const ITEMS_PER_PAGE = 10;

// Backend base URL - jahan /uploads static folder serve hota hai
const BACKEND_URL = "http://localhost:3000";

// Agar species.image already full URL (http...) hai to waisa hi use karo,
// warna assume karo ke ye sirf filename hai jo backend ke /uploads folder mein hai
const getImageUrl = (image) => {
  if (!image) return "";
  if (image.startsWith("http://") || image.startsWith("https://")) {
    return image;
  }
  return `${BACKEND_URL}/uploads/${image}`;
};

function SpeciesListPage() {
  const [speciesData, setSpeciesData] = useState([]);
  const [search, setSearch] = useState("");
  const [imgErrors, setImgErrors] = useState({});
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);

  const navigate = useNavigate();
  const location = useLocation();
  const isGuider = location.pathname.startsWith('/guider/');

  useEffect(() => {
    axios
      .get("http://localhost:3000/api/species")
      .then((res) => {
        setSpeciesData(res.data.data);
        setLoading(false);
      })
      .catch((err) => {
        console.log("Error fetching species:", err);
        setLoading(false);
      });
  }, []);

  const handleImgError = (id) => {
    setImgErrors((prev) => ({ ...prev, [id]: true }));
  };

  const filtered = speciesData.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentItems = filtered.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setCurrentPage(1);
  };

  if (loading) {
    return <h3 style={{ textAlign: "center" }}>Loading species...</h3>;
  }

  return (
    <>
      {!isGuider && <Navbar />}
      <div className="si-page">
        <div className="si-container">
          <h1 className="si-title">Species Information</h1>

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
            {currentItems.map((species) => (
              <div className="si-card" key={species.id}>
                <div className="si-img-wrap">
                  {imgErrors[species.id] ? (
                    <div className="si-img-placeholder">
                      <span>{species.name[0]}</span>
                    </div>
                  ) : (
                    <img
                      src={getImageUrl(species.image)}
                      alt={species.name}
                      className="si-img"
                      onError={() => handleImgError(species.id)}
                    />
                  )}
                </div>

                <p className="si-name">{species.name}</p>

                <button
                  className="si-btn"
                  onClick={() =>
                    navigate(
                      isGuider
                        ? `/guider/species/${species.name.toLowerCase().replace(/\s/g, "")}`
                        : `/species/${species.name.toLowerCase().replace(/\s/g, "")}`
                    )
                  }
                >
                  Details
                </button>
              </div>
            ))}

            {filtered.length === 0 && (
              <p className="si-empty">No species found for "{search}"</p>
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

export default SpeciesListPage;