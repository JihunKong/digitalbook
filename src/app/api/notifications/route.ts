import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    // For now, return empty notifications to prevent 404 errors
    // This is a temporary fix until the backend notifications system is properly implemented
    
    const searchParams = request.nextUrl.searchParams
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')
    
    return NextResponse.json({
      notifications: [],
      total: 0,
      limit,
      offset,
      hasMore: false
    })
  } catch (error) {
    console.error('Notifications API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch notifications' },
      { status: 500 }
    )
  }
}