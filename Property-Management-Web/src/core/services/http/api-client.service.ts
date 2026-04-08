import { appEnvironment } from '../../../app/config/env'

export class ApiClient {
  private readonly baseUrl: string

  constructor(baseUrl = appEnvironment.apiBaseUrl) {
    this.baseUrl = baseUrl
  }

  async get<TData>(_path: string): Promise<TData> {
    throw new Error(
      `GET requests are not implemented yet. Configure the API at ${this.baseUrl} when the backend is ready.`,
    )
  }

  async post<TRequest, TResponse>(
    _path: string,
    _payload: TRequest,
  ): Promise<TResponse> {
    throw new Error(
      `POST requests are not implemented yet. Configure the API at ${this.baseUrl} when the backend is ready.`,
    )
  }

  async put<TRequest, TResponse>(
    _path: string,
    _payload: TRequest,
  ): Promise<TResponse> {
    throw new Error(
      `PUT requests are not implemented yet. Configure the API at ${this.baseUrl} when the backend is ready.`,
    )
  }

  async delete(_path: string): Promise<void> {
    throw new Error(
      `DELETE requests are not implemented yet. Configure the API at ${this.baseUrl} when the backend is ready.`,
    )
  }
}

export const apiClient = new ApiClient()
