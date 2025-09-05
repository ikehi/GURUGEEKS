import React, { useState } from 'react'
import {
  Box,
  Typography,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  OutlinedInput,
  Chip,
  Divider,
  Avatar,
} from '@mui/material'
import { useForm, Controller } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../context/AuthContext'
import { usersAPI, articlesAPI } from '../services/api'
import { UserPreferenceCreate, UserPreferenceUpdate } from '../types'

const profileSchema = yup.object({
  username: yup.string().min(3, 'Username must be at least 3 characters'),
  email: yup.string().email('Invalid email address'),
}).required()

const preferencesSchema = yup.object({
  preferred_sources: yup.array().of(yup.string()),
  preferred_categories: yup.array().of(yup.string()),
  preferred_authors: yup.array().of(yup.string()),
  language: yup.string().required(),
  country: yup.string().required(),
}).required()

type ProfileFormData = yup.InferType<typeof profileSchema>
type PreferencesFormData = yup.InferType<typeof preferencesSchema>

const ProfilePage: React.FC = () => {
  const { user } = useAuth()
  const queryClient = useQueryClient()
  const [profileError, setProfileError] = useState<string | null>(null)
  const [preferencesError, setPreferencesError] = useState<string | null>(null)
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null)
  const [preferencesSuccess, setPreferencesSuccess] = useState<string | null>(null)

  // Fetch user preferences
  const {
    data: preferences,
    isLoading: preferencesLoading,
  } = useQuery({
    queryKey: ['user-preferences'],
    queryFn: () => usersAPI.getPreferences(),
  })

  // Fetch available filters for preferences
  const {
    data: availableFilters,
    isLoading: filtersLoading,
  } = useQuery({
    queryKey: ['filters'],
    queryFn: () => articlesAPI.getAvailableFilters(),
  })

  // Profile form
  const profileForm = useForm<ProfileFormData>({
    resolver: yupResolver(profileSchema),
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
    },
  })

  // Preferences form
  const preferencesForm = useForm<PreferencesFormData>({
    resolver: yupResolver(preferencesSchema),
    defaultValues: {
      preferred_sources: preferences?.preferred_sources || [],
      preferred_categories: preferences?.preferred_categories || [],
      preferred_authors: preferences?.preferred_authors || [],
      language: preferences?.language || 'en',
      country: preferences?.country || 'us',
    },
  })

  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: (data: ProfileFormData) => usersAPI.updateUser(data),
    onSuccess: () => {
      setProfileSuccess('Profile updated successfully!')
      setProfileError(null)
      queryClient.invalidateQueries({ queryKey: ['user'] })
    },
    onError: (error: any) => {
      setProfileError(error.response?.data?.detail || 'Failed to update profile')
      setProfileSuccess(null)
    },
  })

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: (data: UserPreferenceUpdate) => usersAPI.updatePreferences(data),
    onSuccess: () => {
      setPreferencesSuccess('Preferences updated successfully!')
      setPreferencesError(null)
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] })
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['personalized-articles'] })
    },
    onError: (error: any) => {
      setPreferencesError(error.response?.data?.detail || 'Failed to update preferences')
      setPreferencesSuccess(null)
    },
  })

  // Create preferences mutation
  const createPreferencesMutation = useMutation({
    mutationFn: (data: UserPreferenceCreate) => usersAPI.createPreferences(data),
    onSuccess: () => {
      setPreferencesSuccess('Preferences created successfully!')
      setPreferencesError(null)
      queryClient.invalidateQueries({ queryKey: ['user-preferences'] })
      queryClient.invalidateQueries({ queryKey: ['articles'] })
      queryClient.invalidateQueries({ queryKey: ['personalized-articles'] })
    },
    onError: (error: any) => {
      setPreferencesError(error.response?.data?.detail || 'Failed to create preferences')
      setPreferencesSuccess(null)
    },
  })

  const onProfileSubmit = (data: ProfileFormData) => {
    updateProfileMutation.mutate(data)
  }

  const onPreferencesSubmit = (data: PreferencesFormData) => {
    if (preferences) {
      updatePreferencesMutation.mutate(data)
    } else {
      createPreferencesMutation.mutate({
        preferred_sources: data.preferred_sources || [],
        preferred_categories: data.preferred_categories || [],
        preferred_authors: data.preferred_authors || [],
        language: data.language || 'en',
        country: data.country || 'us'
      })
    }
  }

  if (preferencesLoading || filtersLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    )
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Manage your account settings and preferences
        </Typography>
      </Box>

      <Grid container spacing={3}>
        {/* Profile Information */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              Profile Information
            </Typography>

            {profileError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {profileError}
              </Alert>
            )}

            {profileSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {profileSuccess}
              </Alert>
            )}

            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <Avatar
                sx={{ width: 64, height: 64, mr: 2 }}
              >
                {user?.username.charAt(0).toUpperCase()}
              </Avatar>
              <Box>
                <Typography variant="h6">{user?.username}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Member since {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'N/A'}
                </Typography>
              </Box>
            </Box>

            <form onSubmit={profileForm.handleSubmit(onProfileSubmit)}>
              <Controller
                name="username"
                control={profileForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Username"
                    fullWidth
                    margin="normal"
                    error={!!profileForm.formState.errors.username}
                    helperText={profileForm.formState.errors.username?.message}
                    disabled={updateProfileMutation.isPending}
                  />
                )}
              />

              <Controller
                name="email"
                control={profileForm.control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Email"
                    type="email"
                    fullWidth
                    margin="normal"
                    error={!!profileForm.formState.errors.email}
                    helperText={profileForm.formState.errors.email?.message}
                    disabled={updateProfileMutation.isPending}
                  />
                )}
              />

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={updateProfileMutation.isPending}
                sx={{ mt: 2 }}
              >
                {updateProfileMutation.isPending ? <CircularProgress size={24} /> : 'Update Profile'}
              </Button>
            </form>
          </Paper>
        </Grid>

        {/* News Preferences */}
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>
              News Preferences
            </Typography>

            {preferencesError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {preferencesError}
              </Alert>
            )}

            {preferencesSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {preferencesSuccess}
              </Alert>
            )}

            <form onSubmit={preferencesForm.handleSubmit(onPreferencesSubmit)}>
              {availableFilters && (
                <>
                  <Controller
                    name="preferred_sources"
                    control={preferencesForm.control}
                    render={({ field }) => (
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Preferred Sources</InputLabel>
                        <Select
                          multiple
                          value={field.value}
                          onChange={field.onChange}
                          input={<OutlinedInput label="Preferred Sources" />}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => (
                                <Chip key={value} label={value} size="small" />
                              ))}
                            </Box>
                          )}
                        >
                          {availableFilters.sources.map((source) => (
                            <MenuItem key={source} value={source}>
                              {source}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />

                  <Controller
                    name="preferred_categories"
                    control={preferencesForm.control}
                    render={({ field }) => (
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Preferred Categories</InputLabel>
                        <Select
                          multiple
                          value={field.value}
                          onChange={field.onChange}
                          input={<OutlinedInput label="Preferred Categories" />}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => (
                                <Chip key={value} label={value} size="small" />
                              ))}
                            </Box>
                          )}
                        >
                          {availableFilters.categories.map((category) => (
                            <MenuItem key={category} value={category}>
                              {category}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />

                  <Controller
                    name="preferred_authors"
                    control={preferencesForm.control}
                    render={({ field }) => (
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Preferred Authors</InputLabel>
                        <Select
                          multiple
                          value={field.value}
                          onChange={field.onChange}
                          input={<OutlinedInput label="Preferred Authors" />}
                          renderValue={(selected) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                              {selected.map((value) => (
                                <Chip key={value} label={value} size="small" />
                              ))}
                            </Box>
                          )}
                        >
                          {availableFilters.authors.map((author) => (
                            <MenuItem key={author} value={author}>
                              {author}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />

                  <Controller
                    name="language"
                    control={preferencesForm.control}
                    render={({ field }) => (
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Language</InputLabel>
                        <Select
                          value={field.value}
                          onChange={field.onChange}
                          input={<OutlinedInput label="Language" />}
                        >
                          {availableFilters.languages.map((lang) => (
                            <MenuItem key={lang} value={lang}>
                              {lang.toUpperCase()}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />

                  <Controller
                    name="country"
                    control={preferencesForm.control}
                    render={({ field }) => (
                      <FormControl fullWidth margin="normal">
                        <InputLabel>Country</InputLabel>
                        <Select
                          value={field.value}
                          onChange={field.onChange}
                          input={<OutlinedInput label="Country" />}
                        >
                          {availableFilters.countries.map((country) => (
                            <MenuItem key={country} value={country}>
                              {country.toUpperCase()}
                            </MenuItem>
                          ))}
                        </Select>
                      </FormControl>
                    )}
                  />
                </>
              )}

              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={updatePreferencesMutation.isPending || createPreferencesMutation.isPending}
                sx={{ mt: 2 }}
              >
                {(updatePreferencesMutation.isPending || createPreferencesMutation.isPending) ? (
                  <CircularProgress size={24} />
                ) : (
                  preferences ? 'Update Preferences' : 'Create Preferences'
                )}
              </Button>
            </form>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  )
}

export default ProfilePage
