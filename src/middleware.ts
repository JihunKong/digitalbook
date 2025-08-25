import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // 보호된 교사 페이지들
  if (pathname.startsWith('/teacher')) {
    const accessToken = request.cookies.get('accessToken')?.value
    
    if (!accessToken) {
      // 로그인하지 않은 사용자는 로그인 페이지로 리다이렉트
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  // 보호된 학생 페이지들
  if (pathname.startsWith('/student')) {
    const accessToken = request.cookies.get('accessToken')?.value
    
    if (!accessToken) {
      const url = request.nextUrl.clone()
      url.pathname = '/auth/login'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/teacher/:path*',
    '/student/:path*'
  ]
}