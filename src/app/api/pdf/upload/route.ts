import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const pdf = formData.get('file') as File
    const classId = formData.get('classId') as string
    
    if (!pdf) {
      return NextResponse.json(
        { error: 'PDF file is required' },
        { status: 400 }
      )
    }

    if (!classId) {
      return NextResponse.json(
        { error: 'Class ID is required' },
        { status: 400 }
      )
    }

    // Validate PDF file type
    if (pdf.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      )
    }

    // Forward the PDF to backend
    const backendFormData = new FormData()
    backendFormData.append('file', pdf)
    backendFormData.append('classId', classId)
    
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

    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000'
    const backendResponse = await fetch(`${backendUrl}/api/pdf/upload`, {
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
        { error: errorData.message || 'PDF upload failed' },
        { status: backendResponse.status }
      )
    }
  } catch (error) {
    console.error('PDF upload API error:', error)
    return NextResponse.json(
      { error: 'Server error during PDF upload' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({ message: 'PDF upload endpoint' })
}