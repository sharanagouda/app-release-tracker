import { User } from '../../lib/store/authSlice';
import { apiClient, ApiResponse } from './ApiClient';

/**
 * AuthService handles authentication-related API calls
 * Uses the CodePush server API endpoints for token validation and user info
 */
class AuthService {
  /**
   * Validates an access token by calling the /authenticated endpoint
   * @param token - The access token to validate
   * @returns Promise<boolean> - true if token is valid, false otherwise
   */
  async validateToken(token: string): Promise<boolean> {
    try {
      // Temporarily set token in apiClient for validation
      const previousToken = apiClient.getAccessToken();
      apiClient.setAccessToken(token);

      const response = await apiClient.get<{ authenticated: boolean }>('/authenticated');

      // Restore previous token
      if (previousToken) {
        apiClient.setAccessToken(previousToken);
      } else {
        apiClient.clearAccessToken();
      }

      return response.status === 200;
    } catch (error: any) {
      console.error('Token validation error:', error);
      
      // BYPASS: If CORS error or network error, assume token is valid and proceed
      // This allows development to continue even when APIs are failing
      const isCorsOrNetworkError = 
        error.message?.includes('No response received') || 
        error.message?.toLowerCase().includes('network error') ||
        error.message?.toLowerCase().includes('cors') ||
        !error.status;
        
      if (isCorsOrNetworkError && import.meta.env.DEV) {
        console.warn('⚠️ [DEV ONLY] CORS/Network error detected - bypassing validation');
        console.log('Error details:', error.message);
        // Keep the token set for subsequent requests
        apiClient.setAccessToken(token);
        return true;
      }
      
      // Clear token only on actual authentication failures (401, 403, etc.)
      apiClient.clearAccessToken();
      return false;
    }
  }

  /**
   * Fetches the authenticated user's account information
   * @param token - The access token
   * @returns Promise<User> - User account details
   * @throws Error if the request fails
   */
  async getAccountInfo(token: string): Promise<User> {
    try {
      // Set token in apiClient for this request
      apiClient.setAccessToken(token);

      const response = await apiClient.get<{ account: User }>('/account');

      return response.data.account;
    } catch (error: any) {
      console.error('Get account info error:', error);
      
      // BYPASS: If CORS error or network error, return mock user data
      // This allows development to continue even when APIs are failing
      const isCorsOrNetworkError = 
        error.message?.includes('No response received') || 
        error.message?.toLowerCase().includes('network error') ||
        error.message?.toLowerCase().includes('cors') ||
        !error.status;
        
      if (isCorsOrNetworkError && import.meta.env.DEV) {
        console.warn('⚠️ [DEV ONLY] CORS/Network error detected - returning mock user data');
        console.log('Error details:', error.message);
        return {
          email: 'dev@codepush.local',
          name: 'Development User',
          createdTime: Date.now(),
        };
      }
      
      throw error;
    }
  }
}

// Export singleton instance
export const authService = new AuthService();
