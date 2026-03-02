import { createSlice, createAsyncThunk } from '@reduxjs/toolkit'
import { authApi } from '../../api/auth.api'
import type { User } from '../../types'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  loading: boolean
  error: string | null
}

const initialState: AuthState = {
  user: null,
  isAuthenticated: !!localStorage.getItem('accessToken'),
  loading: false,
  error: null,
}

export const login = createAsyncThunk(
  'auth/login',
  async (data: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const result = await authApi.login(data)
      localStorage.setItem('accessToken', result.accessToken)
      localStorage.setItem('refreshToken', result.refreshToken)
      return result.user
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      return rejectWithValue(e.response?.data?.error || 'Erreur de connexion')
    }
  }
)

export const register = createAsyncThunk(
  'auth/register',
  async (data: { name: string; email: string; password: string }, { rejectWithValue }) => {
    try {
      const result = await authApi.register(data)
      localStorage.setItem('accessToken', result.accessToken)
      localStorage.setItem('refreshToken', result.refreshToken)
      return result.user
    } catch (err: unknown) {
      const e = err as { response?: { data?: { error?: string } } }
      return rejectWithValue(e.response?.data?.error || 'Erreur lors de l\'inscription')
    }
  }
)

export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      return await authApi.getMe()
    } catch {
      return rejectWithValue('Session expirée')
    }
  }
)

export const logout = createAsyncThunk('auth/logout', async () => {
  const refreshToken = localStorage.getItem('refreshToken')
  if (refreshToken) {
    try { await authApi.logout(refreshToken) } catch { /* ignore */ }
  }
  localStorage.removeItem('accessToken')
  localStorage.removeItem('refreshToken')
})

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => { state.error = null },
  },
  extraReducers: (builder) => {
    // login
    builder.addCase(login.pending, (state) => { state.loading = true; state.error = null })
    builder.addCase(login.fulfilled, (state, action) => {
      state.loading = false
      state.user = action.payload
      state.isAuthenticated = true
    })
    builder.addCase(login.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload as string
    })
    // register
    builder.addCase(register.pending, (state) => { state.loading = true; state.error = null })
    builder.addCase(register.fulfilled, (state, action) => {
      state.loading = false
      state.user = action.payload
      state.isAuthenticated = true
    })
    builder.addCase(register.rejected, (state, action) => {
      state.loading = false
      state.error = action.payload as string
    })
    // fetchMe
    builder.addCase(fetchMe.fulfilled, (state, action) => {
      state.user = action.payload
      state.isAuthenticated = true
    })
    builder.addCase(fetchMe.rejected, (state) => {
      state.user = null
      state.isAuthenticated = false
    })
    // logout
    builder.addCase(logout.fulfilled, (state) => {
      state.user = null
      state.isAuthenticated = false
    })
  },
})

export const { clearError } = authSlice.actions
export default authSlice.reducer
