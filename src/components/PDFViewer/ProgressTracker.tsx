'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  BookOpen, 
  CheckCircle2, 
  Clock, 
  Target 
} from 'lucide-react';

interface ProgressTrackerProps {
  currentPage: number;
  totalPages: number;
  completedActivities: number;
  totalActivities?: number;
  timeSpent?: number;
  estimatedTimeRemaining?: number;
}

export default function ProgressTracker({
  currentPage,
  totalPages,
  completedActivities,
  totalActivities = 0,
  timeSpent,
  estimatedTimeRemaining
}: ProgressTrackerProps) {
  const readingProgress = totalPages > 0 ? (currentPage / totalPages) * 100 : 0;
  const activityProgress = totalActivities > 0 ? (completedActivities / totalActivities) * 100 : 0;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    if (mins > 0) {
      return `${mins}분 ${secs}초`;
    }
    return `${secs}초`;
  };

  return (
    <Card className="mt-4">
      <CardContent className="p-4">
        <div className="space-y-4">
          {/* Reading Progress */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-medium">
                <BookOpen className="h-4 w-4" />
                읽기 진도
              </div>
              <span className="text-sm text-gray-600">
                {currentPage} / {totalPages} 페이지
              </span>
            </div>
            <Progress value={readingProgress} className="h-2" />
            <div className="text-xs text-gray-500 text-center">
              {Math.round(readingProgress)}% 완료
            </div>
          </div>

          {/* Activity Progress */}
          {totalActivities > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <Target className="h-4 w-4" />
                  활동 완료
                </div>
                <span className="text-sm text-gray-600">
                  {completedActivities} / {totalActivities}
                </span>
              </div>
              <Progress value={activityProgress} className="h-2" />
              <div className="text-xs text-gray-500 text-center">
                {Math.round(activityProgress)}% 완료
              </div>
            </div>
          )}

          {/* Current Page Activities */}
          {completedActivities > 0 && (
            <div className="flex items-center gap-2 p-2 bg-green-50 rounded-md">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm text-green-800">
                현재 페이지에서 {completedActivities}개 활동 완료
              </span>
            </div>
          )}

          {/* Time Tracking */}
          {(timeSpent || estimatedTimeRemaining) && (
            <div className="space-y-2 pt-2 border-t">
              <div className="grid grid-cols-2 gap-4">
                {timeSpent && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-blue-600" />
                    <div className="text-xs">
                      <div className="text-gray-500">소요 시간</div>
                      <div className="font-medium">{formatTime(timeSpent)}</div>
                    </div>
                  </div>
                )}
                
                {estimatedTimeRemaining && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-600" />
                    <div className="text-xs">
                      <div className="text-gray-500">예상 남은 시간</div>
                      <div className="font-medium">{formatTime(estimatedTimeRemaining)}</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Progress Badges */}
          <div className="flex flex-wrap gap-2 pt-2 border-t">
            <Badge variant="outline" className="text-xs">
              <BookOpen className="h-3 w-3 mr-1" />
              {currentPage} 페이지
            </Badge>
            
            {totalActivities > 0 && (
              <Badge 
                variant={completedActivities === totalActivities ? "default" : "secondary"}
                className="text-xs"
              >
                <Target className="h-3 w-3 mr-1" />
                활동 {completedActivities}/{totalActivities}
              </Badge>
            )}

            {readingProgress === 100 && (
              <Badge variant="default" className="text-xs bg-green-600">
                <CheckCircle2 className="h-3 w-3 mr-1" />
                완독
              </Badge>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}