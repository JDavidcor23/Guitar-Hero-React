import React from 'react';
import './CassetteInput.css';

interface CassetteInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onEnter?: () => void;
}

export const CassetteInput: React.FC<CassetteInputProps> = ({ 
  value, 
  onChange, 
  placeholder = "Tu nombre aquí...",
  onEnter
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && onEnter) {
      onEnter();
    }
  };

  return (
    <div className="cassette-input-wrapper">
      <div className="cassette">
        {/* Corner Screws */}
        <div className="corner-screw top-left" />
        <div className="corner-screw top-right" />
        <div className="corner-screw bottom-left" />
        <div className="corner-screw bottom-right" />

        {/* Top Label (The Input Area) */}
        <div className="label">
          <div className="label-letter">A</div>
          <div className="label-lines">
            <div className="label-line" />
            <div className="label-line" />
            <div className="label-line" />
          </div>
          <input 
            type="text" 
            className="label-input" 
            placeholder={placeholder}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={handleKeyDown}
            maxLength={20}
            autoFocus
          />
        </div>

        {/* Orange Section */}
        <div className="orange-section">
          <div className="inner-window">
            {/* Left Reel */}
            <div className="reel">
              <div className="reel-lines">
                <div className="reel-line" />
                <div className="reel-line" />
                <div className="reel-line" />
                <div className="reel-line" />
              </div>
            </div>

            {/* Center Space */}
            <div className="center-space" />

            {/* Right Reel */}
            <div className="reel">
              <div className="reel-lines">
                <div className="reel-line" />
                <div className="reel-line" />
                <div className="reel-line" />
                <div className="reel-line" />
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="bottom-section">
          <div className="bottom-dot" />
          <div className="bottom-dot" />
          <div className="center-screw" />
          <div className="bottom-dot" />
          <div className="bottom-dot" />
        </div>
      </div>
    </div>
  );
};
