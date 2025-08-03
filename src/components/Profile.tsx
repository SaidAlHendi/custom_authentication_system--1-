import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'
import { getGermanErrorMessage } from '@/utils/errorHandler'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { User, Lock, Eye, EyeOff } from 'lucide-react'
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
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)

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
    <div className='min-h-screen bg-gray-50 p-4'>
      <div className='max-w-2xl mx-auto space-y-6'>
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <User className='w-5 h-5' />
              Profil-Informationen
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleUpdateProfile} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='email'>E-Mail</Label>
                <Input
                  id='email'
                  type='email'
                  value={user.email}
                  disabled
                  className='bg-gray-50'
                />
                <p className='text-xs text-muted-foreground'>
                  E-Mail kann nicht geändert werden
                </p>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='name'>Vollständiger Name</Label>
                <Input
                  id='name'
                  type='text'
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div className='space-y-2'>
                <Label>Rolle</Label>
                <div>
                  <Badge variant='destructive'>
                    {user.role === 'admin' ? 'Administrator' : 'Benutzer'}
                  </Badge>
                </div>
              </div>

              <Button
                type='submit'
                disabled={isUpdatingProfile}
                className='w-full'
              >
                {isUpdatingProfile
                  ? 'Wird aktualisiert...'
                  : 'Profil aktualisieren'}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Change Password */}
        <Card>
          <CardHeader>
            <CardTitle className='flex items-center gap-2'>
              <Lock className='w-5 h-5' />
              Passwort ändern
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleChangePassword} className='space-y-4'>
              <div className='space-y-2'>
                <Label htmlFor='oldPassword'>Aktuelles Passwort</Label>
                <div className='relative'>
                  <Input
                    id='oldPassword'
                    type={showOldPassword ? 'text' : 'password'}
                    value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    required
                    className='pr-10'
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                    onClick={() => setShowOldPassword(!showOldPassword)}
                  >
                    {showOldPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </Button>
                </div>
              </div>

              <div className='space-y-2'>
                <Label htmlFor='newPassword'>Neues Passwort</Label>
                <div className='relative'>
                  <Input
                    id='newPassword'
                    type={showNewPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    className='pr-10'
                  />
                  <Button
                    type='button'
                    variant='ghost'
                    size='sm'
                    className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? (
                      <EyeOff className='h-4 w-4' />
                    ) : (
                      <Eye className='h-4 w-4' />
                    )}
                  </Button>
                </div>
              </div>

              <Button
                type='submit'
                disabled={isChangingPassword}
                variant='destructive'
                className='w-full'
              >
                {isChangingPassword ? 'Wird geändert...' : 'Passwort ändern'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
