import React, { useState, useEffect, useRef } from 'react';
import './StartScreen.css';

// Import assets from src/assets/start-screen/
import backgroundPath from '../../assets/start-screen/background.png';
import logoPath from '../../assets/start-screen/logo.png';
import videoPath from '../../assets/start-screen/intro.mp4';

interface StartScreenProps {
  onComplete: () => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({ onComplete }) => {
  const [phase, setPhase] = useState<'idle' | 'transitioning' | 'video' | 'finishing'>('idle');
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === 'Space' && phase === 'idle') {
        startTransition();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [phase]);

  const startTransition = () => {
    setPhase('transitioning');
    
    // Wait for text to fade out before showing video
    setTimeout(() => {
      setPhase('video');
      // Delay playing to ensure container is visible
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(err => {
            console.warn("Video autoplay failed:", err);
            // If video fails or doesn't exist, just proceed to game
            onComplete();
          });
        }
      }, 100);
    }, 2000); // Matches CSS transition duration
  };

  const handleVideoEnd = () => {
    setPhase('finishing');
    setTimeout(() => {
      onComplete();
    }, 1000); // Duration of the final fade-out
  };

  return (
    <div className="start-screen-container">
      {/* Static Background Image */}
      <img 
        src={backgroundPath} 
        alt="" 
        className="background-image" 
        onError={(e) => (e.currentTarget.style.display = 'none')}
      />

      {/* Centered Logo */}
      <div className={`logo-container ${phase !== 'idle' ? 'fading-out' : ''}`}>
        <img 
          src={logoPath} 
          alt="Rock Hero Logo" 
          className="logo-image" 
          onError={(e) => (e.currentTarget.style.display = 'none')}
        />
        <div className="press-start-text">Presiona Espacio</div>
      </div>

      {/* Video Overlay */}
      <div className={`video-container ${phase === 'video' ? 'visible' : ''} ${phase === 'finishing' ? 'fading-out' : ''}`}>
        <video 
          ref={videoRef}
          className="main-video"
          onEnded={handleVideoEnd}
          playsInline
        >
          <source src={videoPath} type="video/mp4" />
        </video>
      </div>
    </div>
  );
};
