import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // Get auth token from cookies
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
    const backendResponse = await fetch(`${backendUrl}/api/dashboard/teacher`, {
      method: 'GET',
      headers,
    })

    if (backendResponse.ok) {
      const data = await backendResponse.json()
      return NextResponse.json(data)
    } else {
      // Return empty dashboard data instead of error
      return NextResponse.json({
        totalTextbooks: 0,
        totalStudents: 0,
        totalClasses: 0,
        weeklyProgress: 0,
        recentActivities: [],
        upcomingAssignments: []
      })
    }
  } catch (error) {
    console.error('Teacher dashboard API error:', error)
    // Return empty dashboard data on error
    return NextResponse.json({
      totalTextbooks: 0,
      totalStudents: 0,
      totalClasses: 0,
      weeklyProgress: 0,
      recentActivities: [],
      upcomingAssignments: []
    })
  }
}