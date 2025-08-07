import { useState, useEffect, useCallback } from 'react';

interface CsrfHook {
  csrfToken: string | null;
  isLoading: boolean;
  error: Error | null;
  fetchToken: () => Promise<string | null>;
  clearToken: () => void;
}

// In-memory storage for CSRF token (not stored in localStorage for security)
let globalCsrfToken: string | null = null;
let tokenFetchPromise: Promise<string | null> | null = null;

export function useCsrf(): CsrfHook {
  const [csrfToken, setCsrfToken] = useState<string | null>(globalCsrfToken);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchToken = useCallback(async (): Promise<string | null> => {
    // If we already have a token fetch in progress, wait for it
    if (tokenFetchPromise) {
      try {
        const token = await tokenFetchPromise;
        setCsrfToken(token);
        return token;
      } catch (err) {
        setError(err as Error);
        return null;
      }
    }

    // If we already have a token, return it
    if (globalCsrfToken) {
      setCsrfToken(globalCsrfToken);
      return globalCsrfToken;
    }

    // Create new token fetch promise
    tokenFetchPromise = (async () => {
      try {
        setIsLoading(true);
        setError(null);

        const response = await fetch('/api/auth/csrf', {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch CSRF token');
        }

        const data = await response.json();
        const token = data.csrfToken;

        if (!token) {
          throw new Error('No CSRF token received');
        }

        // Store globally and locally
        globalCsrfToken = token;
        setCsrfToken(token);

        return token;
      } catch (err) {
        const error = err as Error;
        console.error('CSRF token fetch error:', error);
        setError(error);
        globalCsrfToken = null;
        setCsrfToken(null);
        return null;
      } finally {
        setIsLoading(false);
        tokenFetchPromise = null;
      }
    })();

    return tokenFetchPromise;
  }, []);

  const clearToken = useCallback(() => {
    globalCsrfToken = null;
    setCsrfToken(null);
    setError(null);
  }, []);

  // Fetch token on mount if not available
  useEffect(() => {
    if (!globalCsrfToken && !tokenFetchPromise) {
      fetchToken();
    }
  }, [fetchToken]);

  // Refresh token periodically (every 30 minutes)
  useEffect(() => {
    const interval = setInterval(() => {
      fetchToken();
    }, 30 * 60 * 1000);

    return () => clearInterval(interval);
  }, [fetchToken]);

  // Refresh token on window focus
  useEffect(() => {
    const handleFocus = () => {
      // Only refresh if we don't have a token or if document was hidden for more than 5 minutes
      if (!globalCsrfToken || document.hidden === false) {
        const lastFetch = localStorage.getItem('csrf_last_fetch');
        const now = Date.now();
        
        if (!lastFetch || now - parseInt(lastFetch) > 5 * 60 * 1000) {
          fetchToken();
          localStorage.setItem('csrf_last_fetch', now.toString());
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleFocus);
    };
  }, [fetchToken]);

  return {
    csrfToken,
    isLoading,
    error,
    fetchToken,
    clearToken,
  };
}

// Utility function to get CSRF token for API calls
export async function getCsrfToken(): Promise<string | null> {
  // If we already have a token, return it
  if (globalCsrfToken) {
    return globalCsrfToken;
  }

  // If a fetch is in progress, wait for it
  if (tokenFetchPromise) {
    return tokenFetchPromise;
  }

  // Otherwise, fetch a new token
  tokenFetchPromise = (async () => {
    try {
      const response = await fetch('/api/auth/csrf', {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.error('Failed to fetch CSRF token:', response.status);
        return null;
      }

      const data = await response.json();
      const token = data.csrfToken;

      if (token) {
        globalCsrfToken = token;
        return token;
      }

      return null;
    } catch (error) {
      console.error('CSRF token fetch error:', error);
      return null;
    } finally {
      tokenFetchPromise = null;
    }
  })();

  return tokenFetchPromise;
}

// Clear CSRF token (useful for logout)
export function clearCsrfToken(): void {
  globalCsrfToken = null;
  tokenFetchPromise = null;
  localStorage.removeItem('csrf_last_fetch');
}