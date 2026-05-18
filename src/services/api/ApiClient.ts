import axios, {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  InternalAxiosRequestConfig,
} from 'axios';

// Define the base API configuration
// In dev, use the Vite proxy to bypass CORS. In production, hit the real server.
export const CODEPUSH_SERVER_URL =
  import.meta.env.VITE_CODEPUSH_API_URL || 'https://codepush.landmarkgroup.com';
export const API_BASE_URL = import.meta.env.DEV ? '/codepush-api' : CODEPUSH_SERVER_URL;
const API_TIMEOUT = 30000; // 30 seconds

// Define response and error types
export interface ApiResponse<T = unknown> {
  data: T;
  status: number;
  statusText: string;
  headers: Record<string, string>;
}

export interface ApiError {
  message: string;
  status?: number;
  data?: unknown;
}

class ApiClient {
  private instance: AxiosInstance;
  private accessToken: string | null = null;

  constructor() {
    // Create axios instance with default config
    this.instance = axios.create({
      baseURL: API_BASE_URL,
      timeout: API_TIMEOUT,
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/vnd.code-push.v2+json',
        'X-CodePush-SDK-Version': '0.0.1',
      },
    });

    // Setup request interceptor
    this.instance.interceptors.request.use(
      this.handleRequestSuccess,
      this.handleRequestError
    );

    // Setup response interceptor for error handling
    this.instance.interceptors.response.use(
      (response) => response,
      this.handleResponseError
    );

    // Auto-set access token from environment variable if available
    const envToken = import.meta.env.VITE_CODEPUSH_ACCESS_TOKEN;
    if (envToken && envToken !== 'your_access_token_here') {
      this.accessToken = envToken;
    }
  }

  // Set auth token for API requests
  public setAccessToken(token: string): void {
    this.accessToken = token;
  }

  // Clear auth token
  public clearAccessToken(): void {
    this.accessToken = null;
  }

  // Get the current access token
  public getAccessToken(): string | null {
    return this.accessToken;
  }

  // Get the base URL (for debugging)
  public getBaseUrl(): string {
    return this.instance.defaults.baseURL || '';
  }

  // Request interceptor to add auth token and other headers
  private handleRequestSuccess = (
    config: InternalAxiosRequestConfig
  ): InternalAxiosRequestConfig => {
    // Add auth token if available
    if (this.accessToken) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${this.accessToken}`;
    }

    // Log request in development
    if (import.meta.env.DEV) {
      console.log('API Request:', config.method?.toUpperCase(), config.url);
    }

    return config;
  };

  // Handle request errors
  private handleRequestError = (error: unknown): Promise<never> => {
    console.error('Request error:', error);
    return Promise.reject(error);
  };

  // Transform AxiosResponse to ApiResponse
  private transformResponse<T>(response: AxiosResponse<T>): ApiResponse<T> {
    return {
      data: response.data,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers as Record<string, string>,
    };
  }

  // Handle response errors
  private handleResponseError = (error: unknown): Promise<never> => {
    const axiosError = error as {
      response?: { status?: number; data?: unknown };
      request?: unknown;
      code?: string;
      message?: string;
    };

    const apiError: ApiError = {
      message: 'An unexpected error occurred',
      status: axiosError.response?.status,
      data: axiosError.response?.data,
    };

    // Handle specific error status codes
    if (axiosError.response) {
      switch (axiosError.response.status) {
        case 401:
          apiError.message = 'Unauthorized. Please check your credentials.';
          break;
        case 403:
          apiError.message =
            'You do not have permission to access this resource.';
          break;
        case 404:
          apiError.message = 'The requested resource was not found.';
          break;
        case 500:
          apiError.message = 'Server error. Please try again later.';
          break;
        default:
          apiError.message =
            (axiosError.response.data as { message?: string })?.message ||
            'An error occurred with the request.';
      }
    } else if (axiosError.request) {
      // Request was made but no response received (CORS, network error, etc.)
      // Check for CORS-specific errors
      if (axiosError.code === 'ERR_NETWORK' || 
          axiosError.message?.toLowerCase().includes('network error') ||
          axiosError.message?.toLowerCase().includes('cors')) {
        apiError.message = 'CORS error or network error detected.';
      } else {
        apiError.message =
          'No response received from server. Please check your connection.';
      }
    }

    // Log error in development
    if (import.meta.env.DEV) {
      console.error('API Error:', apiError);
    }

    return Promise.reject(apiError);
  };

  // Generic request method
  private async request<T>(config: AxiosRequestConfig): Promise<ApiResponse<T>> {
    try {
      const response = await this.instance.request<T>(config);
      return this.transformResponse(response);
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // GET request
  public async get<T>(
    url: string,
    params?: Record<string, unknown>,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      method: 'get',
      url,
      params,
    });
  }

  // POST request
  public async post<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      method: 'post',
      url,
      data,
    });
  }

  // PUT request
  public async put<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      method: 'put',
      url,
      data,
    });
  }

  // PATCH request
  public async patch<T>(
    url: string,
    data?: unknown,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      method: 'patch',
      url,
      data,
    });
  }

  // DELETE request
  public async delete<T>(
    url: string,
    config?: AxiosRequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>({
      ...config,
      method: 'delete',
      url,
    });
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export the class for testing or custom instances
export default ApiClient;
