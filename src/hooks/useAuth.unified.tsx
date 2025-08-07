import React, { useState, useEffect, useContext, createContext, ReactNode, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from '@/components/ui/use-toast';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'TEACHER' | 'STUDENT' | 'ADMIN' | 'GUEST';
  profileImage?: string;
  // Role-specific profiles
  teacherProfile?: {
    school: string;
    subject: string;
    grade: string;
  };
  studentProfile?: {
    school: string;
    grade: string;
    class: string;
  };
  adminProfile?: {
    department: string;
    permissions: string[];
  };
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
  updateUser: (userData: Partial<User>) => void;
  checkAuth: () => Promise<void>;
  csrfToken: string | null;
}

interface RegisterData {
  email: string;
  password: string;
  name: string;
  role: 'TEACHER' | 'STUDENT' | 'ADMIN';
  profileData?: any;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [csrfToken, setCsrfToken] = useState<string | null>(null);
  const router = useRouter();

  // Fetch CSRF token
  const fetchCsrfToken = useCallback(async () => {
    try {
      const response = await fetch('/api/auth/csrf', {
        method: 'GET',
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setCsrfToken(data.csrfToken);
        return data.csrfToken;
      }
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
    }
    return null;
  }, []);

  // Check authentication status on mount
  const checkAuth = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Fetch CSRF token first
      const token = await fetchCsrfToken();
      
      // Check current session
      const response = await fetch('/api/auth/me', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': token || '',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setIsAuthenticated(true);
      } else {
        setUser(null);
        setIsAuthenticated(false);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  }, [fetchCsrfToken]);

  // Initialize auth on mount
  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  // Refresh token before expiry
  const refreshToken = useCallback(async () => {
    try {
      const token = csrfToken || await fetchCsrfToken();
      
      const response = await fetch('/api/auth/refresh', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token || '',
        },
      });

      if (!response.ok) {
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      if (data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
      }
    } catch (error) {
      console.error('Token refresh failed:', error);
      // If refresh fails, redirect to login
      setUser(null);
      setIsAuthenticated(false);
      router.push('/auth/login');
    }
  }, [csrfToken, fetchCsrfToken, router]);

  // Set up automatic token refresh
  useEffect(() => {
    if (!isAuthenticated) return;

    // Refresh token every 14 minutes (access token expires in 15 minutes)
    const interval = setInterval(() => {
      refreshToken();
    }, 14 * 60 * 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated, refreshToken]);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      
      // Get CSRF token
      const token = csrfToken || await fetchCsrfToken();
      
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token || '',
        },
        body: JSON.stringify({ email, password }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      // Set user data
      if (data.user) {
        setUser(data.user);
        setIsAuthenticated(true);
        
        // Redirect based on role
        switch (data.user.role) {
          case 'ADMIN':
            router.push('/admin/dashboard');
            break;
          case 'TEACHER':
            router.push('/teacher/dashboard');
            break;
          case 'STUDENT':
            router.push('/student/dashboard');
            break;
          default:
            router.push('/dashboard');
        }

        toast({
          title: 'Login successful',
          description: 'Welcome back!',
        });
      }
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    try {
      setIsLoading(true);
      
      // Get CSRF token
      const token = csrfToken || await fetchCsrfToken();
      
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-Token': token || '',
        },
        body: JSON.stringify(data),
      });
      
      const responseData = await response.json();
      
      if (!response.ok) {
        throw new Error(responseData.message || 'Registration failed');
      }
      
      // Automatically log in after successful registration
      if (responseData.user) {
        setUser(responseData.user);
        setIsAuthenticated(true);
        
        // Redirect based on role
        switch (responseData.user.role) {
          case 'ADMIN':
            router.push('/admin/dashboard');
            break;
          case 'TEACHER':
            router.push('/teacher/dashboard');
            break;
          case 'STUDENT':
            router.push('/student/dashboard');
            break;
          default:
            router.push('/dashboard');
        }

        toast({
          title: 'Registration successful',
          description: 'Welcome to Digital Textbook Platform!',
        });
      }
    } catch (error) {
      toast({
        title: 'Registration failed',
        description: error instanceof Error ? error.message : 'An error occurred',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      const token = csrfToken || await fetchCsrfToken();
      
      await fetch('/api/auth/logout', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'X-CSRF-Token': token || '',
        },
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear user state regardless of API response
      setUser(null);
      setIsAuthenticated(false);
      setCsrfToken(null);
      router.push('/');
      
      toast({
        title: 'Logged out',
        description: 'You have been logged out successfully',
      });
    }
  };

  const updateUser = (userData: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...userData });
    }
  };

  // Handle visibility change to refresh token when returning to tab
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && isAuthenticated) {
        // Refresh auth status when tab becomes visible
        checkAuth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isAuthenticated, checkAuth]);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => {
      if (isAuthenticated) {
        checkAuth();
      }
    };

    window.addEventListener('online', handleOnline);
    return () => {
      window.removeEventListener('online', handleOnline);
    };
  }, [isAuthenticated, checkAuth]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated,
        login,
        register,
        logout,
        refreshToken,
        updateUser,
        checkAuth,
        csrfToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// HOC for protected routes
export function withAuth<P extends object>(
  Component: React.ComponentType<P>,
  allowedRoles?: Array<'ADMIN' | 'TEACHER' | 'STUDENT' | 'GUEST'>
) {
  return function AuthenticatedComponent(props: P) {
    const { user, isLoading, isAuthenticated } = useAuth();
    const router = useRouter();

    useEffect(() => {
      if (!isLoading && !isAuthenticated) {
        router.push('/auth/login');
      } else if (!isLoading && isAuthenticated && allowedRoles && user) {
        if (!allowedRoles.includes(user.role)) {
          // Redirect to appropriate dashboard
          switch (user.role) {
            case 'ADMIN':
              router.push('/admin/dashboard');
              break;
            case 'TEACHER':
              router.push('/teacher/dashboard');
              break;
            case 'STUDENT':
              router.push('/student/dashboard');
              break;
            default:
              router.push('/');
          }
        }
      }
    }, [isLoading, isAuthenticated, user, router]);

    if (isLoading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      );
    }

    if (!isAuthenticated) {
      return null;
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
      return null;
    }

    return <Component {...props} />;
  };
}