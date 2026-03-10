import { useState, useCallback } from 'react'
import type { SongData, SongMetadata } from '../types/GuitarGame.types'
import type { UserLoadedSong } from '../../game-menu/types/GameMenu.types'

interface UseGameAudioLoaderParams {
  audioPlayer: any // We inject the audio player hook instance
  loadFromFile: (file: File, iniFile?: File) => Promise<void>
  loadFromFolder: (files: FileList) => Promise<void>
  loadFromUrls: (chartUrl: string, metadata?: Partial<SongMetadata>) => Promise<void>
  setSong: (song: SongData | null) => void
}

export const useGameAudioLoader = ({
  audioPlayer,
  loadFromFile,
  loadFromFolder,
  loadFromUrls,
  setSong,
}: UseGameAudioLoaderParams) => {
  const [isAudioLoading, setIsAudioLoading] = useState(false)

  const handleAudioFileSelect = useCallback(
    async (file: File) => {
      setIsAudioLoading(true)
      await audioPlayer.loadAudioFile(file)
      setIsAudioLoading(false)
    },
    [audioPlayer]
  )

  const handleFolderSelect = useCallback(
    async (files: FileList) => {
      await loadFromFolder(files)
      const audioExtensions = ['.ogg', '.opus', '.mp3', '.wav', '.flac']
      const audioFiles: File[] = []

      for (let i = 0; i < files.length; i++) {
        const file = files[i]
        const ext = file.name.toLowerCase().substring(file.name.lastIndexOf('.'))
        if (audioExtensions.includes(ext)) {
          audioFiles.push(file)
        }
      }

      if (audioFiles.length > 0) {
        setIsAudioLoading(true)
        await audioPlayer.loadAudioStems(audioFiles)
        setIsAudioLoading(false)
      }
    },
    [loadFromFolder, audioPlayer]
  )

  const handlePreloadedSongSelect = useCallback(
    async (config: {
      chartUrl: string
      audioUrl?: string
      stemsUrls?: string[]
      metadata?: Partial<SongMetadata>
    }) => {
      setIsAudioLoading(true)
      try {
        await loadFromUrls(config.chartUrl, config.metadata)
        if (config.stemsUrls && config.stemsUrls.length > 0) {
          await audioPlayer.loadStemsFromUrls(config.stemsUrls)
        } else if (config.audioUrl) {
          await audioPlayer.loadAudioFromUrl(config.audioUrl)
        }
      } catch (err) {
        console.error('Error loading preloaded song:', err)
      } finally {
        setIsAudioLoading(false)
      }
    },
    [loadFromUrls, audioPlayer]
  )

  const handleUserSongSelect = useCallback(
    async (userSong: UserLoadedSong) => {
      setIsAudioLoading(true)
      try {
        if (userSong.chartFile) {
          await loadFromFile(userSong.chartFile, userSong.iniFile)
        } else {
          setSong(userSong.songData)
        }

        if (Array.isArray(userSong.audioSrc) && userSong.audioSrc.length > 0) {
          await audioPlayer.loadStemsFromUrls(userSong.audioSrc)
        } else if (userSong.audioSrc && typeof userSong.audioSrc === 'string') {
          await audioPlayer.loadAudioFromUrl(userSong.audioSrc)
        }
      } catch (err) {
        console.error('Error restoring loaded song audio:', err)
      } finally {
        setIsAudioLoading(false)
      }
    },
    [setSong, audioPlayer, loadFromFile]
  )

  return {
    isAudioLoading,
    handleAudioFileSelect,
    handleFolderSelect,
    handlePreloadedSongSelect,
    handleUserSongSelect,
  }
}
