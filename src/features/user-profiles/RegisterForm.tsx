import { useState } from 'react'
import { AVAILABLE_AVATARS } from './types'
import './ProfileSelector.css'

interface RegisterFormProps {
  /** Callback cuando se completa el registro */
  onRegister: (name: string, avatar: string) => void
  /** Si es el modo inicial (primer usuario) */
  isInitialSetup?: boolean
  /** Callback para cancelar (opcional, solo si no es setup inicial) */
  onCancel?: () => void
}

/**
 * Formulario de registro de usuario
 * 
 * Permite ingresar nombre y seleccionar un avatar (emoji)
 */
export const RegisterForm = ({ onRegister, isInitialSetup = false, onCancel }: RegisterFormProps) => {
  const [name, setName] = useState('')
  const [selectedAvatar, setSelectedAvatar] = useState<string>(AVAILABLE_AVATARS[0])
  const [error, setError] = useState('')

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
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

  return (
    <div className={`register-form ${isInitialSetup ? 'register-form--initial' : 'register-form--modal'}`}>
      <div className="register-form__container">
        <h2 className="register-form__title">
          {isInitialSetup ? '¡Bienvenido!' : 'Nuevo Jugador'}
        </h2>
        <p className="register-form__subtitle">
          {isInitialSetup 
            ? 'Crea tu perfil para comenzar a jugar' 
            : 'Agrega un nuevo jugador'}
        </p>

        <form onSubmit={handleSubmit} className="register-form__form">
          {/* Input de nombre */}
          <div className="register-form__field">
            <label htmlFor="player-name" className="register-form__label">
              Nombre
            </label>
            <input
              id="player-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value)
                setError('')
              }}
              placeholder="Tu nombre de jugador"
              className="register-form__input"
              maxLength={20}
              autoFocus
            />
            {error && <span className="register-form__error">{error}</span>}
          </div>

          {/* Selector de avatar */}
          <div className="register-form__field">
            <label className="register-form__label">Avatar</label>
            <div className="register-form__avatars">
              {AVAILABLE_AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`register-form__avatar ${selectedAvatar === avatar ? 'register-form__avatar--selected' : ''}`}
                  aria-label={`Seleccionar avatar ${avatar}`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="register-form__buttons">
            {!isInitialSetup && onCancel && (
              <button 
                type="button" 
                onClick={onCancel}
                className="register-form__button register-form__button--cancel"
              >
                Cancelar
              </button>
            )}
            <button 
              type="submit" 
              className="register-form__button register-form__button--submit"
            >
              {isInitialSetup ? '¡Comenzar!' : 'Crear Perfil'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
