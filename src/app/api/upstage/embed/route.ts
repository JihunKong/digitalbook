import { NextRequest, NextResponse } from 'next/server'
import { getUpstageHeaders } from '@/lib/upstage'

export async function POST(request: NextRequest) {
  try {
    const { input } = await request.json()

    if (!input) {
      return NextResponse.json(
        { error: 'No input text provided' },
        { status: 400 }
      )
    }

    if (!process.env.UPSTAGE_API_KEY) {
      return NextResponse.json(
        { error: 'Upstage API key not configured' },
        { status: 500 }
      )
    }

    const response = await fetch('https://api.upstage.ai/v1/embeddings', {
      method: 'POST',
      headers: getUpstageHeaders(),
      body: JSON.stringify({
        input,
        model: 'embedding-query'
      })
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Upstage Embedding API error:', error)
      return NextResponse.json(
        { error: 'Failed to generate embeddings' },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)

  } catch (error) {
    console.error('Embedding API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}