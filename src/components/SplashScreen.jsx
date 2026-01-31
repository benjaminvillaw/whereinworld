import { useState, useEffect } from 'react';

export function SplashScreen({ onComplete }) {
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Show content after initial fade in
    const showTimer = setTimeout(() => {
      setShowContent(true);
    }, 300);

    // Start transition after splash display
    const transitionTimer = setTimeout(() => {
      setIsTransitioning(true);
    }, 2500);

    // Complete transition
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, 3000);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(transitionTimer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className={`splash-screen ${isTransitioning ? 'transitioning' : ''}`}>
      {/* Background Layers */}
      <div className="splash-bg-base"></div>
      <div className="splash-wave splash-wave-1">
        <svg fill="currentColor" preserveAspectRatio="none" viewBox="0 0 375 500">
          <path d="M0 0H375V350C375 350 300 420 220 380C140 340 80 440 0 400V0Z"></path>
        </svg>
      </div>
      <div className="splash-wave splash-wave-2">
        <svg fill="currentColor" preserveAspectRatio="none" viewBox="0 0 500 200">
          <path d="M0 50C150 150 350 0 500 100V200H0V50Z"></path>
        </svg>
      </div>
      <div className="splash-wave splash-wave-3">
        <svg fill="currentColor" preserveAspectRatio="none" viewBox="0 0 375 400">
          <path d="M0 400V100C50 150 150 20 250 80C350 140 375 50 375 50V400H0Z"></path>
        </svg>
      </div>
      <div className="splash-wave splash-wave-4">
        <svg fill="currentColor" preserveAspectRatio="none" viewBox="0 0 500 150">
          <path d="M0 100C100 0 300 150 500 50V150H0V100Z"></path>
        </svg>
      </div>

      <div className={`splash-content ${showContent ? 'visible' : ''}`}>
        {/* Planet with Orbit Ring */}
        <div className="planet-container">
          <div className="planet">
            <div className="planet-top-overlay"></div>
          </div>
          <div className="orbit-ring"></div>
        </div>

        {/* App Title */}
        <h1 className="splash-title">
          WHERE<br />
          IN<br />
          WORLD
        </h1>

        {/* Subtitle */}
        <p className="splash-subtitle">See friends by City</p>
        <p className="splash-established">EST. 2025</p>
      </div>

      <style>{`
        .splash-screen {
          position: fixed;
          inset: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          opacity: 1;
          transition: opacity 0.5s ease-out;
          overflow: hidden;
        }

        .splash-screen.transitioning {
          opacity: 0;
        }

        /* Background layers */
        .splash-bg-base {
          position: absolute;
          inset: 0;
          background: #6EE7B7;
          z-index: 0;
        }

        .splash-wave {
          position: absolute;
          z-index: 1;
        }

        .splash-wave svg {
          width: 100%;
          height: 100%;
        }

        .splash-wave-1 {
          top: -10%;
          left: 0;
          width: 100%;
          height: 60%;
          color: #FF8A80;
        }

        .splash-wave-2 {
          top: 20%;
          left: -20%;
          width: 140%;
          height: 30%;
          color: #6EE7B7;
          opacity: 0.9;
          transform: rotate(-6deg);
        }

        .splash-wave-3 {
          bottom: 0;
          left: 0;
          width: 100%;
          height: 50%;
          color: #FF8A80;
        }

        .splash-wave-4 {
          bottom: -5%;
          right: 0;
          width: 120%;
          height: 25%;
          color: #6EE7B7;
          transform: rotate(3deg);
        }

        .splash-content {
          position: relative;
          z-index: 10;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 1.5rem;
          opacity: 0;
          transform: translateY(20px);
          transition: all 0.6s ease-out;
        }

        .splash-content.visible {
          opacity: 1;
          transform: translateY(0);
        }

        .planet-container {
          position: relative;
          width: 8rem;
          height: 8rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .planet {
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: black;
          border: 4px solid white;
          box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
          position: relative;
          overflow: hidden;
        }

        .planet-top-overlay {
          position: absolute;
          width: 100%;
          height: 50%;
          background: black;
          top: 0;
          border-radius: 50% 50% 0 0;
          z-index: 10;
          clip-path: polygon(0 0, 100% 0, 100% 80%, 0 80%);
        }

        .orbit-ring {
          position: absolute;
          width: 140%;
          height: 40%;
          border: 6px solid white;
          border-radius: 100%;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-12deg);
          z-index: 20;
          background: transparent;
        }

        .splash-title {
          font-family: 'Archivo Black', sans-serif;
          font-size: 3rem;
          font-weight: 900;
          line-height: 0.9;
          letter-spacing: -0.02em;
          text-align: center;
          font-style: italic;
          transform: rotate(-2deg);
          color: black;
          margin: 0;
          mix-blend-mode: hard-light;
          text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .splash-subtitle {
          font-size: 1.125rem;
          font-weight: 700;
          color: black;
          text-transform: uppercase;
          letter-spacing: 0.25em;
          margin: 0;
        }

        .splash-established {
          font-size: 0.75rem;
          font-weight: 700;
          color: black;
          opacity: 0.6;
          text-transform: uppercase;
          letter-spacing: 0.3em;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
