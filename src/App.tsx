import { useState, useEffect } from 'react'
import { useMutation, useQuery } from 'convex/react'
import { api } from '../convex/_generated/api'
import { Toaster, toast } from 'sonner'
import LoginForm from './components/LoginForm'
import SignupForm from './components/SignupForm'
import Dashboard from './components/Dashboard'
import Profile from './components/Profile'
import AdminDashboard from './components/AdminDashboard'
import ChangePassword from './components/ChangePassword'
import ObjectDashboard from './components/ObjectDashboard'
import ObjectEditor from './components/ObjectEditor'

type User = {
  _id: string
  email: string
  name: string
  role: 'user' | 'admin'
  active: boolean
  isTempPassword: boolean
}

type AuthState = {
  user: User | null
  token: string | null
  needsPasswordChange: boolean
}

export default function App() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    token: null,
    needsPasswordChange: false,
  })
  const [currentView, setCurrentView] = useState<
    | 'login'
    | 'signup'
    | 'dashboard'
    | 'profile'
    | 'admin'
    | 'change-password'
    | 'objects'
    | 'object-editor'
  >('login')
  const [editingObjectId, setEditingObjectId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const validateSession = useQuery(
    api.customAuth.validateSession,
    authState.token ? { token: authState.token } : 'skip'
  )

  const logout = useMutation(api.customAuth.logout)

  // Check for existing session on app start
  useEffect(() => {
    const token = localStorage.getItem('auth_token')
    if (token) {
      setAuthState((prev) => ({ ...prev, token }))
    } else {
      setIsLoading(false)
    }
  }, [])

  // Handle session validation
  useEffect(() => {
    if (validateSession !== undefined) {
      setIsLoading(false)
      if (validateSession) {
        setAuthState((prev) => ({
          ...prev,
          user: validateSession.user,
          needsPasswordChange: validateSession.needsPasswordChange,
        }))
        if (validateSession.needsPasswordChange) {
          setCurrentView('change-password')
        } else if (currentView === 'login' || currentView === 'signup') {
          setCurrentView('objects') // Default to objects view
        }
      } else {
        // Invalid session
        localStorage.removeItem('auth_token')
        setAuthState({ user: null, token: null, needsPasswordChange: false })
        setCurrentView('login')
      }
    }
  }, [validateSession])

  const handleLogin = (
    token: string,
    user: User,
    needsPasswordChange: boolean
  ) => {
    localStorage.setItem('auth_token', token)
    setAuthState({ user, token, needsPasswordChange })
    if (needsPasswordChange) {
      setCurrentView('change-password')
    } else {
      setCurrentView('objects')
    }
  }

  const handleLogout = async () => {
    if (authState.token) {
      await logout({ token: authState.token })
    }
    localStorage.removeItem('auth_token')
    setAuthState({ user: null, token: null, needsPasswordChange: false })
    setCurrentView('login')
    toast.success('Logged out successfully')
  }

  const handlePasswordChanged = () => {
    setAuthState((prev) => ({ ...prev, needsPasswordChange: false }))
    setCurrentView('objects')
    toast.success('Password changed successfully')
  }

  const handleEditObject = (objectId: string) => {
    setEditingObjectId(objectId)
    setCurrentView('object-editor')
  }

  const handleBackFromEditor = () => {
    setEditingObjectId(null)
    setCurrentView('objects')
  }

  if (isLoading) {
    return (
      <div className='min-h-screen flex items-center justify-center'>
        <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600'></div>
      </div>
    )
  }

  // Redirect authenticated users away from login/signup
  if (authState.user && (currentView === 'login' || currentView === 'signup')) {
    setCurrentView('objects')
  }

  // Redirect unauthenticated users to login
  if (!authState.user && !['login', 'signup'].includes(currentView)) {
    setCurrentView('login')
  }
  console.log(authState.user)
  return (
    <div className='min-h-screen bg-gray-50'>
      {authState.user && (
        <nav className='bg-white shadow-sm border-b'>
          <div className='max-w-7xl mx-auto px-4 sm:px-6 lg:px-8'>
            <div className='flex flex-col sm:flex-row justify-between h-auto sm:h-16 py-4 sm:py-0'>
              <div className='flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-8'>
                <h1 className='text-xl font-bold text-gray-900'>
                  Objektverwaltung
                </h1>
                <div className='flex flex-wrap gap-2 sm:gap-4'>
                  <button
                    onClick={() => setCurrentView('objects')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === 'objects' ||
                      currentView === 'object-editor'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => setCurrentView('profile')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                      currentView === 'profile'
                        ? 'bg-blue-100 text-blue-700'
                        : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    Profil
                  </button>
                  {authState.user.role === 'admin' && (
                    <button
                      onClick={() => setCurrentView('admin')}
                      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                        currentView === 'admin'
                          ? 'bg-blue-100 text-blue-700'
                          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                      }`}
                    >
                      Benutzerverwaltung
                    </button>
                  )}
                </div>
              </div>
              <div className='flex flex-col sm:flex-row items-start sm:items-center space-y-2 sm:space-y-0 sm:space-x-4 mt-4 sm:mt-0'>
                <span className='text-sm text-gray-700'>
                  {authState.user.name} ({authState.user.role})
                </span>
                <button
                  onClick={handleLogout}
                  className='w-full sm:w-auto bg-red-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-red-700 transition-colors'
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </nav>
      )}

      <main className='max-w-7xl mx-auto py-6 sm:px-6 lg:px-8'>
        {currentView === 'login' && (
          <LoginForm
            onLogin={handleLogin}
            onSwitchToSignup={() => setCurrentView('signup')}
          />
        )}
        {currentView === 'signup' && (
          <SignupForm
            onSignup={handleLogin}
            onSwitchToLogin={() => setCurrentView('login')}
          />
        )}
        {currentView === 'change-password' && authState.token && (
          <ChangePassword
            token={authState.token}
            onPasswordChanged={handlePasswordChanged}
          />
        )}

        {currentView === 'profile' && authState.user && authState.token && (
          <Profile user={authState.user} token={authState.token} />
        )}
        {currentView === 'admin' &&
          authState.user?.role === 'admin' &&
          authState.token && <AdminDashboard token={authState.token} />}
        {currentView === 'objects' && authState.user && authState.token && (
          <ObjectDashboard
            user={authState.user}
            token={authState.token}
            onEditObject={handleEditObject}
          />
        )}
        {currentView === 'object-editor' &&
          authState.user &&
          authState.token &&
          editingObjectId && (
            <ObjectEditor
              user={authState.user}
              token={authState.token}
              objectId={editingObjectId}
              onBack={handleBackFromEditor}
            />
          )}
      </main>

      <Toaster />
    </div>
  )
}
