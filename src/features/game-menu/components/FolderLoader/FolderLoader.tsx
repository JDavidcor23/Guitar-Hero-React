import React from 'react'

interface FolderLoaderProps {
  /** Whether a chart/midi file is being loaded */
  isLoading: boolean
  /** Whether audio is being loaded */
  isAudioLoading: boolean
  /** Handler for folder input change */
  onFolderChange: (event: React.ChangeEvent<HTMLInputElement>) => void
}

/** Divider + folder upload section for loading custom songs */
export const FolderLoader = ({
  isLoading,
  isAudioLoading,
  onFolderChange,
}: FolderLoaderProps) => (
  <>
    <div className="game-menu__divider">
      <span>or upload your own files</span>
    </div>

    <div className="game-menu__load-section">
      <div className="game-menu__file-group game-menu__file-group--primary">
        <span className="game-menu__file-label">📁 Carpeta de canción:</span>
        <input
          type="file"
          id="folder-input"
          onChange={onFolderChange}
          className="game-menu__file-input"
          {...({ webkitdirectory: '', directory: '' } as React.InputHTMLAttributes<HTMLInputElement>)}
        />
        <label htmlFor="folder-input" className="game-menu__btn game-menu__btn--folder">
          {isLoading || isAudioLoading ? 'Cargando...' : 'Select Folder'}
        </label>
      </div>
    </div>
  </>
)
