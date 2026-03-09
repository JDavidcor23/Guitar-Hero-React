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
      setError('Por favor ingresa tu nombre')
      return
    }
    
    if (trimmedName.length < 2) {
      setError('El nombre debe tener al menos 2 caracteres')
      return
    }
    
    if (trimmedName.length > 20) {
      setError('El nombre no puede tener más de 20 caracteres')
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
