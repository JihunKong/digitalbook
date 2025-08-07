import { NextRequest, NextResponse } from 'next/server'
import { getUpstageDocumentHeaders } from '@/lib/upstage'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('document') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!process.env.UPSTAGE_API_KEY) {
      return NextResponse.json(
        { error: 'Upstage API key not configured' },
        { status: 500 }
      )
    }

    // Create FormData for Upstage API
    const upstageFormData = new FormData()
    upstageFormData.append('document', file)
    upstageFormData.append('ocr', 'force')
    upstageFormData.append('model', 'document-parse')
    upstageFormData.append('base64_encoding', JSON.stringify(['table']))

    const response = await fetch('https://api.upstage.ai/v1/document-digitization', {
      method: 'POST',
      headers: getUpstageDocumentHeaders(),
      body: upstageFormData
    })

    if (!response.ok) {
      const error = await response.text()
      console.error('Upstage Document API error:', error)
      return NextResponse.json(
        { error: 'Failed to parse document' },
        { status: response.status }
      )
    }

    const data = await response.json()
    
    // Process the parsed data
    const processedData = {
      pages: data.pages || [],
      totalPages: data.metadata?.total_pages || 0,
      content: data.pages?.map((page: any) => page.content).join('\n\n') || '',
      tables: data.pages?.flatMap((page: any) => page.tables || []) || [],
      timestamp: new Date().toISOString()
    }

    return NextResponse.json(processedData)

  } catch (error) {
    console.error('Document parse API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}