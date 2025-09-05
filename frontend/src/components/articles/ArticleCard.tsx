import React, { useState } from 'react'
import {
  Card,
  CardContent,
  CardMedia,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Tooltip,
} from '@mui/material'
import {
  Bookmark as BookmarkIcon,
  BookmarkBorder as BookmarkBorderIcon,
  OpenInNew as OpenInNewIcon,
  AccessTime as AccessTimeIcon,
  Person as PersonIcon,
} from '@mui/icons-material'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { articlesAPI } from '../../services/api'
import { Article, ArticleCardProps } from '../../types'

const ArticleCard: React.FC<ArticleCardProps> = ({ article, onSave, onUnsave, isSaved }) => {
  const navigate = useNavigate()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [saved, setSaved] = useState(isSaved || false)

  // Save/Unsave article mutation
  const saveMutation = useMutation({
    mutationFn: (articleId: number) => articlesAPI.saveArticle(articleId),
    onSuccess: () => {
      setSaved(true)
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['saved-articles'] })
      onSave?.(article.id)
    },
    onError: (error) => {
      console.error('Error saving article:', error)
    },
  })

  const unsaveMutation = useMutation({
    mutationFn: (articleId: number) => articlesAPI.unsaveArticle(articleId),
    onSuccess: () => {
      setSaved(false)
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['saved-articles'] })
      onUnsave?.(article.id)
    },
    onError: (error) => {
      console.error('Error unsaving article:', error)
    },
  })

  const handleSaveToggle = () => {
    if (!user) {
      navigate('/login')
      return
    }

    if (saved) {
      unsaveMutation.mutate(article.id)
    } else {
      saveMutation.mutate(article.id)
    }
  }

  const handleReadMore = () => {
    navigate(`/article/${article.id}`)
  }

  const handleExternalLink = () => {
    window.open(article.url, '_blank', 'noopener,noreferrer')
  }

  return (
    <Card
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-4px)',
          boxShadow: '0 8px 25px rgba(0,0,0,0.15)',
        },
      }}
    >
      {/* Article Image */}
      {article.image_url && (
        <CardMedia
          component="img"
          height="200"
          image={article.image_url}
          alt={article.title}
          sx={{ objectFit: 'cover' }}
        />
      )}

      <CardContent sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Source and Category */}
        <Box sx={{ mb: 1, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip
            label={article.source_name}
            size="small"
            color="primary"
            variant="outlined"
          />
          {article.category && (
            <Chip
              label={article.category}
              size="small"
              color="secondary"
              variant="outlined"
            />
          )}
        </Box>

        {/* Title */}
        <Typography
          variant="h6"
          component="h2"
          gutterBottom
          sx={{
            fontWeight: 600,
            lineHeight: 1.3,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            cursor: 'pointer',
            '&:hover': {
              color: 'primary.main',
            },
          }}
          onClick={handleReadMore}
        >
          {article.title}
        </Typography>

        {/* Description */}
        {article.description && (
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              mb: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 3,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {article.description}
          </Typography>
        )}

        {/* Meta Information */}
        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
            <AccessTimeIcon fontSize="small" color="action" />
            <Typography variant="caption" color="text.secondary">
              {format(new Date(article.published_at), 'MMM dd, yyyy')}
            </Typography>
          </Box>

          {article.author && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PersonIcon fontSize="small" color="action" />
              <Typography variant="caption" color="text.secondary">
                {article.author}
              </Typography>
            </Box>
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', px: 2, pb: 2 }}>
        <Button
          size="small"
          onClick={handleReadMore}
          sx={{ textTransform: 'none' }}
        >
          Read More
        </Button>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Open in new tab">
            <IconButton
              size="small"
              onClick={handleExternalLink}
              sx={{ color: 'text.secondary' }}
            >
              <OpenInNewIcon fontSize="small" />
            </IconButton>
          </Tooltip>

          {user && (
            <Tooltip title={saved ? 'Remove from saved' : 'Save article'}>
              <IconButton
                size="small"
                onClick={handleSaveToggle}
                disabled={saveMutation.isPending || unsaveMutation.isPending}
                sx={{
                  color: saved ? 'primary.main' : 'text.secondary',
                  '&:hover': {
                    color: saved ? 'primary.dark' : 'primary.main',
                  },
                }}
              >
                {saved ? <BookmarkIcon fontSize="small" /> : <BookmarkBorderIcon fontSize="small" />}
              </IconButton>
            </Tooltip>
          )}
        </Box>
      </CardActions>
    </Card>
  )
}

export default ArticleCard
