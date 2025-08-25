import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }

    // Forward all cookies from the frontend request to backend
    const cookies = request.headers.get('cookie') || ''
    if (cookies) {
      headers['Cookie'] = cookies
    }

    // Forward to backend API
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000'
    
    const backendResponse = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    })

    const responseData = await backendResponse.text()
    
    if (backendResponse.ok) {
      const data = JSON.parse(responseData)
      
      // Forward Set-Cookie headers from backend to frontend
      const setCookieHeaders = backendResponse.headers.getSetCookie()
      const response = NextResponse.json(data)
      
      setCookieHeaders.forEach(cookie => {
        response.headers.append('Set-Cookie', cookie)
      })
      
      return response
    } else {
      const errorData = JSON.parse(responseData)
      return NextResponse.json(
        { message: errorData.message || '로그인에 실패했습니다.' },
        { status: backendResponse.status }
      )
    }
  } catch (error) {
    console.error('Login API error:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}