'use client'

import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '@/contexts/AuthContext'
import { PROTECTED_ROUTES } from '@/constants/routes'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Loader2 } from 'lucide-react'
import { PawLogo } from '@/components/paw-logo'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { signIn, loading } = useAuth()

  const [email, setEmail] = useState('xisben2001x@gmail.com')
  const [password, setPassword] = useState('xisben2001x@gmail.com')
  const [error, setError] = useState('')

  const from = location.state?.from?.pathname || PROTECTED_ROUTES.DASHBOARD

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    try {
      setError('')
      await signIn(email, password)
      navigate(from, { replace: true })
    } catch (err) {
      setError('Invalid email or password')
      console.error('Login error:', err)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 px-4 py-12 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center justify-center mb-4">
            <PawLogo className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-center">Welcome back</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium text-gray-700">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium text-gray-700">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary"
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-2 px-4 rounded-md transition duration-200 ease-in-out" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in to your account'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}

