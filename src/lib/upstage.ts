// Upstage AI API Configuration and Helper Functions

export const upstageConfig = {
  apiKey: process.env.UPSTAGE_API_KEY || '',
  baseUrl: 'https://api.upstage.ai/v1',
  documentParseUrl: 'https://api.upstage.ai/v1/document-digitization',
  models: {
    chat: 'solar-pro2',
    embedding: 'embedding-query'
  }
}

// Document parsing types
export interface DocumentParseResponse {
  pages: Array<{
    page_number: number
    content: string
    tables?: Array<{
      cells: Array<Array<string>>
    }>
    images?: Array<{
      base64: string
      type: string
    }>
  }>
  metadata?: {
    total_pages: number
    title?: string
  }
}

// Chat message types
export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// Helper function to create chat headers
export function getUpstageHeaders() {
  return {
    'Authorization': `Bearer ${upstageConfig.apiKey}`,
    'Content-Type': 'application/json'
  }
}

// Helper function to create document parse headers
export function getUpstageDocumentHeaders() {
  return {
    'Authorization': `Bearer ${upstageConfig.apiKey}`
  }
}