import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs/promises'
import path from 'path'

// 미리 저장된 교과서 목록
const PRESET_TEXTBOOKS = {
  'korean-5': {
    metadataFile: 'korean-5-metadata.json',
    embeddingsFile: 'korean-5-embeddings.json',
    pdfFile: null // PDF는 저작권 문제로 포함하지 않음
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const textbookId = searchParams.get('id')
  const dataType = searchParams.get('type') || 'metadata' // metadata, embeddings, all

  try {
    if (!textbookId) {
      // 사용 가능한 교과서 목록 반환
      return NextResponse.json({
        textbooks: Object.keys(PRESET_TEXTBOOKS).map(id => ({
          id,
          available: true
        }))
      })
    }

    const textbookConfig = PRESET_TEXTBOOKS[textbookId as keyof typeof PRESET_TEXTBOOKS]
    if (!textbookConfig) {
      return NextResponse.json(
        { error: 'Textbook not found' },
        { status: 404 }
      )
    }

    const publicDir = path.join(process.cwd(), 'public', 'textbooks')
    const result: any = { id: textbookId }

    // 메타데이터 로드
    if (dataType === 'metadata' || dataType === 'all') {
      const metadataPath = path.join(publicDir, textbookConfig.metadataFile)
      try {
        const metadataContent = await fs.readFile(metadataPath, 'utf-8')
        result.metadata = JSON.parse(metadataContent)
      } catch (error) {
        console.error('Failed to load metadata:', error)
      }
    }

    // 임베딩 데이터 로드
    if (dataType === 'embeddings' || dataType === 'all') {
      const embeddingsPath = path.join(publicDir, textbookConfig.embeddingsFile)
      try {
        const embeddingsContent = await fs.readFile(embeddingsPath, 'utf-8')
        result.embeddings = JSON.parse(embeddingsContent)
      } catch (error) {
        console.error('Failed to load embeddings:', error)
      }
    }

    return NextResponse.json(result)

  } catch (error) {
    console.error('Preset textbook API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 교사가 새로운 교과서를 업로드하는 엔드포인트
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const metadata = formData.get('metadata') as string

    if (!file || !metadata) {
      return NextResponse.json(
        { error: 'File and metadata are required' },
        { status: 400 }
      )
    }

    // TODO: 실제 구현 시
    // 1. PDF를 Upstage API로 파싱
    // 2. 페이지별로 텍스트 추출 및 임베딩 생성
    // 3. 메타데이터와 임베딩을 저장
    // 4. 교과서 ID 생성 및 반환

    return NextResponse.json({
      message: 'Textbook upload functionality not yet implemented',
      todo: 'Integrate with Upstage API for PDF parsing and embedding generation'
    })

  } catch (error) {
    console.error('Textbook upload error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}