import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  console.log('=== TEST LOGIN API CALLED ===')
  
  return NextResponse.json({
    message: 'Test API route is working!',
    timestamp: new Date().toISOString()
  })
}