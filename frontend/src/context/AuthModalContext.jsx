import { createContext, useContext, useState } from 'react'
import LoginModal from '../components/LoginModal'
import SignupModal from '../components/SignupModal'

const AuthModalContext = createContext(null)

export function AuthModalProvider({ children }) {
  const [modal, setModal] = useState(null) // 'login' | 'signup' | null

  const openAuthModal = (type = 'login') => setModal(type)
  const closeAuthModal = () => setModal(null)

  return (
    <AuthModalContext.Provider value={{ openAuthModal, closeAuthModal }}>
      {children}
      {modal === 'login' && (
        <LoginModal
          onClose={closeAuthModal}
          onSwitchToSignup={() => setModal('signup')}
        />
      )}
      {modal === 'signup' && (
        <SignupModal
          onClose={closeAuthModal}
          onSwitchToLogin={() => setModal('login')}
        />
      )}
    </AuthModalContext.Provider>
  )
}

export function useAuthModal() {
  return useContext(AuthModalContext)
}
