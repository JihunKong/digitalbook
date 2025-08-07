import { getCsrfToken, clearCsrfToken } from '@/hooks/useCsrf';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://xn--220bu63c.com/api';

interface ApiResponse<T = any> {
  data?: T;
  error?: {
    message: string;
    statusCode: number;
    code?: string;
  };
}

interface RequestInterceptor {
  onRequest?: (config: RequestInit) => RequestInit | Promise<RequestInit>;
  onResponse?: (response: Response) => Response | Promise<Response>;
  onError?: (error: Error) => Error | Promise<Error>;
}

class UnifiedApiClient {
  private baseURL: string;
  private interceptors: RequestInterceptor[] = [];
  private refreshPromise: Promise<any> | null = null;

  constructor() {
    this.baseURL = API_BASE_URL;
    
    // Add default interceptor for token refresh
    this.addInterceptor({
      onResponse: async (response) => {
        // Handle 401 errors with token refresh
        if (response.status === 401 && !response.url.includes('/auth/refresh')) {
          const refreshed = await this.handleTokenRefresh();
          if (refreshed) {
            // Retry the original request
            const originalRequest = response.url.replace(this.baseURL, '');
            const retryResponse = await this.request(originalRequest, {
              method: response.headers.get('X-Original-Method') || 'GET',
            });
            return new Response(JSON.stringify(retryResponse), {
              status: retryResponse.error ? retryResponse.error.statusCode : 200,
              headers: { 'Content-Type': 'application/json' },
            });
          }
        }
        return response;
      },
    });
  }

  addInterceptor(interceptor: RequestInterceptor) {
    this.interceptors.push(interceptor);
  }

