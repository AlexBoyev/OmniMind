import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useLocation, Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'
import { useAuthStore } from '@/store/authStore'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { toast } from '@/components/ui/toaster'
import { Brain } from 'lucide-react'

const schema = z.object({
  email_or_username: z.string().min(1, 'Required'),
  password: z.string().min(1, 'Required'),
})

type FormValues = z.infer<typeof schema>

function loginErrorMessage(err: unknown): string {
  const status = (err as any)?.response?.status
  if (status === 401) return 'Invalid credentials. Please check your email/username and password.'
  if (status === 403) return 'Your account has been deactivated. Contact an admin.'
  if (!(err as any)?.response) return 'Cannot reach the server. Is Docker running?'
  return 'Login failed. Please try again.'
}

export function LoginPage() {
  const location = useLocation()
  const { login } = useAuth()
  const { isAuthenticated } = useAuthStore()
  const returnTo = (location.state as { from?: { pathname: string } })?.from?.pathname ?? '/dashboard'

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  if (isAuthenticated) return <Navigate to={returnTo} replace />

  const onSubmit = async (values: FormValues) => {
    try {
      await login(values.email_or_username, values.password)
    } catch (err: unknown) {
      toast({ title: 'Login failed', description: loginErrorMessage(err), variant: 'destructive' })
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-indigo-100">
            <Brain className="h-6 w-6 text-indigo-600" />
          </div>
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to OmniMind</CardDescription>
        </CardHeader>

        <form onSubmit={handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="email_or_username">Email or username</Label>
              <Input
                id="email_or_username"
                placeholder="you@example.com"
                autoComplete="username"
                {...register('email_or_username')}
              />
              {errors.email_or_username && (
                <p className="text-xs text-red-600">{errors.email_or_username.message}</p>
              )}
            </div>

            <div className="space-y-1">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                {...register('password')}
              />
              {errors.password && (
                <p className="text-xs text-red-600">{errors.password.message}</p>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </Button>
            <p className="text-sm text-slate-500">
              No account?{' '}
              <Link to="/register" className="font-medium text-indigo-600 hover:underline">
                Register
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
