import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Log error locally but don't forward to prevent infinite loops
    console.log('Frontend error report received:', {
      timestamp: new Date().toISOString(),
      error: body
    });
    
    // Return success without forwarding to backend
    return NextResponse.json({ 
      success: true, 
      message: 'Error logged locally' 
    });
  } catch (error) {
    console.error('Error processing error report:', error);
    return NextResponse.json(
      { error: 'Failed to process error report' },
      { status: 500 }
    );
  }
}