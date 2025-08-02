import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'
import { getGermanErrorMessage } from '@/utils/errorHandler'

type User = {
  _id: string
  email: string
  name: string
  role: 'user' | 'admin'
  active: boolean
  isTempPassword: boolean
}

interface SignupFormProps {
  onSignup: (token: string, user: User, needsPasswordChange: boolean) => void
  onSwitchToLogin: () => void
}

export default function SignupForm({
  onSignup,
  onSwitchToLogin,
}: SignupFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const signup = useMutation(api.customAuth.signup)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await signup({ email, password, name })
      onSignup(result.token, result.user, false)
      toast.success('Account created successfully')
    } catch (error) {
      const cleanMessage = getGermanErrorMessage(error)

      toast.error(error instanceof Error ? cleanMessage : 'Signup failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 py-8'>
      <div className='w-full max-w-md bg-white rounded-lg shadow-md p-4 sm:p-6'>
        <div className='text-center mb-6'>
          <h2 className='text-xl sm:text-2xl font-bold text-gray-900'>
            Sign Up
          </h2>
          <p className='text-sm text-gray-600 mt-2'>
            Complete your registration with a new password
          </p>
        </div>

        <form onSubmit={handleSubmit} className='space-y-4'>
          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Email
            </label>
            <input
              id='email'
              type='email'
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors'
            />
          </div>

          <div>
            <label
              htmlFor='name'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              Full Name
            </label>
            <input
              id='name'
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors'
            />
          </div>

          <div>
            <label
              htmlFor='password'
              className='block text-sm font-medium text-gray-700 mb-1'
            >
              New Password
            </label>
            <input
              id='password'
              type='password'
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className='block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 transition-colors'
            />
          </div>

          <button
            type='submit'
            disabled={isLoading}
            className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-colors'
          >
            {isLoading ? 'Creating account...' : 'Complete Registration'}
          </button>
        </form>

        <div className='mt-6 text-center'>
          <button
            onClick={onSwitchToLogin}
            className='text-sm text-blue-600 hover:text-blue-500 transition-colors'
          >
            Already have an account? Sign in
          </button>
        </div>

        <div className='mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-md'>
          <p className='text-xs text-blue-800'>
            ℹ️ You can only register if an admin has pre-created your account
            with a temporary password.
          </p>
        </div>
      </div>
    </div>
  )
}
