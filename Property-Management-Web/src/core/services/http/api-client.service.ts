import { appEnvironment } from '../../../app/config/env'
import { getStoredAuthToken } from '../../auth/auth-storage'

export class ApiClient {
  private readonly baseUrl: string

  constructor(baseUrl = appEnvironment.apiBaseUrl) {
    this.baseUrl = baseUrl
  }

  async get<TData>(path: string): Promise<TData> {
    return this.request<TData>(path, { method: 'GET' })
  }

  async post<TRequest, TResponse>(
    path: string,
    payload: TRequest,
  ): Promise<TResponse> {
    return this.request<TResponse>(path, {
      method: 'POST',
      body: JSON.stringify(payload),
    })
  }

  async put<TRequest, TResponse>(
    path: string,
    payload: TRequest,
  ): Promise<TResponse> {
    return this.request<TResponse>(path, {
      method: 'PUT',
      body: JSON.stringify(payload),
    })
  }

  async delete(path: string): Promise<void> {
    await this.request(path, { method: 'DELETE' })
  }

  private async request<TData>(
    path: string,
    init: RequestInit,
  ): Promise<TData> {
    const response = await fetch(`${this.baseUrl}${path}`, {
      ...init,
      headers: {
        'Content-Type': 'application/json',
        ...(getStoredAuthToken()
          ? { Authorization: `Bearer ${getStoredAuthToken()}` }
          : {}),
        ...init.headers,
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(
        getApiErrorMessage(errorText, response.status),
      )
    }

    if (response.status === 204) {
      return undefined as TData
    }

    return (await response.json()) as TData
  }
}

export const apiClient = new ApiClient()

function getApiErrorMessage(errorText: string, status: number) {
  if (!errorText) {
    return `Request failed with status ${status}.`
  }

  try {
    const parsed = JSON.parse(errorText) as { message?: string }
    if (parsed.message) {
      return parsed.message
    }
  } catch {
    return errorText
  }

  return errorText
}
