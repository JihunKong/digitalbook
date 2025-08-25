import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, password, role, termsAccepted } = body

    // Forward all cookies from the frontend request to backend
    const cookies = request.headers.get('cookie') || ''

    // 백엔드 API로 직접 요청 (쿠키 포함)
    // Use internal Docker network for server-side requests
    const backendUrl = process.env.BACKEND_INTERNAL_URL || 'http://localhost:4000/api'
    const requestPayload = { name, email, password, role, termsAccepted }
    
    const backendResponse = await fetch(`${backendUrl}/auth/signup`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Cookie': cookies,
        'User-Agent': request.headers.get('user-agent') || 'NextJS-API',
        'X-Forwarded-For': request.headers.get('x-forwarded-for') || 'internal',
      },
      credentials: 'include',
      body: JSON.stringify(requestPayload),
    })


    if (backendResponse.ok) {
      const data = await backendResponse.json()
      
      // Forward cookies from backend response to frontend
      const responseHeaders = new Headers()
      const setCookieHeader = backendResponse.headers.get('set-cookie')
      if (setCookieHeader) {
        responseHeaders.append('Set-Cookie', setCookieHeader)
      }
      
      return NextResponse.json(data, { headers: responseHeaders })
    } else {
      const errorText = await backendResponse.text()
      
      let errorData
      try {
        errorData = JSON.parse(errorText)
      } catch {
        errorData = { message: errorText }
      }
      
      // Extract specific validation error message
      let errorMessage = '회원가입에 실패했습니다.'
      if (errorData.error?.message) {
        try {
          // Try to parse validation errors array
          const validationErrors = JSON.parse(errorData.error.message)
          if (Array.isArray(validationErrors) && validationErrors.length > 0) {
            errorMessage = validationErrors[0].message
          } else {
            errorMessage = errorData.error.message
          }
        } catch {
          errorMessage = errorData.error.message
        }
      } else if (errorData.message) {
        errorMessage = errorData.message
      }
      
      return NextResponse.json(
        { message: errorMessage },
        { status: backendResponse.status }
      )
    }
  } catch (error) {
    console.error('Signup API error:', error)
    return NextResponse.json(
      { message: '서버 오류가 발생했습니다.' },
      { status: 500 }
    )
  }
}