import api from './axios'
import type { AuthTokens, User } from '../types'

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<AuthTokens>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthTokens>('/auth/login', data).then((r) => r.data),

  logout: (refreshToken: string) =>
    api.post('/auth/logout', { refreshToken }).then((r) => r.data),

  getMe: () =>
    api.get<User>('/users/me').then((r) => r.data),

  updateMe: (data: { name?: string; email?: string }) =>
    api.put<User>('/users/me', data).then((r) => r.data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.put('/users/me/password', data).then((r) => r.data),
}
