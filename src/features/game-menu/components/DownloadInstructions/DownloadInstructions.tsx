import { useState } from 'react'
import './DownloadInstructions.css'

export const DownloadInstructions = () => {
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="download-instructions">
      <button 
        className="download-instructions__toggle" 
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <span className="download-instructions__icon">🎵</span>
        How to download more songs?
        <span className={`download-instructions__arrow ${isOpen ? 'open' : ''}`}>▼</span>
      </button>

      {isOpen && (
        <div className="download-instructions__content">
          <div className="instruction-step">
            <h3>Step 1: Find your favorite songs</h3>
            <p>
              Head over to <a href="https://enchor.us" target="_blank" rel="noopener noreferrer" className="enchor-link">enchor.us</a>, the ultimate community-driven database for custom charts. Search for any song or artist you'd like to play!
            </p>
            <img 
              src="https://res.cloudinary.com/dhu6ga6hl/image/upload/v1773147485/ed7b07d5-8c50-4645-8a5c-c9854f39407c.png" 
              alt="Chart Download App Interface" 
              className="instruction-image"
            />
          </div>

          <div className="instruction-step">
            <h3>Step 2: Download the Chart</h3>
            <p>Once you find the perfect track, simply click the download icon to save the song file (ZIP) to your computer.</p>
            <img 
              src="https://res.cloudinary.com/dhu6ga6hl/image/upload/v1773147536/7374e1ee-7998-4d13-9e8c-4ec55193bdad.png" 
              alt="Searching and downloading a song" 
              className="instruction-image"
            />
          </div>

          <div className="instruction-step">
            <h3>Step 3: Extract the Files</h3>
            <p>Extract the contents of the downloaded ZIP file into a folder anywhere on your computer. Then, click the "Load Song Folder" button below to select it!</p>
            <img 
              src="https://res.cloudinary.com/dhu6ga6hl/image/upload/v1773147599/271eea74-2ceb-4494-af4a-3638d312deea.png" 
              alt="Extracting files to a folder" 
              className="instruction-image"
            />
          </div>
        </div>
      )}
    </div>
  )
}
