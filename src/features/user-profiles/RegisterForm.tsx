import { AVAILABLE_AVATARS } from './types'
import { useRegisterForm } from './hooks/useRegisterForm.hook'
import './ProfileSelector.css'
const backgroundImage = 'https://res.cloudinary.com/dhu6ga6hl/image/upload/v1773103011/guitarhero/laguwhrvfte7zmnyttag.webp';

import { CassetteInput } from './components/CassetteInput/CassetteInput'

interface RegisterFormProps {
  /** Callback when registration is complete */
  onRegister: (name: string, avatar: string) => void
  /** If it is the initial setup mode (first user) */
  isInitialSetup?: boolean
  /** Callback for Cancel (optional, only if not initial setup) */
  onCancel?: () => void
}

/**
 * User registration form
 * 
 * Allows entering a name and selecting an avatar
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
          {/* Name input with Cassette */}
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

          {/* Avatar selector */}
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

          {/* Buttons */}
          <div className="register-form__buttons">
            {!isInitialSetup && onCancel ? (
              <button 
                type="button" 
                onClick={onCancel}
                className="register-form__button register-form__button--cancel"
              >
                Cancel
              </button>
            ) : null}
            <button 
              type="submit" 
              disabled={!name.trim() || !selectedAvatar}
              className="register-form__button register-form__button--submit"
            >
              {isInitialSetup ? ' Start!' : 'Create Profile'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

