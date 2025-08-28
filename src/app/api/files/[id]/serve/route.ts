import { NextRequest, NextResponse } from 'next/server'

// Force dynamic route to prevent static generation
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    
    if (!id) {
      return NextResponse.json(
        { error: 'File ID is required' },
        { status: 400 }
      )
    }

    // Get auth token from cookies or Authorization header
    const cookieToken = request.cookies.get('accessToken')?.value
    const authHeader = request.headers.get('authorization')
    
    const headers: HeadersInit = {}
    
    // Try Authorization header first, then cookie
    if (authHeader) {
      headers['Authorization'] = authHeader
    } else if (cookieToken) {
      headers['Authorization'] = `Bearer ${cookieToken}`
    }

    // Always forward all cookies to backend (this is important for httpOnly cookies)
    const cookieHeader = request.headers.get('cookie')
    if (cookieHeader) {
      headers['Cookie'] = cookieHeader
    }
    
    console.log('🔐 File serve auth debug:', {
      hasAuthHeader: !!authHeader,
      hasCookieToken: !!cookieToken,
      hasCookieHeader: !!cookieHeader,
      headers: Object.keys(headers)
    })

    // Forward the request to backend
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000'

    console.log('🚀 Forwarding file request to backend:', {
      fileId: id,
      backendUrl,
      fullUrl: `${backendUrl}/api/files/${id}/content`,
      hasAuthHeader: !!authHeader,
      hasCookieToken: !!cookieToken
    })

    const backendResponse = await fetch(`${backendUrl}/api/files/${id}/content`, {
      method: 'GET',
      headers,
    })

    console.log('📡 Backend response status:', {
      fileId: id,
      status: backendResponse.status,
      statusText: backendResponse.statusText,
      ok: backendResponse.ok
    })

    if (backendResponse.ok) {
      // Get the file stream from backend
      const fileStream = backendResponse.body
      
      if (!fileStream) {
        return NextResponse.json(
          { error: 'No file content received' },
          { status: 500 }
        )
      }

      // Copy response headers from backend
      const responseHeaders = new Headers()
      backendResponse.headers.forEach((value, key) => {
        if (['content-type', 'content-length', 'content-disposition'].includes(key.toLowerCase())) {
          responseHeaders.set(key, value)
        }
      })

      // Add security headers for PDF viewing
      responseHeaders.set('X-Content-Type-Options', 'nosniff')
      responseHeaders.set('X-Frame-Options', 'SAMEORIGIN')
      responseHeaders.set('Content-Security-Policy', "default-src 'self'; object-src 'self'; frame-ancestors 'self'")
      
      // For PDF files, allow embedding in same origin
      if (responseHeaders.get('content-type')?.includes('application/pdf')) {
        responseHeaders.set('X-Frame-Options', 'SAMEORIGIN')
      }

      // Return the file stream with appropriate headers
      return new NextResponse(fileStream, {
        status: 200,
        headers: responseHeaders
      })
    } else {
      const errorData = await backendResponse.json().catch(() => ({ message: 'File not found' }))
      return NextResponse.json(
        { error: errorData.message || 'File not found' },
        { status: backendResponse.status }
      )
    }
  } catch (error) {
    console.error('File serve API error:', error)
    return NextResponse.json(
      { error: 'Server error serving file' },
      { status: 500 }
    )
  }
}