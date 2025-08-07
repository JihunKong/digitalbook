/**
 * CSRF 클라이언트 헬퍼
 * 이 파일은 프론트엔드에서 CSRF 토큰을 관리하는 방법을 보여줍니다.
 * 실제 프론트엔드 코드에서는 이를 참고하여 구현하세요.
 */

// TypeScript/JavaScript 프론트엔드 예제
class CSRFManager {
  private static instance: CSRFManager;
  private token: string | null = null;
  private tokenExpiry: number = 0;

  private constructor() {}

  static getInstance(): CSRFManager {
    if (!CSRFManager.instance) {
      CSRFManager.instance = new CSRFManager();
    }
    return CSRFManager.instance;
  }

  /**
   * CSRF 토큰 가져오기
   */
  async getToken(): Promise<string> {
    // 토큰이 없거나 만료되었으면 새로 가져오기
    if (!this.token || Date.now() > this.tokenExpiry) {
      await this.fetchNewToken();
    }
    return this.token!;
  }

  /**
   * 서버에서 새 CSRF 토큰 가져오기
   */
  private async fetchNewToken(): Promise<void> {
    try {
      const response = await fetch('/api/csrf/token', {
        method: 'GET',
        credentials: 'include', // 쿠키 포함
      });

      if (!response.ok) {
        throw new Error('Failed to fetch CSRF token');
      }

      const data = await response.json();
      this.token = data.csrfToken;
      // 토큰 만료 시간 설정 (23시간 후)
      this.tokenExpiry = Date.now() + 23 * 60 * 60 * 1000;

      // 응답 헤더에서도 토큰을 가져올 수 있음
      const headerToken = response.headers.get('X-CSRF-Token');
      if (headerToken) {
        this.token = headerToken;
      }
    } catch (error) {
      console.error('CSRF token fetch error:', error);
      throw error;
    }
  }

  /**
   * 토큰 무효화
   */
  invalidateToken(): void {
    this.token = null;
    this.tokenExpiry = 0;
  }
}

/**
 * Axios 인터셉터 예제
 */
export function setupAxiosCSRF(axios: any) {
  const csrfManager = CSRFManager.getInstance();

  // 요청 인터셉터
  axios.interceptors.request.use(
    async (config: any) => {
      // 상태 변경 요청에만 CSRF 토큰 추가
      if (['post', 'put', 'delete', 'patch'].includes(config.method?.toLowerCase())) {
        const token = await csrfManager.getToken();
        config.headers['X-CSRF-Token'] = token;
      }
      
      // AJAX 요청임을 표시
      config.headers['X-Requested-With'] = 'XMLHttpRequest';
      
      return config;
    },
    (error: any) => {
      return Promise.reject(error);
    }
  );

  // 응답 인터셉터 (403 에러 시 토큰 재발급)
  axios.interceptors.response.use(
    (response: any) => response,
    async (error: any) => {
      const originalRequest = error.config;

      // CSRF 토큰 에러이고 재시도하지 않은 경우
      if (error.response?.status === 403 && 
          error.response?.data?.error?.includes('CSRF') && 
          !originalRequest._retry) {
        originalRequest._retry = true;
        
        // 토큰 무효화 및 재발급
        csrfManager.invalidateToken();
        const newToken = await csrfManager.getToken();
        originalRequest.headers['X-CSRF-Token'] = newToken;
        
        // 요청 재시도
        return axios(originalRequest);
      }

      return Promise.reject(error);
    }
  );
}

/**
 * Fetch API 래퍼 예제
 */
export class SecureFetch {
  private static csrfManager = CSRFManager.getInstance();

  static async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const method = options.method?.toUpperCase() || 'GET';
    
    // 상태 변경 요청에 CSRF 토큰 추가
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method)) {
      const token = await this.csrfManager.getToken();
      
      options.headers = {
        ...options.headers,
        'X-CSRF-Token': token,
        'X-Requested-With': 'XMLHttpRequest',
      };
    }

    // 쿠키 포함
    options.credentials = options.credentials || 'include';

    const response = await fetch(url, options);

    // CSRF 에러 처리
    if (response.status === 403) {
      const data = await response.json();
      if (data.error?.includes('CSRF')) {
        // 토큰 재발급 후 재시도
        this.csrfManager.invalidateToken();
        const newToken = await this.csrfManager.getToken();
        
        options.headers = {
          ...options.headers,
          'X-CSRF-Token': newToken,
        };
        
        return fetch(url, options);
      }
    }

    return response;
  }
}

/**
 * React Hook 예제
 */
export function useCSRF() {
  const [token, setToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<Error | null>(null);

  React.useEffect(() => {
    const csrfManager = CSRFManager.getInstance();
    
    csrfManager.getToken()
      .then(token => {
        setToken(token);
        setLoading(false);
      })
      .catch(err => {
        setError(err);
        setLoading(false);
      });
  }, []);

  const refreshToken = React.useCallback(async () => {
    setLoading(true);
    const csrfManager = CSRFManager.getInstance();
    csrfManager.invalidateToken();
    
    try {
      const newToken = await csrfManager.getToken();
      setToken(newToken);
      setError(null);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  }, []);

  return { token, loading, error, refreshToken };
}

/**
 * 폼 제출 헬퍼
 */
export async function submitFormWithCSRF(
  formData: FormData | any,
  url: string,
  method: string = 'POST'
): Promise<Response> {
  const csrfManager = CSRFManager.getInstance();
  const token = await csrfManager.getToken();

  // FormData인 경우
  if (formData instanceof FormData) {
    formData.append('_csrf', token);
  } else {
    // JSON 데이터인 경우
    formData._csrf = token;
  }

  return SecureFetch.fetch(url, {
    method,
    body: formData instanceof FormData ? formData : JSON.stringify(formData),
    headers: formData instanceof FormData ? {} : {
      'Content-Type': 'application/json',
    },
  });
}

/**
 * Double Submit Cookie 패턴 헬퍼
 */
export function getCSRFTokenFromCookie(): string | null {
  const name = 'csrf-token=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const cookies = decodedCookie.split(';');
  
  for (let cookie of cookies) {
    cookie = cookie.trim();
    if (cookie.indexOf(name) === 0) {
      return cookie.substring(name.length);
    }
  }
  
  return null;
}

/**
 * jQuery AJAX 설정 예제
 */
export function setupJQueryCSRF($: any) {
  // 모든 AJAX 요청에 대한 기본 설정
  $.ajaxSetup({
    beforeSend: async function(xhr: any, settings: any) {
      // 상태 변경 메서드에만 CSRF 토큰 추가
      if (settings.type !== 'GET' && settings.type !== 'HEAD') {
        const csrfManager = CSRFManager.getInstance();
        const token = await csrfManager.getToken();
        xhr.setRequestHeader('X-CSRF-Token', token);
      }
      xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');
    }
  });
}

// React 임포트 (실제 사용시)
declare const React: any;

export default CSRFManager;