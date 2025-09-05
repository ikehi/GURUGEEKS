import React from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Box, Container } from '@mui/material'

import Layout from './components/layout/Layout'
import HomePage from './pages/HomePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import ArticleDetailPage from './pages/ArticleDetailPage'
import SavedArticlesPage from './pages/SavedArticlesPage'
import ProfilePage from './pages/ProfilePage'
import ProtectedRoute from './components/auth/ProtectedRoute'

function App() {
  return (
    <Box sx={{ minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      <Layout>
        <Container maxWidth="lg" sx={{ py: 3 }}>
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/article/:id" element={<ArticleDetailPage />} />
            
            {/* Protected routes */}
            <Route
              path="/saved"
              element={
                <ProtectedRoute>
                  <SavedArticlesPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ProfilePage />
                </ProtectedRoute>
              }
            />
            
            {/* Fallback */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Container>
      </Layout>
    </Box>
  )
}

export default App
