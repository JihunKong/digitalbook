'use client'

import { ClientOnly } from '@/components/ClientOnly'
import { Card, CardContent } from '@/components/ui/card'
import { Loader2 } from 'lucide-react'
import dynamic from 'next/dynamic'

// Dynamically import the actual component
const GroupActivityContent = dynamic(
  () => import('./GroupActivityContent').then(mod => mod.GroupActivityContent),
  { 
    ssr: false,
    loading: () => (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    )
  }
)

interface GroupActivityProps {
  groupId?: string
  studentName?: string
}

export function GroupActivity(props: GroupActivityProps) {
  return (
    <ClientOnly
      fallback={
        <Card className="h-full flex items-center justify-center">
          <CardContent>
            <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            <p className="text-sm text-gray-600 mt-2">모둠활동을 불러오는 중...</p>
          </CardContent>
        </Card>
      }
    >
      <GroupActivityContent {...props} />
    </ClientOnly>
  )
}