import React from 'react'
import {
  Box,
  Typography,
  Card,
  CardContent,
  CardMedia,
  Chip,
  Button,
  IconButton,
  Tooltip,
  Divider,
  Grid,
  Paper,
  CircularProgress,
  Alert,
} from '@mui/material'
import {
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  OpenInNew as OpenInNewIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
  ArrowBack as ArrowBackIcon,
} from '@mui/icons-material'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useAuth } from '../context/AuthContext'
import { articlesAPI } from '../services/api'
import { Article } from '../types'

const ArticleDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()

  // Fetch article details
  const {
    data: article,
    isLoading,
    error,
  } = useQuery({
    queryKey: ['article', id],
    queryFn: () => articlesAPI.getArticle(Number(id)),
    enabled: !!id,
  })

  // Check if article is saved
  const { data: savedStatus } = useQuery({
    queryKey: ['article-saved', id],
    queryFn: () => articlesAPI.checkArticleSaved(Number(id)),
    enabled: !!id && !!user,
  })

  // Save/Unsave mutations
  const saveMutation = useMutation({
    mutationFn: (articleId: number) => articlesAPI.saveArticle(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-saved', id] })
      queryClient.invalidateQueries({ queryKey: ['saved-articles'] })
    },
    onError: (error) => {
      console.error('Error saving article:', error)
    },
  })

  const unsaveMutation = useMutation({
    mutationFn: (articleId: number) => articlesAPI.unsaveArticle(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article-saved', id] })
      queryClient.invalidateQueries({ queryKey: ['saved-articles'] })
    },
    onError: (error) => {
      console.error('Error unsaving article:', error)
    },
  })

  // Scrape content mutation
  const scrapeContentMutation = useMutation({
    mutationFn: (articleId: number) => articlesAPI.scrapeArticleContent(articleId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['article', id] })
    },
    onError: (error) => {
      console.error('Error scraping content:', error)
    },
  })

  const handleSaveToggle = () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (savedStatus?.is_saved) {
      unsaveMutation.mutate(Number(id))
    } else {
      saveMutation.mutate(Number(id))
    }
  }

  const handleExternalLink = () => {
    if (article) {
      window.open(article.url, '_blank', 'noopener,noreferrer')
    }
  }

  const handleScrapeContent = () => {
    if (article) {
      scrapeContentMutation.mutate(article.id)
    }
  }

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    )
  }

  if (error || !article) {
    return (
      <Box>
        <Alert severity="error" sx={{ mb: 2 }}>
          Article not found or error loading article.
        </Alert>
        <Button
          variant="outlined"
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
        >
          Back to Home
        </Button>
      </Box>
    )
  }

  return (
    <Box>
      {/* Back Button */}
      <Button
        variant="outlined"
        startIcon={<ArrowBackIcon />}
        onClick={() => navigate('/')}
        sx={{ mb: 3 }}
      >
        Back to Articles
      </Button>

      <Paper elevation={2} sx={{ p: 3 }}>
        {/* Article Header */}
        <Box sx={{ mb: 3 }}>
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap' }}>
            <Chip
              label={article.source_name}
              color="primary"
              variant="outlined"
            />
            {article.category && (
              <Chip
                label={article.category}
                color="secondary"
                variant="outlined"
              />
            )}
          </Box>

          <Typography variant="h3" component="h1" gutterBottom sx={{ fontWeight: 600 }}>
            {article.title}
          </Typography>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2, flexWrap: 'wrap' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTimeIcon fontSize="small" color="action" />
              <Typography variant="body2" color="text.secondary">
                {format(new Date(article.published_at), 'MMMM dd, yyyy')}
              </Typography>
            </Box>

            {article.author && (
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon fontSize="small" color="action" />
                <Typography variant="body2" color="text.secondary">
                  {article.author}
                </Typography>
              </Box>
            )}
          </Box>

          {/* Action Buttons */}
          <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
            <Tooltip title="Open in new tab">
              <IconButton
                onClick={handleExternalLink}
                sx={{ color: 'text.secondary' }}
              >
                <OpenInNewIcon />
              </IconButton>
            </Tooltip>

            {user && (
              <Tooltip title={savedStatus?.is_saved ? 'Remove from saved' : 'Save article'}>
                <IconButton
                  onClick={handleSaveToggle}
                  disabled={saveMutation.isPending || unsaveMutation.isPending}
                  sx={{
                    color: savedStatus?.is_saved ? 'primary.main' : 'text.secondary',
                    '&:hover': {
                      color: savedStatus?.is_saved ? 'primary.dark' : 'primary.main',
                    },
                  }}
                >
                  {savedStatus?.is_saved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                </IconButton>
              </Tooltip>
            )}
          </Box>
        </Box>

        {/* Article Image */}
        {article.image_url && (
          <Box sx={{ mb: 3 }}>
            <img
              src={article.image_url}
              alt={article.title}
              style={{
                width: '100%',
                maxHeight: '400px',
                objectFit: 'cover',
                borderRadius: '8px',
              }}
            />
          </Box>
        )}

        {/* Article Content */}
        <Box sx={{ mb: 3 }}>
          {article.description && (
            <Typography
              variant="h6"
              color="text.secondary"
              sx={{ mb: 3, fontStyle: 'italic' }}
            >
              {article.description}
            </Typography>
          )}

          {article.content ? (
            <Typography variant="body1" sx={{ lineHeight: 1.8 }}>
              {article.content}
            </Typography>
          ) : (
            <Box>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
                Full content not available. Please visit the original source to read the complete article.
              </Typography>
              <Button
                variant="outlined"
                onClick={handleScrapeContent}
                disabled={scrapeContentMutation.isPending}
                sx={{ mb: 2 }}
              >
                {scrapeContentMutation.isPending ? 'Scraping...' : 'Try to Scrape Content'}
              </Button>
              {scrapeContentMutation.error && (
                <Alert severity="error" sx={{ mt: 1 }}>
                  Failed to scrape content. Please try again or visit the original source.
                </Alert>
              )}
            </Box>
          )}
        </Box>

        {/* Tags */}
        {article.tags && article.tags.length > 0 && (
          <Box sx={{ mt: 3 }}>
            <Typography variant="h6" gutterBottom>
              Tags
            </Typography>
            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
              {article.tags.map((tag, index) => (
                <Chip
                  key={index}
                  label={tag}
                  size="small"
                  variant="outlined"
                />
              ))}
            </Box>
          </Box>
        )}

        {/* External Link */}
        <Divider sx={{ my: 3 }} />
        <Box textAlign="center">
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Read the full article at the original source
          </Typography>
          <Button
            variant="contained"
            startIcon={<OpenInNewIcon />}
            onClick={handleExternalLink}
            size="large"
          >
            Read Full Article
          </Button>
        </Box>
      </Paper>
    </Box>
  )
}

export default ArticleDetailPage
