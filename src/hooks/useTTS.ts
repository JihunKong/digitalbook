'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { toast } from '@/components/ui/use-toast';

interface TTSOptions {
  voice?: string;
  model?: 'tts-1' | 'tts-1-hd';
  speed?: number;
  language?: 'ko' | 'en';
  autoPlay?: boolean;
}

interface UseTTSReturn {
  speak: (text: string, options?: TTSOptions) => Promise<void>;
  stop: () => void;
  pause: () => void;
  resume: () => void;
  isLoading: boolean;
  isSpeaking: boolean;
  isPaused: boolean;
  audioUrl: string | null;
  error: string | null;
}

/**
 * Custom hook for Text-to-Speech functionality using OpenAI API
 * Provides a unified interface for all TTS operations
 */
export function useTTS(): UseTTSReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  const speak = useCallback(async (text: string, options: TTSOptions = {}) => {
    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Stop current audio if playing  
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }

    // Stop browser TTS if playing
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    if (!text?.trim()) {
      setError('텍스트가 없습니다');
      toast({
        title: '텍스트가 없습니다',
        description: '읽을 텍스트를 입력해주세요.',
        variant: 'destructive'
      });
      return;
    }

    setIsLoading(true);
    setError(null);
    setIsSpeaking(false);
    setIsPaused(false);

    // Korean optimized settings
    const {
      voice = 'shimmer',
      model = 'tts-1-hd',  // HD 모델로 품질 향상
      speed = 0.95,  // 한국어에 최적화된 속도
      language = 'ko',
      autoPlay = true
    } = options;

    // Use backend API endpoint directly
    const baseUrl = window.location.hostname === 'localhost' 
      ? 'http://localhost:4000/api' 
      : 'https://xn--220bu63c.com/api';

    // First try OpenAI API for better quality
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(`${baseUrl}/tts/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        signal: abortControllerRef.current.signal,
        body: JSON.stringify({
          text,
          voice,
          model,
          speed,
          language
        }),
      });

      if (!response.ok) {
        throw new Error(`TTS 생성 실패: ${response.status}`);
      }

      const data = await response.json();
      
      if (!data.audioUrl) {
        // API failed but don't fallback to browser TTS
        setError('OpenAI TTS를 사용할 수 없습니다. API 키를 확인해주세요.');
        toast({
          title: 'TTS 오류',
          description: 'OpenAI API 키가 설정되지 않았거나 유효하지 않습니다.',
          variant: 'destructive'
        });
        setIsLoading(false);
        return;
      }

      // Clean up old audio URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      // Build full audio URL
      let fullAudioUrl: string;
      if (data.audioUrl.startsWith('http')) {
        fullAudioUrl = data.audioUrl;
      } else if (data.audioUrl.startsWith('/api')) {
        // If audioUrl already includes /api, use the base domain without /api
        const baseDomain = window.location.hostname === 'localhost' 
          ? 'http://localhost:4000' 
          : 'https://xn--220bu63c.com';
        fullAudioUrl = `${baseDomain}${data.audioUrl}`;
      } else {
        fullAudioUrl = `${baseUrl}${data.audioUrl}`;
      }
      
      // Set new audio URL
      setAudioUrl(fullAudioUrl);
      console.log('Audio URL:', fullAudioUrl); // Debug log

      // Create and configure audio element
      const audio = new Audio(fullAudioUrl);
      audioRef.current = audio;

      // Set up event listeners
      audio.addEventListener('play', () => {
        setIsSpeaking(true);
        setIsPaused(false);
      });

      audio.addEventListener('pause', () => {
        setIsPaused(true);
      });

      audio.addEventListener('ended', () => {
        setIsSpeaking(false);
        setIsPaused(false);
      });

      audio.addEventListener('error', (e) => {
        console.error('Audio playback error:', e);
        setError('오디오 재생 실패');
        setIsSpeaking(false);
        setIsPaused(false);
      });

      // Auto play if requested
      if (autoPlay) {
        await audio.play();
      }

      toast({
        title: '고품질 음성 읽기',
        description: 'OpenAI HD 음성을 사용합니다.',
        duration: 2000,
      });

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('TTS request aborted');
        return;
      }
      
      console.error('OpenAI TTS error:', err);
      
      // No fallback to browser TTS - only use OpenAI
      setError('OpenAI TTS 사용 불가');
      toast({
        title: 'TTS 오류',
        description: 'OpenAI 음성 서비스를 사용할 수 없습니다. API 키를 확인해주세요.',
        variant: 'destructive'
      });
    } finally {
      setIsLoading(false);
    }
  }, [audioUrl]);

  const stop = useCallback(() => {
    // Stop browser TTS if active
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    
    // Stop audio element
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    
    setIsSpeaking(false);
    setIsPaused(false);
  }, []);

  const pause = useCallback(() => {
    if (audioRef.current && isSpeaking) {
      audioRef.current.pause();
      setIsPaused(true);
    }
  }, [isSpeaking]);

  const resume = useCallback(() => {
    if (audioRef.current && isPaused) {
      audioRef.current.play();
      setIsPaused(false);
    }
  }, [isPaused]);

  return {
    speak,
    stop,
    pause,
    resume,
    isLoading,
    isSpeaking,
    isPaused,
    audioUrl,
    error
  };
}