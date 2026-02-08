/**
 * Tipos para el sistema de perfiles de usuario
 */

/** Perfil de usuario */
export interface UserProfile {
  /** ID único del perfil */
  id: string
  /** Nombre del jugador */
  name: string
  /** Avatar (emoji) */
  avatar: string
  /** Timestamp de creación */
  createdAt: number
}

/** Registro de puntuación */
export interface ScoreRecord {
  /** ID de la canción (nombre del archivo) */
  songId: string
  /** Nombre de la canción */
  songName: string
  /** Artista */
  artist?: string
  /** Puntuación obtenida */
  score: number
  /** Porcentaje de accuracy */
  accuracy: number
  /** Rango obtenido (S, A, B, C, D, F) */
  rank: string
  /** Combo máximo */
  maxCombo: number
  /** Dificultad jugada */
  difficulty: string
  /** Timestamp de cuando se jugó */
  playedAt: number
}

/** Datos completos de un usuario */
export interface UserData {
  /** Perfil del usuario */
  profile: UserProfile
  /** Historial de puntuaciones */
  scores: ScoreRecord[]
}

/** Estado del almacenamiento de perfiles */
export interface ProfilesState {
  /** Lista de todos los usuarios */
  users: UserData[]
  /** ID del usuario actualmente seleccionado */
  activeUserId: string | null
}

/** Avatares disponibles (Set completo de instrumentos y tributos) */
export const AVAILABLE_AVATARS = ['guitar', 'bass', 'drums', 'mic', 'bat', 'cassette'] as const

export type UserAvatarId = typeof AVAILABLE_AVATARS[number]
