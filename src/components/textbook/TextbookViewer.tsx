'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { Loader2 } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

interface TextbookViewerProps {
  content: string
  imageUrl?: string
  fontSize: number
}

export function TextbookViewer({ content, imageUrl, fontSize }: TextbookViewerProps) {
  const [isImageLoading, setIsImageLoading] = useState(true)
  const [highlightedText, setHighlightedText] = useState<string[]>([])

  // 텍스트 하이라이트 기능
  const handleTextSelection = () => {
    const selection = window.getSelection()
    if (selection && selection.toString().trim()) {
      const selectedText = selection.toString()
      setHighlightedText([...highlightedText, selectedText])
      
      // 선택 영역에 하이라이트 스타일 적용
      const range = selection.getRangeAt(0)
      const span = document.createElement('span')
      span.className = 'bg-yellow-200 bg-opacity-50'
      span.appendChild(range.extractContents())
      range.insertNode(span)
      
      selection.removeAllRanges()
    }
  }

  // 컨텐츠를 섹션별로 분리
  const sections = content.split('\n\n').map((section, index) => {
    // 제목인지 확인
    const isTitle = section.match(/^#+\s/)
    const isBulletPoint = section.trim().startsWith('-')
    
    return {
      id: `section-${index}`,
      content: section,
      type: isTitle ? 'title' : isBulletPoint ? 'list' : 'paragraph'
    }
  })

  return (
    <div className="prose prose-lg max-w-none" style={{ fontSize: `${fontSize}px` }}>
      {imageUrl && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 rounded-lg overflow-hidden shadow-lg"
        >
          <div className="relative aspect-video bg-gray-100">
            {isImageLoading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
              </div>
            )}
            <Image
              src={imageUrl}
              alt="교재 이미지"
              fill
              className="object-cover"
              onLoad={() => setIsImageLoading(false)}
              priority
            />
          </div>
        </motion.div>
      )}

      <div 
        className="space-y-4 select-text"
        onMouseUp={handleTextSelection}
      >
        {sections.map((section, index) => (
          <motion.div
            key={section.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: index * 0.1 }}
          >
            {section.type === 'title' ? (
              <ReactMarkdown
                className="font-bold text-gray-900 mb-4"
                components={{
                  h1: ({ children }) => <h1 className="text-3xl mb-6">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-2xl mb-4">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-xl mb-3">{children}</h3>,
                }}
              >
                {section.content}
              </ReactMarkdown>
            ) : section.type === 'list' ? (
              <div className="ml-4">
                <ReactMarkdown
                  components={{
                    ul: ({ children }) => <ul className="list-disc list-inside space-y-2">{children}</ul>,
                    li: ({ children }) => <li className="text-gray-700">{children}</li>,
                  }}
                >
                  {section.content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-gray-700 leading-relaxed text-justify">
                {section.content}
              </p>
            )}
          </motion.div>
        ))}
      </div>

      {/* 하이라이트된 텍스트 표시 */}
      {highlightedText.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 p-4 bg-yellow-50 rounded-lg border border-yellow-200"
        >
          <h4 className="font-semibold text-sm mb-2">하이라이트한 내용</h4>
          <ul className="space-y-1">
            {highlightedText.map((text, index) => (
              <li key={index} className="text-sm text-gray-700">
                • {text}
              </li>
            ))}
          </ul>
        </motion.div>
      )}

      <style jsx global>{`
        .prose h1, .prose h2, .prose h3 {
          font-family: 'Pretendard', sans-serif;
        }
        
        .prose p {
          word-break: keep-all;
          line-height: 1.8;
        }
        
        ::selection {
          background-color: rgba(251, 191, 36, 0.3);
        }
      `}</style>
    </div>
  )
}