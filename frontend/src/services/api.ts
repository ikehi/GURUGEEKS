import axios, { AxiosInstance, AxiosResponse, AxiosError } from 'axios'
import { Token, ErrorResponse } from '@/types'

// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor to handle errors
api.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  (error: AxiosError<ErrorResponse>) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: async (email: string, password: string): Promise<Token> => {
    const formData = new FormData()
    formData.append('username', email)
    formData.append('password', password)
    
    const response = await api.post('/api/auth/login', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
    return response.data
  },

  register: async (userData: { email: string; username: string; password: string }) => {
    const response = await api.post('/api/auth/register', userData)
    return response.data
  },

  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me')
    return response.data
  },

  refreshToken: async (): Promise<Token> => {
    const response = await api.post('/api/auth/refresh')
    return response.data
  },
}

// Articles API
export const articlesAPI = {
  getArticles: async (params?: {
    page?: number
    size?: number
    sources?: string[]
    categories?: string[]
    authors?: string[]
    date_from?: string
    date_to?: string
    language?: string
    country?: string
  }) => {
    const response = await api.get('/api/articles', { params })
    return response.data
  },

  searchArticles: async (query: string, page: number = 1, size: number = 20) => {
    const response = await api.get('/api/articles/search', {
      params: { q: query, page, size },
    })
    return response.data
  },

  getPersonalizedArticles: async (page: number = 1, size: number = 20) => {
    const response = await api.get('/api/articles/personalized', {
      params: { page, size },
    })
    return response.data
  },

  getArticle: async (id: number) => {
    const response = await api.get(`/api/articles/${id}`)
    return response.data
  },

  getAvailableFilters: async () => {
    const response = await api.get('/api/articles/filters/available')
    return response.data
  },

  saveArticle: async (articleId: number, notes?: string) => {
    const response = await api.post(`/api/articles/${articleId}/save`, { notes })
    return response.data
  },

  unsaveArticle: async (articleId: number) => {
    const response = await api.delete(`/api/articles/${articleId}/save`)
    return response.data
  },

  getSavedArticles: async (page: number = 1, size: number = 20) => {
    const response = await api.get('/api/articles/saved/list', {
      params: { page, size },
    })
    return response.data
  },

  checkArticleSaved: async (articleId: number) => {
    const response = await api.get(`/api/articles/${articleId}/saved`)
    return response.data
  },

  scrapeArticleContent: async (articleId: number) => {
    const response = await api.post(`/api/articles/${articleId}/scrape-content`)
    return response.data
  },
}

// Users API
export const usersAPI = {
  getCurrentUser: async () => {
    const response = await api.get('/api/users/me')
    return response.data
  },

  updateUser: async (userData: { username?: string; email?: string }) => {
    const response = await api.put('/api/users/me', userData)
    return response.data
  },

  getPreferences: async () => {
    const response = await api.get('/api/users/preferences')
    return response.data
  },

  createPreferences: async (preferences: {
    preferred_sources: string[]
    preferred_categories: string[]
    preferred_authors: string[]
    language: string
    country: string
  }) => {
    const response = await api.post('/api/users/preferences', preferences)
    return response.data
  },

  updatePreferences: async (preferences: {
    preferred_sources?: string[]
    preferred_categories?: string[]
    preferred_authors?: string[]
    language?: string
    country?: string
  }) => {
    const response = await api.put('/api/users/preferences', preferences)
    return response.data
  },
}

export default api
