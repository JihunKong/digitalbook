'use client'

import { ClientOnly } from '@/components/ClientOnly'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import the actual component
const StudyActivityContent = dynamic(
  () => import('./StudyActivityContent').then(mod => mod.StudyActivityContent),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
)

interface StudyActivityProps {
  pageNumber: number
  studentId?: string
  classCode?: string
  studentName?: string
}

export function StudyActivity(props: StudyActivityProps) {
  return (
    <ClientOnly
      fallback={
        <Card className="h-full flex items-center justify-center">
          <CardContent>
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600 mt-2">학습활동을 불러오는 중...</p>
          </CardContent>
        </Card>
      }
    >
      <div className="h-full overflow-hidden">
        <StudyActivityContent {...props} />
      </div>
    </ClientOnly>
  )
}