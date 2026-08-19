import React from "react";
import "./App.css";
import logo from "./logo.webp"; // Place logo in src or public folder

function App() {
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [statusMessage, setStatusMessage] = React.useState("");
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const [availableYears, setAvailableYears] = React.useState([]);
  const [selectedYear, setSelectedYear] = React.useState("");
  const [summaryStats, setSummaryStats] = React.useState(null);
  const [profileName, setProfileName] = React.useState("Your");
  const [topRatedFilms, setTopRatedFilms] = React.useState([]);
  const fileInputRef = React.useRef(null);

  const fetchYearSummary = React.useCallback(async (year) => {
    try {
      const response = await fetch(`/year-data?year=${year}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.detail || "Unable to load yearly summary.");
      }

      setProfileName(String(result.profile_name || "Your"));
      setTopRatedFilms(Array.isArray(result.top_rated) ? result.top_rated : []);
      setSummaryStats({
        filmsLogged: Number(result.diary_count || 0),
        filmsReviewed: Number(result.reviews_count || 0),
        filmsRated: Number(result.ratings_count || 0),
        rewatches: Number(result.rewatches_count || 0),
        watchedHours: Number(result.watched_hours || 0),
      });
    } catch (error) {
      setStatusMessage(`Error: ${error.message}`);
      setSummaryStats(null);
    }
  }, []);

  React.useEffect(() => {
    if (!selectedYear) {
      setSummaryStats(null);
      return;
    }

    fetchYearSummary(selectedYear);
  }, [selectedYear, fetchYearSummary]);

  const handleFileChange = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setStatusMessage("");
    }
  };

  const handleClearSelection = () => {
    setSelectedFile(null);
    setStatusMessage("");
    setAvailableYears([]);
    setSelectedYear("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleAnalyzeZip = async () => {
    if (!selectedFile) {
      setStatusMessage("Please choose a ZIP file first.");
      return;
    }

    setIsAnalyzing(true);
    setStatusMessage("");

    const formData = new FormData();
    formData.append("file", selectedFile);

    try {
      const response = await fetch("/analyze-zip", {
        method: "POST",
        body: formData,
      });

      const contentType = response.headers.get("content-type") || "";
      let result = null;

      if (contentType.includes("application/json")) {
        result = await response.json();
      } else {
        const text = await response.text();
        if (!response.ok) {
          if (text.includes("Proxy error") || text.includes("Could not proxy request")) {
            throw new Error("Backend server is not running. Start it with: uvicorn backend.main:app --reload --host 0.0.0.0 --port 8000");
          }
          throw new Error(text || "Unexpected upload error.");
        }
      }

      if (!response.ok) {
        throw new Error(result?.detail || "Unexpected upload error.");
      }

      const years = Array.isArray(result?.years) ? result.years : [];
      setAvailableYears(years);
      setSelectedYear("");
      setProfileName(String(result?.profile_name || "Your"));
      setTopRatedFilms([]);
      setSummaryStats(null);
    } catch (error) {
      setStatusMessage(`Error: ${error.message}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <img src={logo} className="App-logo" alt="logo" />
        <h3 className="sub-heading">Discover Your Movie Story – Stats, Favorites, and Personalized Recommendations!</h3>
      </header>
      <main className="App-main">
        <div className="info-box-div">
          <div className="info-box">
            <p>
              Welcome! This page lets you explore your Letterboxd data like never before:
            </p>
            <ul>
              <li>Upload your Letterboxd export ZIP file to get started.</li>
              <li>View personalized statistics based on your watched movies.</li>
              <li>Discover top film recommendations tailored to your viewing history.</li>
            </ul>
            <p>
              Upload your export and see your movie journey come to life!
            </p>
          </div>
        </div>

        <div className="input-section">
          <div className="zip-input-wrapper">
            <label className="zip-input-label" htmlFor="zip-upload">
              <span className="zip-input-placeholder">
                {selectedFile ? selectedFile.name : "Choose ZIP file..."}
              </span>
            </label>
            <input
              ref={fileInputRef}
              id="zip-upload"
              type="file"
              accept=".zip"
              aria-label="Upload ZIP file"
              className="zip-input-hidden"
              onChange={handleFileChange}
            />
            {selectedFile && (
              <button
                type="button"
                className="zip-cancel-button"
                onClick={handleClearSelection}
                aria-label="Cancel selected ZIP file"
              >
                Cancel
              </button>
            )}
          </div>
          <button
            type="button"
            className="fetch-button"
            onClick={handleAnalyzeZip}
            disabled={isAnalyzing}
          >
            {isAnalyzing ? "Analyzing..." : "Analyze ZIP"}
          </button>
          {statusMessage && <p className="status-message">{statusMessage}</p>}
        </div>

        {availableYears.length > 0 && (
          <div className="year-section">
            <div className="year-selector-wrapper">
              <label htmlFor="year-select" className="year-selector-label">
                Choose year to give summary
              </label>
              <select
                id="year-select"
                className="year-selector"
                value={selectedYear}
                onChange={(event) => setSelectedYear(event.target.value)}
              >
                <option value="">Select a year</option>
                {availableYears.map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
            </div>

            {selectedYear && summaryStats && (
              <div className="year-summary">
                <h2 className="year-summary-title">{profileName}’s {selectedYear} in Film</h2>
                <div className="summary-by-numbers">BY THE NUMBERS</div>

                <div className="summary-cards">
                  <div className="summary-card summary-card-orange">
                    <div className="summary-number">{summaryStats.filmsLogged}</div>
                    <div className="summary-label">Films Logged</div>
                  </div>

                  <div className="summary-card summary-card-green">
                    <div className="summary-number">{summaryStats.filmsReviewed}</div>
                    <div className="summary-label">Films Reviewed</div>
                  </div>

                  <div className="summary-card summary-card-blue">
                    <div className="summary-number">{summaryStats.filmsRated}</div>
                    <div className="summary-label">Films Rated</div>
                  </div>

                  <div className="summary-card summary-card-orange">
                    <div className="summary-number">{summaryStats.rewatches}</div>
                    <div className="summary-label">Rewatches</div>
                  </div>

                </div>

                {topRatedFilms.length > 0 && (
                  <div className="top-rated-section">
                    <h3 className="top-rated-title">HIGHLY RATED {selectedYear} FILMS</h3>
                    <div className="top-rated-grid">
                      {topRatedFilms.map((film, index) => (
                        <div key={`${film.title}-${index}`} className="top-rated-card">
                          <div className="top-rated-poster-wrap">
                            {film.letterboxd_uri ? (
                              <a
                                href={film.letterboxd_uri}
                                target="_blank"
                                rel="noreferrer"
                                className="top-rated-poster-link"
                                title={film.title}
                                aria-label={`Open ${film.title} on Letterboxd`}
                              >
                                <div className="top-rated-poster-fallback">{film.title}</div>
                                <span className="top-rated-hover-link" aria-hidden="true" />
                              </a>
                            ) : (
                              <div className="top-rated-poster-fallback">{film.title}</div>
                            )}
                          </div>
                          <div className="top-rated-stars">{'★'.repeat(Math.max(1, Math.min(5, Math.round(film.average_rating))))}</div>
                          <div className="top-rated-film-title">{film.title}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
