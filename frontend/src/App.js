import React from "react";
import "./App.css";
import logo from "./logo.webp"; // Place logo in src or public folder

function App() {
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
          <input
            type="file"
            accept=".zip"
            className="zip-input"
          />
          <button className="fetch-button">Analyze ZIP</button>
        </div>
      </main>
    </div>
  );
}

export default App;
