'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface PDFTracking {
  pdfId: string;
  currentPage: number;
  totalTimeSpent: number;
  pageStartTime: number;
  visitedPages: Set<number>;
  lastActivity: Date;
}

interface PageVisit {
  page: number;
  timestamp: Date;
  timeSpent: number;
}

export function usePDFTracking(pdfId: string) {
  const [tracking, setTracking] = useState<PDFTracking | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const socketRef = useRef<Socket | null>(null);
  const pageStartTimeRef = useRef<number>(Date.now());
  const trackingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize tracking data
  useEffect(() => {
    if (pdfId) {
      setTracking({
        pdfId,
        currentPage: 1,
        totalTimeSpent: 0,
        pageStartTime: Date.now(),
        visitedPages: new Set([1]),
        lastActivity: new Date()
      });
      pageStartTimeRef.current = Date.now();
    }
  }, [pdfId]);

  // Initialize WebSocket connection
  useEffect(() => {
    if (!pdfId) return;

    const socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000', {
      transports: ['websocket'],
      timeout: 5000
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('PDF tracking socket connected');
      setIsConnected(true);
      
      // Join PDF tracking room
      socket.emit('join-pdf-tracking', { pdfId });
    });

    socket.on('disconnect', () => {
      console.log('PDF tracking socket disconnected');
      setIsConnected(false);
    });

    socket.on('connect_error', (error) => {
      console.warn('PDF tracking socket connection error:', error);
      setIsConnected(false);
    });

    // Cleanup on unmount
    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
      socket.disconnect();
    };
  }, [pdfId]);

  // Track page view
  const trackPageView = useCallback((pageNumber: number) => {
    if (!tracking) return;

    const now = Date.now();
    const timeOnPrevious = now - pageStartTimeRef.current;
    
    // Update tracking state
    setTracking(prev => {
      if (!prev) return null;
      
      const newVisitedPages = new Set(prev.visitedPages);
      newVisitedPages.add(pageNumber);
      
      return {
        ...prev,
        currentPage: pageNumber,
        totalTimeSpent: prev.totalTimeSpent + timeOnPrevious,
        pageStartTime: now,
        visitedPages: newVisitedPages,
        lastActivity: new Date()
      };
    });

    // Reset page start time
    pageStartTimeRef.current = now;

    // Send to server via WebSocket
    if (socketRef.current && isConnected) {
      const pageVisit: PageVisit = {
        page: pageNumber,
        timestamp: new Date(),
        timeSpent: timeOnPrevious
      };

      socketRef.current.emit('pdf-page-view', {
        pdfId,
        pageNumber,
        timeSpent: timeOnPrevious,
        timestamp: new Date().toISOString()
      });
    } else {
      // Fallback: store locally and sync later
      console.warn('WebSocket not connected, storing page view locally');
      const storedViews = JSON.parse(localStorage.getItem(`pdf-views-${pdfId}`) || '[]');
      storedViews.push({
        page: pageNumber,
        timeSpent: timeOnPrevious,
        timestamp: new Date().toISOString()
      });
      localStorage.setItem(`pdf-views-${pdfId}`, JSON.stringify(storedViews));
    }
  }, [tracking, pdfId, isConnected]);

  // Get current tracking data
  const getCurrentTracking = useCallback(() => {
    if (!tracking) return null;

    const currentTime = Date.now();
    const currentPageTime = currentTime - pageStartTimeRef.current;
    
    return {
      ...tracking,
      currentPageTime,
      totalTimeSpent: tracking.totalTimeSpent + currentPageTime,
      visitedPages: Array.from(tracking.visitedPages),
      progressPercentage: tracking.visitedPages.size > 0 ? 
        Math.round((tracking.visitedPages.size / Math.max(...tracking.visitedPages)) * 100) : 0
    };
  }, [tracking]);

  // Send periodic heartbeat to maintain session
  useEffect(() => {
    if (!isConnected || !pdfId) return;

    trackingIntervalRef.current = setInterval(() => {
      if (socketRef.current && tracking) {
        socketRef.current.emit('pdf-heartbeat', {
          pdfId,
          currentPage: tracking.currentPage,
          timestamp: new Date().toISOString()
        });
      }
    }, 30000); // Send heartbeat every 30 seconds

    return () => {
      if (trackingIntervalRef.current) {
        clearInterval(trackingIntervalRef.current);
      }
    };
  }, [isConnected, pdfId, tracking]);

  // Sync local storage data when connection is restored
  useEffect(() => {
    if (isConnected && pdfId) {
      const storedViews = localStorage.getItem(`pdf-views-${pdfId}`);
      if (storedViews) {
        try {
          const views = JSON.parse(storedViews);
          if (views.length > 0 && socketRef.current) {
            socketRef.current.emit('pdf-sync-views', {
              pdfId,
              views
            });
            // Clear synced data
            localStorage.removeItem(`pdf-views-${pdfId}`);
          }
        } catch (error) {
          console.warn('Error syncing stored PDF views:', error);
        }
      }
    }
  }, [isConnected, pdfId]);

  // Handle page visibility change (pause tracking when tab is hidden)
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page is hidden - pause tracking
        if (tracking) {
          const now = Date.now();
          const timeOnPage = now - pageStartTimeRef.current;
          setTracking(prev => prev ? {
            ...prev,
            totalTimeSpent: prev.totalTimeSpent + timeOnPage
          } : null);
        }
      } else {
        // Page is visible - resume tracking
        pageStartTimeRef.current = Date.now();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [tracking]);

  return {
    trackPageView,
    getCurrentTracking,
    isConnected,
    tracking: getCurrentTracking()
  };
}