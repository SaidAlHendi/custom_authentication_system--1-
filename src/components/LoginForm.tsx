import { useState } from 'react'
import { useMutation } from 'convex/react'
import { api } from '../../convex/_generated/api'
import { toast } from 'sonner'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Eye, EyeOff, LogIn } from 'lucide-react'

type User = {
  _id: string
  email: string
  name: string
  role: 'user' | 'admin'
  active: boolean
  isTempPassword: boolean
}

interface LoginFormProps {
  onLogin: (token: string, user: User, needsPasswordChange: boolean) => void
  onSwitchToSignup: () => void
}

export default function LoginForm({
  onLogin,
  onSwitchToSignup,
}: LoginFormProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [showPassword, setShowPassword] = useState(false)

  const login = useMutation(api.customAuth.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)

    try {
      const result = await login({ email, password })
      onLogin(result.token, result.user, result.needsPasswordChange)
      toast.success('Logged in successfully')
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Login failed')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className='min-h-screen flex items-center justify-center p-4 bg-gray-50'>
      <Card className='w-full max-w-md'>
        <CardHeader className='text-center space-y-2'>
          <div className='mx-auto w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center'>
            <LogIn className='w-6 h-6 text-blue-600' />
          </div>
          <CardTitle className='text-xl sm:text-2xl'>Anmelden</CardTitle>
          <p className='text-sm text-muted-foreground'>
            Geben Sie Ihre Anmeldedaten ein, um auf Ihr Konto zuzugreifen
          </p>
        </CardHeader>

        <CardContent className='space-y-6'>
          <form onSubmit={handleSubmit} className='space-y-4'>
            <div className='space-y-2'>
              <Label htmlFor='email'>E-Mail</Label>
              <Input
                id='email'
                type='email'
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder='ihre@email.de'
              />
            </div>

            <div className='space-y-2'>
              <Label htmlFor='password'>Passwort</Label>
              <div className='relative'>
                <Input
                  id='password'
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className='pr-10'
                />
                <Button
                  type='button'
                  variant='ghost'
                  size='sm'
                  className='absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent'
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className='h-4 w-4' />
                  ) : (
                    <Eye className='h-4 w-4' />
                  )}
                </Button>
              </div>
            </div>

            <Button type='submit' disabled={isLoading} className='w-full h-11'>
              {isLoading ? 'Wird angemeldet...' : 'Anmelden'}
            </Button>
          </form>

          {/*           <div className='text-center'>
            <Button
              variant='link'
              onClick={onSwitchToSignup}
              className='text-sm'
            >
              Noch kein Konto? Registrieren
            </Button>
          </div> */}
        </CardContent>
      </Card>
    </div>
  )
}
