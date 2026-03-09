import { useState, useEffect } from 'react'
import { useGamepadNavigation } from '../../hooks/useGamepadNavigation'
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
  const [isOpen, setIsOpen] = useState(false)
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [userToDelete, setUserToDelete] = useState<string | null>(null)

  const handleProfileClick = (userId: string) => {
    onSwitchUser(userId)
    setIsOpen(false)
  }

  const handleRegister = (name: string, avatar: string) => {
    onRegisterUser(name, avatar)
    setShowRegisterForm(false)
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

  const [focusedIndex, setFocusedIndex] = useState(-1)
  
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

  if (!currentUser) return null

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
            <div className={`avatar-icon avatar-icon--${currentUser.profile.avatar}`} style={{ width: '20px', height: '20px' }} />
          </div>
          <span className="profile-selector__name">{currentUser.profile.name}</span>
          {hasGamepad && <span className="profile-selector__gamepad-hint" style={{fontSize: '0.7em', color: '#ffbc42', fontWeight: 'bold'}}>(Y)</span>}
          <span className="profile-selector__arrow">{isOpen ? '▲' : '▼'}</span>
        </button>

        {/* Dropdown de perfiles */}
        {isOpen && (
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
                    <div className={`avatar-icon avatar-icon--${profile.avatar}`} style={{ width: '18px', height: '18px', backgroundColor: 'rgba(255,255,255,0.7)' }} />
                  </div>
                  <span className="profile-selector__item-name">{profile.name}</span>
                  {profile.id === currentUser.profile.id && (
                    <span className="profile-selector__item-check">✓</span>
                  )}
                  {onDeleteUser && profiles.length > 1 && profile.id !== currentUser.profile.id && (
                    <button
                      className="profile-selector__item-delete"
                      onClick={(e) => handleDeleteClick(e, profile.id)}
                      aria-label={`Eliminar perfil de ${profile.name}`}
                    >
                      ✕
                    </button>
                  )}
                </div>
              ))}
            </div>
            
            {/* Botón agregar nuevo */}
            <button
              className={`profile-selector__add ${focusedIndex === profiles.length ? 'profile-selector__add--focused' : ''}`}
              onClick={() => setShowRegisterForm(true)}
            >
              <span className="profile-selector__add-icon">+</span>
              <span>Agregar Jugador</span>
            </button>
          </div>
        )}
      </div>

      {/* Overlay para cerrar el dropdown al hacer clic fuera */}
      {isOpen && (
        <div 
          className="profile-selector__overlay" 
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Modal de registro */}
      {showRegisterForm && (
        <div className="profile-selector__modal-backdrop">
          <RegisterForm
            onRegister={handleRegister}
            onCancel={() => setShowRegisterForm(false)}
          />
        </div>
      )}

      {/* Modal de confirmación de eliminación */}
      {userToDelete && (
        <div className="profile-selector__modal-backdrop">
          <div className="profile-selector__confirm-modal">
            <h3>¿Eliminar perfil?</h3>
            <p>Se perderán todas las puntuaciones guardadas.</p>
            <div className="profile-selector__confirm-buttons">
              <button onClick={() => setUserToDelete(null)}>Cancelar</button>
              <button onClick={confirmDelete} className="profile-selector__confirm-delete">
                Eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
