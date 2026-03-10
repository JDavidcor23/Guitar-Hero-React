import { useState } from 'react'
import type { FormEvent } from 'react'

interface UseRegisterFormOptions {
  onRegister: (name: string, avatar: string) => void
}

export const useRegisterForm = ({ onRegister }: UseRegisterFormOptions) => {
  const [name, setName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState<string>('')
  const [error, setError] = useState('')

  const handleSubmit = (e?: FormEvent) => {
    e?.preventDefault()
    
    const trimmedName = name.trim()
    if (!trimmedName) {
      setError('Please enter your name')
      return
    }
    
    if (trimmedName.length < 2) {
      setError('Name must be at least 2 characters long')
      return
    }
    
    if (trimmedName.length > 20) {
      setError('Name cannot be more than 20 characters long')
      return
    }

    onRegister(trimmedName, selectedAvatar)
  }

  return {
    name,
    setName,
    selectedAvatar,
    setSelectedAvatar,
    error,
    setError,
    handleSubmit,
  }
}
