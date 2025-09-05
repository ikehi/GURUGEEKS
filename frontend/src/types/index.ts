// User types
export interface User {
  id: number
  email: string
  username: string
  is_active: boolean
  is_verified: boolean
  created_at: string
}

export interface UserCreate {
  email: string
  username: string
  password: string
}

export interface UserLogin {
  email: string
  password: string
}

export interface UserUpdate {
  username?: string
  email?: string
}

// Authentication types
export interface Token {
  access_token: string
  token_type: string
  expires_in: number
}

export interface AuthContextType {
  user: User | null
  token: string | null
  login: (email: string, password: string) => Promise<void>
  register: (userData: UserCreate) => Promise<void>
  logout: () => void
  isLoading: boolean
}

// Article types
export interface Article {
  id: number
  external_id: string
  title: string
  description?: string
  content?: string
  url: string
  image_url?: string
  source_name: string
  source_id?: string
  author?: string
  category?: string
  tags: string[]
  published_at: string
  scraped_at: string
  language: string
  country: string
  is_active: boolean
}

export interface ArticleListResponse {
  articles: Article[]
  total: number
  page: number
  size: number
  pages: number
}

export interface ArticleSearchParams {
  query?: string
  sources?: string[]
  categories?: string[]
  authors?: string[]
  date_from?: string
  date_to?: string
  language?: string
  country?: string
  page?: number
  size?: number
}

export interface ArticleFilterResponse {
  sources: string[]
  categories: string[]
  authors: string[]
  languages: string[]
  countries: string[]
}

// User Preference types
export interface UserPreference {
  id: number
  user_id: number
  preferred_sources: string[]
  preferred_categories: string[]
  preferred_authors: string[]
  language: string
  country: string
  created_at: string
  updated_at?: string
}

export interface UserPreferenceCreate {
  preferred_sources: string[]
  preferred_categories: string[]
  preferred_authors: string[]
  language: string
  country: string
}

export interface UserPreferenceUpdate {
  preferred_sources?: string[]
  preferred_categories?: string[]
  preferred_authors?: string[]
  language?: string
  country?: string
}

// Saved Article types
export interface SavedArticle {
  id: number
  user_id: number
  article_id: number
  saved_at: string
  notes?: string
  article: Article
}

export interface SavedArticleCreate {
  article_id: number
  notes?: string
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean
  message: string
  data?: T
}

export interface ErrorResponse {
  detail: string
  error_code?: string
}

// Form types
export interface LoginFormData {
  email: string
  password: string
}

export interface RegisterFormData {
  email: string
  username: string
  password: string
  confirmPassword: string
}

export interface SearchFormData {
  query: string
  sources: string[]
  categories: string[]
  authors: string[]
  date_from?: string
  date_to?: string
  language: string
  country: string
}

// Component props types
export interface LayoutProps {
  children: React.ReactNode
}

export interface ArticleCardProps {
  article: Article
  onSave?: (articleId: number) => void
  onUnsave?: (articleId: number) => void
  isSaved?: boolean
}

export interface SearchFiltersProps {
  filters: ArticleFilterResponse
  onFilterChange: (filters: Partial<SearchFormData>) => void
  currentFilters: SearchFormData
}

export interface PaginationProps {
  page: number
  totalPages: number
  onPageChange: (page: number) => void
}
