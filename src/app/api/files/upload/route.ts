import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Get auth token from cookies
    const accessToken = request.cookies.get('accessToken')?.value
    
    const headers: HeadersInit = {}
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`
    }

    // Forward all cookies from the frontend request to backend
    const cookies = request.headers.get('cookie') || ''
    if (cookies) {
      headers['Cookie'] = cookies
    }

    // Forward the file to backend
    const backendFormData = new FormData()
    backendFormData.append('file', file)
    
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000'

    const backendResponse = await fetch(`${backendUrl}/api/files/upload`, {
      method: 'POST',
      headers,
      body: backendFormData,
    })

    if (backendResponse.ok) {
      const data = await backendResponse.json()
      return NextResponse.json(data)
    } else {
      const errorData = await backendResponse.json()
      return NextResponse.json(
        { error: errorData.message || 'Upload failed' },
        { status: backendResponse.status }
      )
    }
  } catch (error) {
    console.error('File upload API error:', error)
    return NextResponse.json(
      { error: 'Server error during upload' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'File upload endpoint' })
}