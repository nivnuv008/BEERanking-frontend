import React from 'react';
import '../styles/WelcomePage.css';

function WelcomePage() {
  return (
    <div className="welcome-container">
      <div className="welcome-content">
        {/* Beer Icon SVG */}
        <div className="beer-icon">
          <svg viewBox="0 0 200 300" xmlns="http://www.w3.org/2000/svg">
            {/* Left Beer Bottle */}
            <g>
              <path d="M 50 80 L 50 220 Q 50 240 60 240 L 90 240 Q 100 240 100 220 L 100 80 Z" fill="#8B6914" stroke="#2C1810" strokeWidth="2"/>
              <rect x="50" y="80" width="50" height="40" fill="#D4A644" stroke="#2C1810" strokeWidth="2"/>
              <circle cx="70" cy="90" r="3" fill="white" opacity="0.6"/>
              <circle cx="85" cy="85" r="2.5" fill="white" opacity="0.4"/>
            </g>
            
            {/* Right Beer Bottle */}
            <g>
              <path d="M 100 80 L 100 220 Q 100 240 110 240 L 140 240 Q 150 240 150 220 L 150 80 Z" fill="#8B6914" stroke="#2C1810" strokeWidth="2"/>
              <rect x="100" y="80" width="50" height="40" fill="#D4A644" stroke="#2C1810" strokeWidth="2"/>
              <circle cx="120" cy="90" r="3" fill="white" opacity="0.6"/>
              <circle cx="135" cy="85" r="2.5" fill="white" opacity="0.4"/>
            </g>

            {/* Bottle Caps */}
            <ellipse cx="75" cy="75" rx="12" ry="4" fill="#D4A644" stroke="#2C1810" strokeWidth="1.5"/>
            <ellipse cx="125" cy="75" rx="12" ry="4" fill="#D4A644" stroke="#2C1810" strokeWidth="1.5"/>
            
            {/* Bottle Necks */}
            <rect x="70" y="60" width="10" height="20" fill="#8B6914" stroke="#2C1810" strokeWidth="1.5"/>
            <rect x="120" y="60" width="10" height="20" fill="#8B6914" stroke="#2C1810" strokeWidth="1.5"/>

            {/* Cheers sparkles around bottles */}
            <circle cx="40" cy="50" r="3" fill="#F4B860" opacity="0.8"/>
            <circle cx="50" cy="30" r="2.5" fill="#F4B860" opacity="0.8"/>
            <circle cx="70" cy="20" r="3" fill="#F4B860" opacity="0.8"/>
            <circle cx="100" cy="15" r="2.5" fill="#F4B860" opacity="0.8"/>
            <circle cx="130" cy="20" r="3" fill="#F4B860" opacity="0.8"/>
            <circle cx="150" cy="30" r="2.5" fill="#F4B860" opacity="0.8"/>
            <circle cx="160" cy="50" r="3" fill="#F4B860" opacity="0.8"/>

            {/* Lines radiating from bottles */}
            <line x1="35" y1="60" x2="45" y2="40" stroke="#F4B860" strokeWidth="2" opacity="0.7"/>
            <line x1="55" y1="35" x2="65" y2="15" stroke="#F4B860" strokeWidth="2" opacity="0.7"/>
            <line x1="135" y1="15" x2="145" y2="35" stroke="#F4B860" strokeWidth="2" opacity="0.7"/>
            <line x1="165" y1="40" x2="155" y2="60" stroke="#F4B860" strokeWidth="2" opacity="0.7"/>
          </svg>
        </div>

        {/* Text Content */}
        <h1 className="welcome-title">Welcome to BEERanking</h1>
        <p className="welcome-tagline">
          Rate, rank, and discover the best beers while connecting with fellow beer enthusiasts.
        </p>

        {/* Action Buttons */}
        <div className="button-container">
          <button className="btn btn-primary">Sign up</button>
          <button className="btn btn-secondary">Sign in</button>
        </div>
      </div>
    </div>
  );
}

export default WelcomePage;
