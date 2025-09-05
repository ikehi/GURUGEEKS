import React, { useState, useEffect, useRef } from 'react'
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Pagination,
  CircularProgress,
  Alert,
  Paper,
} from '@mui/material'
import {
  Search as SearchIcon,
} from '@mui/icons-material'
import { useQuery } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { articlesAPI } from '../services/api'
import { Article } from '../types'
import ArticleCard from '../components/articles/ArticleCard'

const HomePage: React.FC = () => {
  const { user } = useAuth()
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [query, setQuery] = useState('')



  // Fetch articles based on search or user preferences
  const {
    data: articlesData,
    isLoading: articlesLoading,
    error: articlesError,
  } = useQuery({
    queryKey: ['articles', currentPage, searchQuery, user?.id],
    queryFn: () => {
      if (searchQuery) {
        return articlesAPI.searchArticles(searchQuery, currentPage, 20)
      } else if (user) {
        return articlesAPI.getPersonalizedArticles(currentPage, 20)
      } else {
        return articlesAPI.getArticles({
          page: currentPage,
          size: 20,
        })
      }
    },
  })

  const handleSearch = () => {
    setSearchQuery(query)
    setCurrentPage(1)
  }

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value)
  }

  const clearSearch = () => {
    setQuery('')
    setSearchQuery('')
    setCurrentPage(1)
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          News Aggregator
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Stay informed with the latest news from multiple sources
        </Typography>
      </Box>

      {/* Search */}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <TextField
              fullWidth
              label="Search articles"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                endAdornment: (
                  <Button
                    onClick={handleSearch}
                    startIcon={<SearchIcon />}
                    variant="contained"
                    sx={{ ml: 1 }}
                  >
                    Search
                  </Button>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box display="flex" gap={1}>
              <Button variant="outlined" onClick={clearSearch}>
                Clear Search
              </Button>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Results */}
      {articlesError && (
        <Alert severity="error" sx={{ mb: 2 }}>
          Error loading articles. Please try again.
        </Alert>
      )}

      {articlesLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Results Summary */}
          {articlesData && (
            <Box sx={{ mb: 3 }}>
              <Typography variant="h6" gutterBottom>
                {searchQuery ? `Search results for "${searchQuery}"` : 'Latest Articles'}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Showing {articlesData.articles.length} of {articlesData.total} articles
              </Typography>
            </Box>
          )}


          {/* Articles Grid */}
          {articlesData && articlesData.articles.length > 0 ? (
            <>
              <Grid container spacing={3}>
                {articlesData.articles.map((article: Article) => (
                  <Grid item xs={12} sm={6} md={4} key={article.id}>
                    <ArticleCard article={article} />
                  </Grid>
                ))}
              </Grid>

              {/* Pagination */}
              {articlesData.pages > 1 && (
                <Box display="flex" justifyContent="center" mt={4}>
                  <Pagination
                    count={articlesData.pages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    size="large"
                  />
                </Box>
              )}
            </>
          ) : (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="text.secondary">
                No articles found
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Try adjusting your search criteria or filters
              </Typography>
            </Box>
          )}
        </>
      )}
    </Box>
  )
}

export default HomePage
