import { AVAILABLE_AVATARS } from './types'
import { useRegisterForm } from './hooks/useRegisterForm.hook'
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
  const {
    name,
    setName,
    selectedAvatar,
    setSelectedAvatar,
    error,
    setError,
    handleSubmit,
  } = useRegisterForm({ onRegister })

  return (
    <div className={`register-form ${isInitialSetup ? 'register-form--initial' : 'register-form--modal'}`}>
      {isInitialSetup ? (
        <div 
          className="register-form__background"
          style={{ 
            backgroundImage: `url(${backgroundImage})`,
          }}
        />
      ) : null}
      <div className="register-form__container">
        <h2 className="register-form__title">
          {isInitialSetup ? 'Welcome!' : 'New Player'}
        </h2>

        <form onSubmit={handleSubmit} className="register-form__form">
          {/* Input de nombre con Casete */}
          <div className="register-form__field">
            <label className="register-form__label">Your Artist Name</label>
            <CassetteInput
              value={name}
              onChange={(val) => {
                setName(val);
                setError('');
              }}
              placeholder="Write your name..."
              onEnter={() => handleSubmit()}
            />
            {error ? (
              <span className="register-form__error register-form__error--center">{error}</span>
            ) : null}
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
                  aria-label={`Select avatar ${avatar}`}
                >
                  <div className={`avatar-icon avatar-icon--${avatar}`} />
                </button>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div className="register-form__buttons">
            {!isInitialSetup && onCancel ? (
              <button 
                type="button" 
                onClick={onCancel}
                className="register-form__button register-form__button--cancel"
              >
                Cancelar
              </button>
            ) : null}
            <button 
              type="submit" 
              disabled={!name.trim() || !selectedAvatar}
              className="register-form__button register-form__button--submit"
            >
              {isInitialSetup ? ' ¡Start!' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

