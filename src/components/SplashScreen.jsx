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
            <div className={`splash-content ${showContent ? 'visible' : ''}`}>
                {/* Rotating Globe/Planet */}
                <div className="planet-container">
                    <div className="planet">
                        <div className="planet-surface">
                            {/* Continent shapes */}
                            <div className="continent continent-1"></div>
                            <div className="continent continent-2"></div>
                            <div className="continent continent-3"></div>
                        </div>
                        <div className="planet-glow"></div>
                    </div>
                    {/* Orbiting dot */}
                    <div className="orbit">
                        <div className="orbit-dot"></div>
                    </div>
                </div>

                {/* App Title */}
                <h1 className="splash-title">Where In World</h1>

                {/* Subtitle */}
                <p className="splash-subtitle">See friends by City</p>
            </div>

            <style>{`
        .splash-screen {
          position: fixed;
          inset: 0;
          background: linear-gradient(180deg, #0a0a0f 0%, #1a1a2e 50%, #0a0a0f 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10000;
          opacity: 1;
          transition: opacity 0.5s ease-out;
        }

        .splash-screen.transitioning {
          opacity: 0;
        }

        .splash-content {
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
          width: 10rem;
          height: 10rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .planet {
          width: 8rem;
          height: 8rem;
          border-radius: 50%;
          background: linear-gradient(135deg, #1a1a2e 0%, #2a2a4e 50%, #1a1a2e 100%);
          position: relative;
          overflow: hidden;
          animation: planetRotate 20s linear infinite;
          box-shadow: 
            inset -20px -20px 40px rgba(0, 0, 0, 0.5),
            inset 10px 10px 20px rgba(204, 255, 0, 0.1),
            0 0 60px rgba(204, 255, 0, 0.2);
          border: 2px solid rgba(204, 255, 0, 0.3);
        }

        @keyframes planetRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .planet-surface {
          position: absolute;
          inset: 0;
          animation: surfaceShift 8s ease-in-out infinite alternate;
        }

        @keyframes surfaceShift {
          from { transform: translateX(-10%); }
          to { transform: translateX(10%); }
        }

        .continent {
          position: absolute;
          background: var(--accent-lime, #CCFF00);
          opacity: 0.6;
          border-radius: 40%;
        }

        .continent-1 {
          width: 35%;
          height: 40%;
          top: 20%;
          left: 15%;
          transform: rotate(-15deg);
        }

        .continent-2 {
          width: 25%;
          height: 35%;
          top: 25%;
          right: 20%;
          transform: rotate(10deg);
        }

        .continent-3 {
          width: 30%;
          height: 25%;
          bottom: 20%;
          left: 40%;
          transform: rotate(5deg);
        }

        .planet-glow {
          position: absolute;
          inset: -10px;
          border-radius: 50%;
          background: radial-gradient(
            circle at 30% 30%,
            rgba(204, 255, 0, 0.2) 0%,
            transparent 60%
          );
          animation: glowPulse 3s ease-in-out infinite;
        }

        @keyframes glowPulse {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
        }

        .orbit {
          position: absolute;
          inset: 0;
          animation: orbitRotate 4s linear infinite;
        }

        @keyframes orbitRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .orbit-dot {
          position: absolute;
          width: 0.75rem;
          height: 0.75rem;
          background: var(--accent-lime, #CCFF00);
          border-radius: 50%;
          top: 0;
          left: 50%;
          transform: translateX(-50%);
          box-shadow: 0 0 10px var(--accent-lime, #CCFF00);
        }

        .splash-title {
          font-size: 2rem;
          font-weight: 900;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          font-style: italic;
          transform: skewX(-6deg);
          color: white;
          text-shadow: 0 0 20px rgba(204, 255, 0, 0.3);
          margin: 0;
        }

        .splash-subtitle {
          font-size: 1rem;
          font-weight: 600;
          color: var(--accent-lime, #CCFF00);
          text-transform: uppercase;
          letter-spacing: 0.2em;
          margin: 0;
          opacity: 0.9;
        }
      `}</style>
        </div>
    );
}
