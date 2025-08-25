import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies if available
    const accessToken = request.cookies.get('accessToken')?.value
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    // Forward all cookies from the frontend request to backend
    const cookies = request.headers.get('cookie') || ''
    if (cookies) {
      headers['Cookie'] = cookies
    }

    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000'
    const backendResponse = await fetch(`${backendUrl}/api/csrf`, {
      method: 'GET',
      headers,
    })

    if (backendResponse.ok) {
      const data = await backendResponse.json()
      
      // Forward Set-Cookie headers from backend to frontend
      const setCookieHeaders = backendResponse.headers.getSetCookie()
      const response = NextResponse.json(data)
      
      setCookieHeaders.forEach(cookie => {
        response.headers.append('Set-Cookie', cookie)
      })
      
      return response
    } else {
      return NextResponse.json(
        { error: 'Failed to get CSRF token' },
        { status: backendResponse.status }
      )
    }
  } catch (error) {
    console.error('CSRF API error:', error)
    return NextResponse.json(
      { error: 'Server error' },
      { status: 500 }
    )
  }
}