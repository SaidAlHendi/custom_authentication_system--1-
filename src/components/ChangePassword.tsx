import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'
import { getGermanErrorMessage } from '@/utils/errorHandler'
import { Lock, Eye, EyeOff } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
interface ChangePasswordProps {
  token: string
  onPasswordChanged: () => void
}

export default function ChangePassword({
  token,
  onPasswordChanged,
}: ChangePasswordProps) {
  const [oldPassword, setOldPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showOldPassword, setShowOldPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)

  const changePassword = useMutation(api.customAuth.changePassword)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      await changePassword({ token, oldPassword, newPassword })
      onPasswordChanged()
    } catch (error) {
      const cleanMessage = getGermanErrorMessage(error)

      toast.error(
        error instanceof Error ? cleanMessage : 'Failed to change password'
      )
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-gray-50'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center space-y-2'>
          <div className='mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
            <Lock className='w-6 h-6 text-blue-600' />
          </div>
          <CardTitle className='text-xl sm:text-2xl'>
            Passwort ändern erforderlich
          </CardTitle>
          <p className='text-sm text-muted-foreground'>
            Sie müssen Ihr temporäres Passwort ändern, bevor Sie fortfahren
            können
          </p>
        </CardHeader>

        <CardContent className='space-y-6'>
          <form onSubmit={handleSubmit} className='space-y-4'>
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

            <Button type='submit' disabled={isLoading} className='w-full h-11'>
              {isLoading ? 'Wird geändert...' : 'Passwort ändern'}
            </Button>
          </form>

          <Alert className='border-red-200 bg-red-50'>
            <Lock className='h-4 w-4 text-red-600' />
            <AlertDescription className='text-red-800 text-sm'>
              Sie können die Anwendung erst nutzen, nachdem Sie Ihr temporäres
              Passwort geändert haben.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    </div>
  )
}
