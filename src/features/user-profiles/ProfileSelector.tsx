import { useProfileSelector } from './hooks/useProfileSelector.hook'
import type { UserProfile } from './types'
import { RegisterForm } from './RegisterForm'
import './ProfileSelector.css'

interface ProfileSelectorProps {
  /** Lista de perfiles disponibles */
  profiles: UserProfile[]
  /** Usuario actualmente activo */
  currentUser: { profile: UserProfile } | null
  /** Callback para cambiar de usuario */
  onSwitchUser: (userId: string) => void
  /** Callback para registrar nuevo usuario */
  onRegisterUser: (name: string, avatar: string) => void
  /** Callback para eliminar usuario */
  onDeleteUser?: (userId: string) => void
}

/**
 * Selector de perfil de usuario
 * 
 * Muestra el usuario actual y permite cambiar entre perfiles
 * o crear uno nuevo
 */
export const ProfileSelector = ({
  profiles,
  currentUser,
  onSwitchUser,
  onRegisterUser,
  onDeleteUser
}: ProfileSelectorProps) => {
  if (!currentUser) return null

  const {
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
  } = useProfileSelector({
    profiles,
    currentUser,
    onSwitchUser,
    onDeleteUser,
  })

  const handleRegister = (name: string, avatar: string) => {
    onRegisterUser(name, avatar)
    setShowRegisterForm(false)
    setIsOpen(false)
  }

  return (
    <>
      <div className="profile-selector">
        {/* Botón del usuario actual */}
        <button 
          className="profile-selector__current"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          aria-haspopup="listbox"
        >
          <div className="profile-selector__avatar">
            <div className={`avatar-icon avatar-icon--${currentUser.profile.avatar} profile-selector__avatar-icon`} />
          </div>
          <span className="profile-selector__name">{currentUser.profile.name}</span>
          {hasGamepad ? (
            <span className="profile-selector__gamepad-hint">(Y)</span>
          ) : null}
          <span className="profile-selector__arrow">{isOpen ? '▲' : '▼'}</span>
        </button>

        {/* Dropdown de perfiles */}
        {isOpen ? (
          <div className="profile-selector__dropdown">
            <div className="profile-selector__list" role="listbox">
              {profiles.map((profile, index) => (
                <div
                  key={profile.id}
                  className={`profile-selector__item ${profile.id === currentUser.profile.id ? 'profile-selector__item--active' : ''} ${focusedIndex === index ? 'profile-selector__item--focused' : ''}`}
                  onClick={() => handleProfileClick(profile.id)}
                  role="option"
                  aria-selected={profile.id === currentUser.profile.id}
                >
                  <div className="profile-selector__item-avatar">
                    <div className={`avatar-icon avatar-icon--${profile.avatar} profile-selector__item-avatar-icon`} />
                  </div>
                  <span className="profile-selector__item-name">{profile.name}</span>
                  {profile.id === currentUser.profile.id ? (
                    <span className="profile-selector__item-check">✓</span>
                  ) : null}
                  {onDeleteUser && profiles.length > 1 && profile.id !== currentUser.profile.id ? (
                    <button
                      className="profile-selector__item-delete"
                      onClick={(e) => handleDeleteClick(e, profile.id)}
                      aria-label={`Eliminar perfil de ${profile.name}`}
                    >
                      ✕
                    </button>
                  ) : null}
                </div>
              ))}
            </div>
            
            {/* Botón agregar nuevo */}
            <button
              className={`profile-selector__add ${focusedIndex === profiles.length ? 'profile-selector__add--focused' : ''}`}
              onClick={() => setShowRegisterForm(true)}
            >
              <span className="profile-selector__add-icon">+</span>
              <span>Add Player</span>
            </button>
          </div>
        ) : null}
      </div>

      {/* Overlay para cerrar el dropdown al hacer clic fuera */}
      {isOpen ? (
        <div 
          className="profile-selector__overlay" 
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      ) : null}

      {/* Modal de registro */}
      {showRegisterForm ? (
        <div className="profile-selector__modal-backdrop">
          <RegisterForm
            onRegister={handleRegister}
            onCancel={() => setShowRegisterForm(false)}
          />
        </div>
      ) : null}

      {/* Modal de confirmación de eliminación */}
      {userToDelete ? (
        <div className="profile-selector__modal-backdrop">
          <div className="profile-selector__confirm-modal">
            <h3>¿Eliminar perfil?</h3>
            <p>Se perderán todas las puntuaciones guardadas.</p>
            <div className="profile-selector__confirm-buttons">
              <button onClick={() => setUserToDelete(null)}>Cancel</button>
              <button onClick={confirmDelete} className="profile-selector__confirm-delete">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  )
}

