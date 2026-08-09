import React from "react";
import "./App.css";
import logo from "./logo.webp"; // Place logo in src or public folder

function App() {
  const [selectedFile, setSelectedFile] = React.useState(null);
  const [statusMessage, setStatusMessage] = React.useState("");
  const [isAnalyzing, setIsAnalyzing] = React.useState(false);
  const fileInputRef = React.useRef(null);

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

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.detail || "Unexpected upload error.");
      }

      // Keep the selected file name visible in the input after successful processing.
      // Do not clear selectedFile so the label still shows the ZIP name.
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
      </main>
    </div>
  );
}

export default App;
