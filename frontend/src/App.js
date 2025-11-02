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
                Welcome! This page lets you explore your Letterboxd profile like never before:
                </p>
                <ul>
                <li>Enter your Letterboxd username to get started.</li>
                <li>View personalized statistics based on the year of your watched movies.</li>
                <li>Discover top film recommendations tailored to your viewing history.</li>
                </ul>
                <p>
                Dive in and see your movie journey come to life!
                </p>
            </div>
        </div>
        {/* Username input section below the info box */}
        <div className="input-section">
            <input
            type="text"
            placeholder="Enter your Letterboxd username"
            className="username-input"
            />
            <button className="fetch-button">Fetch Details</button>
        </div>
        </main>
    </div>
  );
}

export default App;
