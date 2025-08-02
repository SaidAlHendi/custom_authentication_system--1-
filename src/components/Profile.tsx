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

interface ProfileProps {
  user: User
  token: string
}

export default function Profile({ user, token }: ProfileProps) {
  const [name, setName] = useState(user.name)
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false)
  const [isChangingPassword, setIsChangingPassword] = useState(false)

  const updateProfile = useMutation(api.customAuth.updateProfile)
  const changePassword = useMutation(api.customAuth.changePassword)

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsUpdatingProfile(true)

    try {
      await updateProfile({ token, name })
      toast.success('Profile updated successfully')
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : 'Failed to update profile'
      )
    } finally {
      setIsUpdatingProfile(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsChangingPassword(true)

    try {
      await changePassword({ token, oldPassword, newPassword })
      setOldPassword('')
      setNewPassword('')
      toast.success('Password changed successfully')
    } catch (error) {
      const cleanMessage = getGermanErrorMessage(error)

      toast.error(
        error instanceof Error ? cleanMessage : 'Failed to change password'
      )
    } finally {
      setIsChangingPassword(false)
    }
  }

  return (
    <div className='max-w-2xl mx-auto space-y-6'>
      {/* Profile Information */}
      <div className='bg-white shadow rounded-lg p-6'>
        <h2 className='text-xl font-bold text-gray-900 mb-6'>
          Profile Information
        </h2>

        <form onSubmit={handleUpdateProfile} className='space-y-4'>
          <div>
            <label
              htmlFor='email'
              className='block text-sm font-medium text-gray-700'
            >
              Email
            </label>
            <input
              id='email'
              type='email'
              value={user.email}
              disabled
              className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm bg-gray-50 text-gray-500'
            />
            <p className='text-xs text-gray-500 mt-1'>
              Email cannot be changed
            </p>
          </div>

          <div>
            <label
              htmlFor='name'
              className='block text-sm font-medium text-gray-700'
            >
              Full Name
            </label>
            <input
              id='name'
              type='text'
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            />
          </div>

          <div>
            <label className='block text-sm font-medium text-gray-700'>
              Role
            </label>
            <span className='mt-1 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800'>
              {user.role}
            </span>
          </div>

          <button
            type='submit'
            disabled={isUpdatingProfile}
            className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50'
          >
            {isUpdatingProfile ? 'Updating...' : 'Update Profile'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className='bg-white shadow rounded-lg p-6'>
        <h2 className='text-xl font-bold text-gray-900 mb-6'>
          Change Password
        </h2>

        <form onSubmit={handleChangePassword} className='space-y-4'>
          <div>
            <label
              htmlFor='oldPassword'
              className='block text-sm font-medium text-gray-700'
            >
              Current Password
            </label>
            <input
              id='oldPassword'
              type='password'
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              required
              className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            />
          </div>

          <div>
            <label
              htmlFor='newPassword'
              className='block text-sm font-medium text-gray-700'
            >
              New Password
            </label>
            <input
              id='newPassword'
              type='password'
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              required
              className='mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500'
            />
          </div>

          <button
            type='submit'
            disabled={isChangingPassword}
            className='w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50'
          >
            {isChangingPassword ? 'Changing...' : 'Change Password'}
          </button>
        </form>
      </div>
    </div>
  )
}
