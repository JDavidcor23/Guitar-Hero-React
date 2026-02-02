import { useState, useEffect, useCallback } from 'react'
import type { UserProfile, UserData, ScoreRecord, ProfilesState } from './types'

const STORAGE_KEY = 'guitar-hero-profiles'

/**
 * Genera un ID único para un nuevo usuario
 */
const generateUserId = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Carga los perfiles desde localStorage
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
 * Guarda los perfiles en localStorage
 */
const saveProfilesToStorage = (state: ProfilesState): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (error) {
    console.error('Error saving profiles to storage:', error)
  }
}

/**
 * Hook para manejar el sistema de perfiles de usuario
 * 
 * Proporciona:
 * - Lista de todos los perfiles
 * - Usuario actualmente activo
 * - Funciones para registrar, cambiar y eliminar usuarios
 * - Funciones para guardar y obtener puntuaciones
 */
export const useUserProfiles = () => {
  const [state, setState] = useState<ProfilesState>(() => loadProfilesFromStorage())

  // Guardar en localStorage cuando cambia el estado
  useEffect(() => {
    saveProfilesToStorage(state)
  }, [state])

  /**
   * Obtiene todos los perfiles disponibles
   */
  const profiles = state.users.map(u => u.profile)

  /**
   * Obtiene el usuario actualmente activo
   */
  const currentUser = state.users.find(u => u.profile.id === state.activeUserId) ?? null

  /**
   * Registra un nuevo usuario
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
      activeUserId: newProfile.id // Auto-seleccionar el nuevo usuario
    }))

    return newProfile
  }, [])

  /**
   * Cambia al usuario indicado
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
   * Elimina un usuario
   */
  const deleteUser = useCallback((userId: string): void => {
    setState(prev => {
      const newUsers = prev.users.filter(u => u.profile.id !== userId)
      let newActiveId = prev.activeUserId

      // Si eliminamos el usuario activo, seleccionar otro o null
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
   * Agrega una puntuación para el usuario actual
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
   * Obtiene las puntuaciones del usuario actual
   */
  const getUserScores = useCallback((): ScoreRecord[] => {
    return currentUser?.scores ?? []
  }, [currentUser])

  /**
   * Obtiene la mejor puntuación del usuario actual para una canción específica
   */
  const getBestScore = useCallback((songId: string): ScoreRecord | null => {
    const scores = currentUser?.scores.filter(s => s.songId === songId) ?? []
    if (scores.length === 0) return null
    return scores.reduce((best, current) => current.score > best.score ? current : best)
  }, [currentUser])

  /**
   * Indica si hay al menos un perfil registrado
   */
  const hasProfiles = state.users.length > 0

  /**
   * Indica si hay un usuario activo
   */
  const hasActiveUser = state.activeUserId !== null && currentUser !== null

  return {
    // Estado
    profiles,
    currentUser,
    hasProfiles,
    hasActiveUser,
    
    // Acciones
    registerUser,
    switchUser,
    deleteUser,
    addScore,
    getUserScores,
    getBestScore
  }
}

export type UseUserProfiles = ReturnType<typeof useUserProfiles>
