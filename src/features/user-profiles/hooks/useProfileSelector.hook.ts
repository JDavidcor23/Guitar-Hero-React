import { useState, useEffect } from 'react'
import { useGamepadNavigation } from '../../../hooks/useGamepadNavigation'
import type { UserProfile } from '../types'

interface UseProfileSelectorOptions {
  profiles: UserProfile[]
  currentUser: { profile: UserProfile } | null
  onSwitchUser: (userId: string) => void
  onDeleteUser?: (userId: string) => void
}

export const useProfileSelector = ({
  profiles,
  currentUser,
  onSwitchUser,
  onDeleteUser,
}: UseProfileSelectorOptions) => {
  const [isOpen, setIsOpen] = useState(false)
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)
  const [focusedIndex, setFocusedIndex] = useState(-1)

  const handleProfileClick = (userId: string) => {
    onSwitchUser(userId)
    setIsOpen(false)
  }

  const handleDeleteClick = (e: React.MouseEvent, userId: string) => {
    e.stopPropagation()
    setUserToDelete(userId)
  }

  const confirmDelete = () => {
    if (userToDelete && onDeleteUser) {
      onDeleteUser(userToDelete)
      setUserToDelete(null)
    }
  }

  useEffect(() => {
    if (isOpen) {
      const idx = profiles.findIndex(p => p.id === currentUser?.profile.id)
      setFocusedIndex(idx >= 0 ? idx : 0)
    } else {
      setFocusedIndex(-1)
    }
  }, [isOpen, profiles, currentUser])

  const { hasGamepad } = useGamepadNavigation({
    enabled: true,
    onY: () => {
      if (!showRegisterForm && !userToDelete) {
        setIsOpen(prev => !prev)
      }
    },
    onConfirm: () => {
      if (!isOpen || showRegisterForm || userToDelete) return
      
      if (focusedIndex >= 0 && focusedIndex < profiles.length) {
        handleProfileClick(profiles[focusedIndex].id)
      } else if (focusedIndex === profiles.length) {
        setShowRegisterForm(true)
      }
    },
    onCancel: () => {
       if (isOpen && !showRegisterForm && !userToDelete) {
         setIsOpen(false)
       }
    },
    onUp: () => {
      if (isOpen && !showRegisterForm && !userToDelete) {
        setFocusedIndex(prev => Math.max(0, prev - 1))
      }
    },
    onDown: () => {
      if (isOpen && !showRegisterForm && !userToDelete) {
        setFocusedIndex(prev => Math.min(profiles.length, prev + 1))
      }
    }
  })

  return {
    isOpen,
    setIsOpen,
    showRegisterForm,
    setShowRegisterForm,
    userToDelete,
    setUserToDelete,
    focusedIndex,
    handleProfileClick,
    handleDeleteClick,
    confirmDelete,
    hasGamepad,
  }
}
