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

    // Create new abort controller for this request
    abortControllerRef.current = new AbortController();

    try {
      // Korean optimized settings
      const {
        voice = 'shimmer', // Better for Korean
        model = 'tts-1-hd', // High quality
        speed = 0.9, // Slightly slower for Korean clarity
        language = 'ko',
        autoPlay = true
      } = options;

      const response = await fetch('/api/tts/generate', {
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
      
      if (!data.data?.audioUrl) {
        throw new Error('오디오 URL을 받지 못했습니다');
      }

      // Clean up old audio URL
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }

      // Set new audio URL
      setAudioUrl(data.data.audioUrl);

      // Create and configure audio element
      const audio = new Audio(data.data.audioUrl);
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

      // Show cache status
      if (data.data.cached) {
        toast({
          title: '캐시된 음성 사용',
          description: '이전에 생성된 음성을 재생합니다.',
          duration: 2000,
        });
      }

    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('TTS request aborted');
        return;
      }
      
      console.error('TTS error:', err);
      setError(err.message || '음성 생성 실패');
      
      // Fallback to browser TTS if API fails
      if ('speechSynthesis' in window && !options.voice) {
        console.log('Falling back to browser TTS');
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = options.language === 'en' ? 'en-US' : 'ko-KR';
        utterance.rate = options.speed || 0.9;
        
        utterance.onstart = () => {
          setIsSpeaking(true);
          setIsPaused(false);
        };
        
        utterance.onend = () => {
          setIsSpeaking(false);
          setIsPaused(false);
        };
        
        utterance.onerror = () => {
          setError('브라우저 TTS 실패');
          setIsSpeaking(false);
        };
        
        window.speechSynthesis.speak(utterance);
        
        toast({
          title: 'API 연결 실패',
          description: '브라우저 내장 음성을 사용합니다.',
          variant: 'default'
        });
      } else {
        toast({
          title: '음성 생성 실패',
          description: err.message || '음성을 생성하는 중 오류가 발생했습니다.',
          variant: 'destructive'
        });
      }
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