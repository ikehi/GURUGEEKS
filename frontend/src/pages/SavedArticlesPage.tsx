import React, { useState } from 'react'
import {
  Box,
  Typography,
  Grid,
  Pagination,
  CircularProgress,
  Alert,
  Paper,
  Chip,
} from '@mui/material'
import { useQuery } from '@tanstack/react-query'
import { articlesAPI } from '../services/api'
import { Article } from '../types'
import ArticleCard from '../components/articles/ArticleCard'

const SavedArticlesPage: React.FC = () => {
  const [currentPage, setCurrentPage] = useState(1)

  const {
    data: articlesData,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['saved-articles', currentPage],
    queryFn: () => articlesAPI.getSavedArticles(currentPage, 20),
  })

  const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
    setCurrentPage(value)
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    )
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        Error loading saved articles. Please try again.
      </Alert>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Saved Articles
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Your collection of saved articles for later reading
        </Typography>
      </Box>

      {/* Results Summary */}
      {articlesData && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
            <Typography variant="h6">
              {articlesData.total} saved article{articlesData.total !== 1 ? 's' : ''}
            </Typography>
            {articlesData.total > 0 && (
              <Chip
                label={`Page ${currentPage} of ${articlesData.pages}`}
                size="small"
                variant="outlined"
              />
            )}
          </Box>
        </Paper>
      )}

      {/* Articles Grid */}
      {articlesData && articlesData.articles.length > 0 ? (
        <>
          <Grid container spacing={3}>
            {articlesData.articles.map((article: Article) => (
              <Grid item xs={12} sm={6} md={4} key={article.id}>
                <ArticleCard
                  article={article}
                  isSaved={true}
                />
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
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" gutterBottom>
            No saved articles yet
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Start saving articles by clicking the bookmark icon on any article you find interesting.
          </Typography>
        </Paper>
      )}
    </Box>
  )
}

export default SavedArticlesPage
