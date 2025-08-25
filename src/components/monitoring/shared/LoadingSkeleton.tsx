'use client';

import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface LoadingSkeletonProps {
  type: 'sidebar' | 'grid' | 'list' | 'charts' | 'cards';
}

export default function LoadingSkeleton({ type }: LoadingSkeletonProps) {
  const SkeletonBox = ({ className = '' }) => (
    <div className={`animate-pulse bg-gray-200 rounded ${className}`}></div>
  );

  const SkeletonCard = () => (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center space-x-3">
          <SkeletonBox className="w-10 h-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <SkeletonBox className="h-4 w-24" />
            <SkeletonBox className="h-3 w-16" />
          </div>
          <SkeletonBox className="h-6 w-12" />
        </div>
      </CardContent>
    </Card>
  );

  const SidebarSkeleton = () => (
    <div className="space-y-6">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-3">
          <SkeletonBox className="h-4 w-24" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-gray-50 rounded-lg">
              <SkeletonBox className="h-8 w-8 mx-auto mb-2" />
              <SkeletonBox className="h-3 w-12 mx-auto" />
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <SkeletonBox className="h-8 w-8 mx-auto mb-2" />
              <SkeletonBox className="h-3 w-12 mx-auto" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Student List */}
      <Card>
        <CardHeader className="pb-3">
          <SkeletonBox className="h-4 w-20" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="flex items-center space-x-3 p-2">
                <SkeletonBox className="w-3 h-3 rounded-full" />
                <div className="flex-1 space-y-1">
                  <SkeletonBox className="h-3 w-20" />
                  <SkeletonBox className="h-2 w-16" />
                </div>
                <SkeletonBox className="h-2 w-8" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Recent Activities */}
      <Card>
        <CardHeader className="pb-3">
          <SkeletonBox className="h-4 w-20" />
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-start space-x-3 p-2">
                <SkeletonBox className="w-4 h-4 mt-0.5" />
                <div className="flex-1 space-y-1">
                  <SkeletonBox className="h-3 w-24" />
                  <SkeletonBox className="h-2 w-32" />
                  <SkeletonBox className="h-2 w-16" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const GridSkeleton = () => (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <SkeletonBox className="h-5 w-32" />
                <SkeletonBox className="h-6 w-16" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, j) => (
                  <div key={j} className="text-center">
                    <SkeletonBox className="h-6 w-12 mx-auto mb-2" />
                    <SkeletonBox className="h-3 w-16 mx-auto" />
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  const ListSkeleton = () => (
    <div className="space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );

  const ChartsSkeleton = () => (
    <div className="space-y-6">
      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <SkeletonBox className="h-4 w-20" />
                  <SkeletonBox className="h-8 w-16" />
                </div>
                <SkeletonBox className="w-12 h-12 rounded-full" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Chart Area */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <SkeletonBox className="h-6 w-32" />
            <SkeletonBox className="h-8 w-24" />
          </div>
        </CardHeader>
        <CardContent>
          <SkeletonBox className="h-80 w-full" />
        </CardContent>
      </Card>

      {/* Additional Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 2 }).map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <SkeletonBox className="h-5 w-28" />
            </CardHeader>
            <CardContent>
              <SkeletonBox className="h-64 w-full" />
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );

  const CardsSkeleton = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <SkeletonBox className="w-10 h-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <SkeletonBox className="h-4 w-24" />
                <SkeletonBox className="h-3 w-16" />
                <SkeletonBox className="h-2 w-full" />
                <SkeletonBox className="h-3 w-20" />
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );

  switch (type) {
    case 'sidebar':
      return <SidebarSkeleton />;
    case 'grid':
      return <GridSkeleton />;
    case 'list':
      return <ListSkeleton />;
    case 'charts':
      return <ChartsSkeleton />;
    case 'cards':
      return <CardsSkeleton />;
    default:
      return (
        <div className="animate-pulse">
          <div className="space-y-4">
            <SkeletonBox className="h-8 w-48" />
            <SkeletonBox className="h-4 w-32" />
            <div className="grid grid-cols-3 gap-4">
              <SkeletonBox className="h-24" />
              <SkeletonBox className="h-24" />
              <SkeletonBox className="h-24" />
            </div>
          </div>
        </div>
      );
  }
}