import { useState, useEffect, useCallback } from 'react'
import type { UserProfile, UserData, ScoreRecord, ProfilesState } from './types'

const STORAGE_KEY = 'guitar-hero-profiles'

/**
 * Generates a unique ID for a new user
 */
const generateUserId = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Loads profiles from localStorage
 */
const loadProfilesFromStorage = (): ProfilesState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      return JSON.parse(stored)
    }
  } catch (error) {
    console.error('Error loading profiles from storage:', error)
  }
  return { users: [], activeUserId: null }
}

/**
 * Saves profiles to localStorage
 */
const saveProfilesToStorage = (state: ProfilesState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Error saving profiles to storage:', error)
  }
}

/**
 * Hook to manage the user profile system
 * 
 * Provides:
 * - List of all profiles
 * - Currently active user
 * - Functions to register, switch and delete users
 * - Functions to save and retrieve scores
 */
export const useUserProfiles = () => {
  const [state, setState] = useState<ProfilesState>(() => loadProfilesFromStorage())

  // Save to localStorage when state changes
  useEffect(() => {
    saveProfilesToStorage(state)
  }, [state])

  /**
   * Gets all available profiles
   */
  const profiles = state.users.map(u => u.profile)

  /**
   * Gets the currently active user
   */
  const currentUser = state.users.find(u => u.profile.id === state.activeUserId) ?? null

  /**
   * Registers a new user
   */
  const registerUser = useCallback((name: string, avatar: string): UserProfile => {
    const newProfile: UserProfile = {
      id: generateUserId(),
      name: name.trim(),
      avatar,
      createdAt: Date.now()
    }

    const newUserData: UserData = {
      profile: newProfile,
      scores: []
    }

    setState(prev => ({
      users: [...prev.users, newUserData],
      activeUserId: newProfile.id // Auto-select the new user
    }))

    return newProfile
  }, [])

  /**
   * Switches to the indicated user
   */
  const switchUser = useCallback((userId: string): void => {
    setState(prev => {
      const userExists = prev.users.some(u => u.profile.id === userId)
      if (!userExists) {
        console.warn(`User ${userId} not found`)
        return prev
      }
      return { ...prev, activeUserId: userId }
    })
  }, [])

  /**
   * Deletes a user
   */
  const deleteUser = useCallback((userId: string): void => {
    setState(prev => {
      const newUsers = prev.users.filter(u => u.profile.id !== userId)
      let newActiveId = prev.activeUserId

      // If we delete the active user, select another one or null
      if (prev.activeUserId === userId) {
        newActiveId = newUsers.length > 0 ? newUsers[0].profile.id : null
      }

      return {
        users: newUsers,
        activeUserId: newActiveId
      }
    })
  }, [])

  /**
   * Adds a score for the current user
   */
  const addScore = useCallback((score: Omit<ScoreRecord, 'playedAt'>): void => {
    setState(prev => {
      if (!prev.activeUserId) {
        console.warn('No active user to save score')
        return prev
      }

      const scoreRecord: ScoreRecord = {
        ...score,
        playedAt: Date.now()
      }

      const newUsers = prev.users.map(user => {
        if (user.profile.id === prev.activeUserId) {
          return {
            ...user,
            scores: [...user.scores, scoreRecord]
          }
        }
        return user
      })

      return { ...prev, users: newUsers }
    })
  }, [])

  /**
   * Gets the scores of the current user
   */
  const getUserScores = useCallback((): ScoreRecord[] => {
    return currentUser?.scores ?? []
  }, [currentUser])

  /**
   * Gets the best score of the current user for a specific song
   */
  const getBestScore = useCallback((songId: string): ScoreRecord | null => {
    const scores = currentUser?.scores.filter(s => s.songId === songId) ?? []
    if (scores.length === 0) return null
    return scores.reduce((best, current) => current.score > best.score ? current : best)
  }, [currentUser])

  /**
   * Indicates if there is at least one registered profile
   */
  const hasProfiles = state.users.length > 0

  /**
   * Indicates if there is an active user
   */
  const hasActiveUser = state.activeUserId !== null && currentUser !== null

  return {
    // State
    profiles,
    currentUser,
    hasProfiles,
    hasActiveUser,
    
    // Actions
    registerUser,
    switchUser,
    deleteUser,
    addScore,
    getUserScores,
    getBestScore
  }
}

export type UseUserProfiles = ReturnType<typeof useUserProfiles>
