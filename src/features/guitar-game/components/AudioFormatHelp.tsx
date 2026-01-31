import './AudioFormatHelp.css'

/**
 * Componente de ayuda para formatos de audio
 * Muestra información sobre formatos soportados y cómo convertir
 */
export const AudioFormatHelp = () => (
  <div className="audio-format-help">
    <details>
      <summary>¿Qué formatos de audio son compatibles?</summary>
      <div className="audio-format-help__content">
        <p>
          <strong>Formatos soportados:</strong>
        </p>
        <ul>
          <li>
            <strong>.mp3</strong> - Compatible con todos los navegadores
          </li>
          <li>
            <strong>.ogg</strong> - Compatible con todos los navegadores
          </li>
          <li>
            <strong>.opus</strong> - Compatible (Chrome, Firefox, Edge)
          </li>
          <li>
            <strong>.wav</strong> - Compatible (archivos grandes)
          </li>
          <li>
            <strong>.m4a</strong> - Compatible (Safari, Chrome, Edge)
          </li>
          <li>
            <strong>.flac</strong> - Compatible (Chrome, Edge) - No en Firefox
          </li>
        </ul>

        <p>
          <strong>¿Tu audio no funciona?</strong>
        </p>
        <p>Convierte el archivo a .mp3 u .ogg usando:</p>
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
            (software gratis)
          </li>
          <li>
            FFmpeg (línea de comandos): <code>ffmpeg -i song.opus song.mp3</code>
          </li>
        </ul>
      </div>
    </details>
  </div>
)