  private async handleTokenRefresh(): Promise<boolean> {
    // Prevent multiple simultaneous refresh attempts
    if (this.refreshPromise) {
      return this.refreshPromise;
    }

    this.refreshPromise = (async () => {
      try {
        const csrfToken = await getCsrfToken();
        const response = await fetch(`${this.baseURL}/auth/refresh`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'X-CSRF-Token': csrfToken || '',
          },
        });

        if (response.ok) {
          return true;
        }
        
        // If refresh fails, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return false;
      } catch (error) {
        console.error('Token refresh failed:', error);
        if (typeof window !== 'undefined') {
          window.location.href = '/auth/login';
        }
        return false;
      } finally {
        this.refreshPromise = null;
      }
    })();

    return this.refreshPromise;
  }

  private async applyRequestInterceptors(config: RequestInit): Promise<RequestInit> {
    let modifiedConfig = config;
    for (const interceptor of this.interceptors) {
      if (interceptor.onRequest) {
        modifiedConfig = await interceptor.onRequest(modifiedConfig);
      }
    }
    return modifiedConfig;
  }

  private async applyResponseInterceptors(response: Response): Promise<Response> {
    let modifiedResponse = response;
    for (const interceptor of this.interceptors) {
      if (interceptor.onResponse) {
        modifiedResponse = await interceptor.onResponse(modifiedResponse);
      }
    }
    return modifiedResponse;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseURL}${endpoint}`;
    
    try {
      // Get CSRF token for state-changing requests
      let csrfToken: string | null = null;
      const method = options.method?.toUpperCase() || 'GET';
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        csrfToken = await getCsrfToken();
      }

      // Build request configuration
      let config: RequestInit = {
        method,
        credentials: 'include', // Always include cookies
        headers: {
          'Content-Type': 'application/json',
          ...(csrfToken && { 'X-CSRF-Token': csrfToken }),
          'X-Original-Method': method, // For retry after refresh
          ...options.headers,
        },
        ...options,
      };

      // Apply request interceptors
      config = await this.applyRequestInterceptors(config);

      // Make the request
      let response = await fetch(url, config);
      
      // Apply response interceptors
      response = await this.applyResponseInterceptors(response);

      // Handle CSRF token mismatch
      if (response.status === 403) {
        const data = await response.json();
        if (data.error?.code === 'CSRF_TOKEN_INVALID') {
          // Clear and refetch CSRF token
          clearCsrfToken();
          csrfToken = await getCsrfToken();
          
          // Retry with new CSRF token
          config.headers = {
            ...config.headers,
            'X-CSRF-Token': csrfToken || '',
          };
          response = await fetch(url, config);
        }
      }

      // Parse response
      const contentType = response.headers.get('content-type');
      let data: any;
      
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      if (!response.ok) {
        return {
          error: {
            message: data.error?.message || data.message || 'API Error',
            statusCode: response.status,
            code: data.error?.code,
          },
        };
      }

      return { data };
    } catch (error) {
      // Network errors or other exceptions
      return {
        error: {
          message: error instanceof Error ? error.message : 'Network Error',
          statusCode: 0,
          code: 'NETWORK_ERROR',
        },
      };
    }
  }

  // Auth APIs
  async register(userData: {
    email: string;
    password: string;
    name: string;
    role: 'TEACHER' | 'STUDENT' | 'ADMIN';
    profileData?: any;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async login(credentials: { email: string; password: string }) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
    
    // Clear CSRF token to get a fresh one after login
    if (response.data) {
      clearCsrfToken();
      await getCsrfToken();
    }
    
    return response;
  }

  async logout() {
    const response = await this.request('/auth/logout', {
      method: 'POST',
    });
    
    // Clear CSRF token after logout
    clearCsrfToken();
    
    return response;
  }

  async refreshToken() {
    return this.request('/auth/refresh', {
      method: 'POST',
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me');
  }

  // User APIs
  async getProfile() {
    return this.request('/users/profile');
  }

  async updateProfile(data: any) {
    return this.request('/users/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // Textbook APIs
  async getTextbooks(filters?: {
    subject?: string;
    grade?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    return this.request(`/textbooks${params.toString() ? `?${params}` : ''}`);
  }

  async getTextbook(id: string) {
    return this.request(`/textbooks/${id}`);
  }

  async createTextbook(data: any) {
    return this.request('/textbooks', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateTextbook(id: string, data: any) {
    return this.request(`/textbooks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteTextbook(id: string) {
    return this.request(`/textbooks/${id}`, {
      method: 'DELETE',
    });
  }

  // Guest APIs
  async guestAccess(accessCode: string) {
    return this.request('/guest/access', {
      method: 'POST',
      body: JSON.stringify({ accessCode }),
    });
  }

  async validateGuestAccess() {
    return this.request('/guest/validate');
  }

  // Class APIs
  async getClasses() {
    return this.request('/classes');
  }

  async getClass(id: string) {
    return this.request(`/classes/${id}`);
  }

  async createClass(data: any) {
    return this.request('/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateClass(id: string, data: any) {
    return this.request(`/classes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteClass(id: string) {
    return this.request(`/classes/${id}`, {
      method: 'DELETE',
    });
  }

  async joinClass(classCode: string) {
    return this.request('/classes/join', {
      method: 'POST',
      body: JSON.stringify({ classCode }),
    });
  }

  // Assignment APIs
  async getAssignments(classId?: string) {
    return this.request(`/assignments${classId ? `?classId=${classId}` : ''}`);
  }

  async getAssignment(id: string) {
    return this.request(`/assignments/${id}`);
  }

  async createAssignment(data: any) {
    return this.request('/assignments', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateAssignment(id: string, data: any) {
    return this.request(`/assignments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async deleteAssignment(id: string) {
    return this.request(`/assignments/${id}`, {
      method: 'DELETE',
    });
  }

  async submitAssignment(assignmentId: string, data: any) {
    return this.request(`/assignments/${assignmentId}/submit`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Analytics APIs
  async getAnalytics(timeRange: string = '7d', filters?: any) {
    const params = new URLSearchParams({ timeRange });
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value) params.append(key, value as string);
      });
    }
    return this.request(`/analytics?${params}`);
  }

  async getStudentPerformance(studentId?: string) {
    return this.request(`/analytics/students${studentId ? `/${studentId}` : ''}`);
  }

  async getEngagementMetrics(timeRange: string = '7d') {
    return this.request(`/analytics/engagement?timeRange=${timeRange}`);
  }

  // File Upload with progress
  async uploadFile(
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<ApiResponse<{ url: string; id: string }>> {
    try {
      const csrfToken = await getCsrfToken();
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();
      
      return new Promise((resolve, reject) => {
        // Progress tracking
        if (onProgress) {
          xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
              const progress = (e.loaded / e.total) * 100;
              onProgress(progress);
            }
          });
        }

        // Handle completion
        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const data = JSON.parse(xhr.responseText);
              resolve({ data });
            } catch (error) {
              resolve({ 
                error: { 
                  message: 'Invalid response format', 
                  statusCode: xhr.status 
                } 
              });
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              resolve({
                error: {
                  message: error.message || 'Upload failed',
                  statusCode: xhr.status,
                },
              });
            } catch {
              resolve({
                error: {
                  message: 'Upload failed',
                  statusCode: xhr.status,
                },
              });
            }
          }
        });

        // Handle errors
        xhr.addEventListener('error', () => {
          reject(new Error('Network error during upload'));
        });

        xhr.addEventListener('abort', () => {
          reject(new Error('Upload aborted'));
        });

        // Open and send request
        xhr.open('POST', `${this.baseURL}/multimedia/upload`);
        xhr.withCredentials = true; // Include cookies
        if (csrfToken) {
          xhr.setRequestHeader('X-CSRF-Token', csrfToken);
        }
        xhr.send(formData);
      });
    } catch (error) {
      return {
        error: {
          message: error instanceof Error ? error.message : 'Upload failed',
          statusCode: 0,
        },
      };
    }
  }

  // Batch operations
  async batchRequest(requests: Array<{
    method: string;
    endpoint: string;
    body?: any;
  }>) {
    return this.request('/batch', {
      method: 'POST',
      body: JSON.stringify({ requests }),
    });
  }
}

// Export singleton instance
export const apiClient = new UnifiedApiClient();

// Export type for use in components
export type ApiClient = UnifiedApiClient;

// Export response type
export type { ApiResponse };

// Default export
export default apiClient;