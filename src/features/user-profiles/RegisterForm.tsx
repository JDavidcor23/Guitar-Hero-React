import { useState } from 'react'
import type { FormEvent } from 'react'
import { AVAILABLE_AVATARS } from './types'
import './ProfileSelector.css'
import backgroundImage from '../../assets/user-profiles/background registry.webp'

import { CassetteInput } from './components/CassetteInput/CassetteInput'

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

  return (
    <div className={`register-form ${isInitialSetup ? 'register-form--initial' : 'register-form--modal'}`}>
      {isInitialSetup && (
        <div 
          className="register-form__background"
          style={{ 
            backgroundImage: `url(${backgroundImage})`,
          }}
        />
      )}
      <div className="register-form__container">
        <h2 className="register-form__title">
          {isInitialSetup ? '¡Bienvenido!' : 'Nuevo Jugador'}
        </h2>

        <form onSubmit={handleSubmit} className="register-form__form">
          {/* Input de nombre con Casete */}
          <div className="register-form__field">
            <label className="register-form__label">Tu Nombre de Artista</label>
            <CassetteInput
              value={name}
              onChange={(val) => {
                setName(val);
                setError('');
              }}
              placeholder="Escribe tu nombre..."
              onEnter={() => handleSubmit()}
            />
            {error && <span className="register-form__error" style={{ textAlign: 'center' }}>{error}</span>}
          </div>

          {/* Selector de avatar */}
          <div className="register-form__field">
            <label className="register-form__label">Avatar</label>
            <div className="register-form__avatars">
              {AVAILABLE_AVATARS.map((avatar) => (
                <button
                  key={avatar}
                  type="button"
                  style={{ outline: 'none' }}
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`register-form__avatar ${selectedAvatar === avatar ? 'register-form__avatar--selected' : ''}`}
                  aria-label={`Seleccionar avatar ${avatar}`}
                >
                  <div className={`avatar-icon avatar-icon--${avatar}`} />
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
              disabled={!name.trim() || !selectedAvatar}
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
