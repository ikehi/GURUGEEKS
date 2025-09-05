import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { User, UserCreate, AuthContextType } from '../types'
import { authAPI } from '../services/api'

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Check for existing token and user on app load
    const storedToken = localStorage.getItem('token')
    const storedUser = localStorage.getItem('user')

    if (storedToken && storedUser) {
      try {
        setToken(storedToken)
        setUser(JSON.parse(storedUser))
      } catch (error) {
        console.error('Error parsing stored user data:', error)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
    }
    setIsLoading(false)
  }, [])

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true)
      const tokenData = await authAPI.login(email, password)
      
      // Store token first
      localStorage.setItem('token', tokenData.access_token)
      setToken(tokenData.access_token)
      
      // Now get user data with the token set
      const userData = await authAPI.getCurrentUser()
      
      // Store user data
      localStorage.setItem('user', JSON.stringify(userData))
      setUser(userData)
    } catch (error) {
      console.error('Login error:', error)
      // Clear token if login failed
      localStorage.removeItem('token')
      setToken(null)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const register = async (userData: UserCreate) => {
    try {
      setIsLoading(true)
      const newUser = await authAPI.register(userData)
      
      // After successful registration, log in the user
      await login(userData.email, userData.password)
    } catch (error) {
      console.error('Registration error:', error)
      throw error
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    // Clear localStorage
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    
    // Clear state
    setToken(null)
    setUser(null)
  }

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    isLoading,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
