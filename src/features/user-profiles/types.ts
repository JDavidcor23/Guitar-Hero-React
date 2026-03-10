/**
 * Types for the user profile system
 */

/** User profile */
export interface UserProfile {
  /** Unique profile ID */
  id: string
  /** Player name */
  name: string
  /** Avatar */
  avatar: string
  /** Creation timestamp */
  createdAt: number
}

/** Score Record */
export interface ScoreRecord {
  /** Song ID (filename) */
  songId: string
  /** Song name */
  songName: string
  /** Artist */
  artist?: string
  /** Score obtained */
  score: number
  /** Accuracy percentage */
  accuracy: number
  /** Rank obtained (S, A, B, C, D, F) */
  rank: string
  /** Maximum combo */
  maxCombo: number
  /** Difficulty played */
  difficulty: string
  /** Timestamp of when it was played */
  playedAt: number
}

/** Complete User Data */
export interface UserData {
  /** User profile */
  profile: UserProfile
  /** Score history */
  scores: ScoreRecord[]
}

/** Profiles storage state */
export interface ProfilesState {
  /** List of all users */
  users: UserData[]
  /** Currently selected user ID */
  activeUserId: string | null
}

/** Available avatars (Full set of instruments and tributes) */
export const AVAILABLE_AVATARS = ['guitar', 'bass', 'drums', 'mic', 'bat', 'cassette'] as const

export type UserAvatarId = typeof AVAILABLE_AVATARS[number]
