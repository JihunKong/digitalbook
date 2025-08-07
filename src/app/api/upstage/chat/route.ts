import { NextRequest, NextResponse } from 'next/server'
import { getUpstageHeaders } from '@/lib/upstage'

export async function POST(request: NextRequest) {
  try {
    const { messages, stream = true } = await request.json()

    // Validate messages
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    // Check API key
    const apiKey = process.env.UPSTAGE_API_KEY
    if (!apiKey) {
      console.error('UPSTAGE_API_KEY is not configured in environment variables')
      return NextResponse.json(
        { error: 'Upstage API key not configured. Please check server configuration.' },
        { status: 500 }
      )
    }

    // Log request for debugging (without sensitive data)
    console.log('Upstage chat request:', {
      messageCount: messages.length,
      stream,
      timestamp: new Date().toISOString()
    })

    const response = await fetch('https://api.upstage.ai/v1/chat/completions', {
      method: 'POST',
      headers: getUpstageHeaders(),
      body: JSON.stringify({
        model: 'solar-pro2',
        messages,
        stream,
        temperature: 0.7,
        max_tokens: 1000
      })
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Upstage API error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      })
      
      // Parse error message if possible
      let errorMessage = 'Failed to get response from Upstage AI'
      try {
        const errorData = JSON.parse(errorText)
        if (errorData.error?.message) {
          errorMessage = errorData.error.message
        }
      } catch (e) {
        // Use default error message
      }
      
      return NextResponse.json(
        { error: errorMessage, details: response.statusText },
        { status: response.status }
      )
    }

    // If streaming is enabled, return the stream
    if (stream) {
      const stream = new ReadableStream({
        async start(controller) {
          const reader = response.body?.getReader()
          if (!reader) return

          try {
            while (true) {
              const { done, value } = await reader.read()
              if (done) break
              controller.enqueue(value)
            }
          } finally {
            controller.close()
          }
        }
      })

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        }
      })
    }

    // If not streaming, return the JSON response
    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Chat API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}