import './AudioFormatHelp.css'

/**
 * Audio format help component
 * Shows information about supported formats and how to convert
 */
export const AudioFormatHelp = () => (
  <div className="audio-format-help">
    <details>
      <summary>Which audio formats are compatible?</summary>
      <div className="audio-format-help__content">
        <p>
          <strong>Supported formats:</strong>
        </p>
        <ul>
          <li>
            <strong>.mp3</strong> - Compatible with all browsers
          </li>
          <li>
            <strong>.ogg</strong> - Compatible with all browsers
          </li>
          <li>
            <strong>.opus</strong> - Compatible (Chrome, Firefox, Edge)
          </li>
          <li>
            <strong>.wav</strong> - Compatible (large files)
          </li>
          <li>
            <strong>.m4a</strong> - Compatible (Safari, Chrome, Edge)
          </li>
          <li>
            <strong>.flac</strong> - Compatible (Chrome, Edge) - Not in Firefox
          </li>
        </ul>

        <p>
          <strong>Audio not working?</strong>
        </p>
        <p>Convert the file to .mp3 or .ogg using:</p>
        <ul>
          <li>
            <a href="https://www.freeconvert.com/audio-converter" target="_blank" rel="noopener noreferrer">
              FreeConvert
            </a>{' '}
            (online)
          </li>
          <li>
            <a href="https://www.audacityteam.org/" target="_blank" rel="noopener noreferrer">
              Audacity
            </a>{' '}
            (free software)
          </li>
          <li>
            FFmpeg (command line): <code>ffmpeg -i song.opus song.mp3</code>
          </li>
        </ul>
      </div>
    </details>
  </div>
)
