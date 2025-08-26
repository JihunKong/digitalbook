import { NextRequest, NextResponse } from 'next/server'

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
    const accessToken = authHeader || (cookieToken ? `Bearer ${cookieToken}` : undefined)
    
    const headers: HeadersInit = {}
    if (accessToken) {
      headers['Authorization'] = accessToken
    }

    // Forward all cookies from the frontend request to backend
    const cookies = request.headers.get('cookie') || ''
    if (cookies) {
      headers['Cookie'] = cookies
    }

    // Forward the request to backend
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000'

    const backendResponse = await fetch(`${backendUrl}/api/files/${id}/content`, {
      method: 'GET',
      headers,
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