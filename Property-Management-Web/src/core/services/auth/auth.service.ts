import { apiClient } from '../http/api-client.service'

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthTokenResponse {
  accessToken: string
  tokenType: string
  expiresAtUtc: string
  userId: number
  role: string
  tenantId: number | null
  email: string
}

export const authService = {
  login: (payload: LoginRequest) =>
    apiClient.post<LoginRequest, AuthTokenResponse>('/auth/login', payload),
}
