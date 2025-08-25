import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    // Temporarily disable log forwarding to prevent infinite loop
    // TODO: Fix backend monitoring service connection
    return NextResponse.json({ success: true, message: 'Logs received' });
  } catch (error) {
    console.error('Error processing logs:', error);
    return NextResponse.json(
      { error: 'Failed to process logs' },
      { status: 500 }
    );
  }
}