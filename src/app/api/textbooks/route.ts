import { NextRequest, NextResponse } from 'next/server'

// Force dynamic route to prevent static generation
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET(request: NextRequest) {
  try {
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
    
    console.log('🔐 Textbooks GET auth debug:', {
      hasAuthHeader: !!authHeader,
      hasCookieToken: !!cookieToken,
      hasCookieHeader: !!cookieHeader,
      headers: Object.keys(headers)
    })

    // Forward the request to backend
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000'
    
    // Get query parameters from the request
    const url = new URL(request.url)
    const queryParams = url.searchParams.toString()
    const backendPath = queryParams ? `${backendUrl}/api/textbooks?${queryParams}` : `${backendUrl}/api/textbooks`

    const backendResponse = await fetch(backendPath, {
      method: 'GET',
      headers,
    })

    if (backendResponse.ok) {
      const data = await backendResponse.json()
      return NextResponse.json(data)
    } else {
      const errorData = await backendResponse.json().catch(() => ({ message: 'Failed to fetch textbooks' }))
      return NextResponse.json(
        { error: errorData.message || 'Failed to fetch textbooks' },
        { status: backendResponse.status }
      )
    }
  } catch (error) {
    console.error('Textbooks GET API error:', error)
    return NextResponse.json(
      { error: 'Server error fetching textbooks' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const requestBody = await request.json()
    
    // Get auth token from cookies or Authorization header
    const cookieToken = request.cookies.get('accessToken')?.value
    const authHeader = request.headers.get('authorization')
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    }
    
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
    
    console.log('🔐 Textbooks POST auth debug:', {
      hasAuthHeader: !!authHeader,
      hasCookieToken: !!cookieToken,
      hasCookieHeader: !!cookieHeader,
      requestBody: {
        title: requestBody.title,
        subject: requestBody.subject,
        contentType: requestBody.contentType,
        hasContent: !!requestBody.content,
        hasFileId: !!requestBody.fileId,
        hasAiSettings: !!requestBody.aiSettings
      },
      headers: Object.keys(headers)
    })

    // Forward the request to backend
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000'

    const backendResponse = await fetch(`${backendUrl}/api/textbooks`, {
      method: 'POST',
      headers,
      body: JSON.stringify(requestBody),
    })

    if (backendResponse.ok) {
      const data = await backendResponse.json()
      return NextResponse.json(data, { status: 201 })
    } else {
      const errorData = await backendResponse.json().catch(() => ({ message: 'Textbook creation failed' }))
      console.error('Backend textbook creation error:', {
        status: backendResponse.status,
        statusText: backendResponse.statusText,
        error: errorData
      })
      
      return NextResponse.json(
        { error: errorData.message || 'Textbook creation failed' },
        { status: backendResponse.status }
      )
    }
  } catch (error) {
    console.error('Textbook creation API error:', error)
    return NextResponse.json(
      { error: 'Server error during textbook creation' },
      { status: 500 }
    )
  }
}