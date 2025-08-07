'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Volume2, 
  VolumeX, 
  Loader2, 
  Settings,
  PlayCircle,
  PauseCircle,
  ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AudioPlayer } from './AudioPlayer';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface TextToSpeechProps {
  text: string;
  className?: string;
  showInline?: boolean;
  title?: string;
  autoHighlight?: boolean;
  onSentenceChange?: (sentenceIndex: number) => void;
}

interface VoiceOption {
  id: string;
  name: string;
  description: string;
}

export function TextToSpeech({
  text,
  className,
  showInline = false,
  title,
  autoHighlight = true,
  onSentenceChange
}: TextToSpeechProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [selectedVoice, setSelectedVoice] = useState('nova');
  const [speed, setSpeed] = useState(1.0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voices, setVoices] = useState<VoiceOption[]>([]);
  const [currentSentence, setCurrentSentence] = useState(0);
  const sentencesRef = useRef<string[]>([]);

  // Load available voices
  useEffect(() => {
    fetchVoices();
  }, []);

  // Split text into sentences for highlighting
  useEffect(() => {
    if (autoHighlight) {
      // Split by Korean and English sentence endings
      sentencesRef.current = text.split(/[.!?。！？]\s*/g).filter(s => s.length > 0);
    }
  }, [text, autoHighlight]);

  const fetchVoices = async () => {
    try {
      const response = await fetch('/api/tts/voices', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setVoices(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch voices:', error);
    }
  };

  const generateSpeech = async () => {
    if (!text.trim()) {
      toast({
        title: '텍스트가 없습니다',
        description: '읽을 텍스트를 입력해주세요.',
        variant: 'destructive'
      });
      return;
    }

    setIsGenerating(true);
    
    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          text,
          voice: selectedVoice,
          speed,
          language: 'ko',
          model: 'tts-1-hd'
        }),
      });

      if (!response.ok) {
        throw new Error('음성 생성에 실패했습니다');
      }

      const data = await response.json();
      setAudioUrl(data.data.audioUrl);
      setIsPlaying(true);

      // Show cache status
      if (data.data.cached) {
        toast({
          title: '캐시된 음성 사용',
          description: '이전에 생성된 음성을 재생합니다.',
        });
      }

    } catch (error) {
      console.error('TTS generation error:', error);
      toast({
        title: '음성 생성 실패',
        description: '음성을 생성하는 중 오류가 발생했습니다.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentSentence(0);
    if (onSentenceChange) {
      onSentenceChange(0);
    }
  };

  // Highlight current sentence during playback
  const updateHighlight = (currentTime: number, duration: number) => {
    if (!autoHighlight || sentencesRef.current.length === 0) return;
    
    const progress = currentTime / duration;
    const sentenceIndex = Math.floor(progress * sentencesRef.current.length);
    
    if (sentenceIndex !== currentSentence) {
      setCurrentSentence(sentenceIndex);
      if (onSentenceChange) {
        onSentenceChange(sentenceIndex);
      }
    }
  };

  if (showInline) {
    // Inline button for paragraphs
    return (
      <Button
        variant="ghost"
        size="sm"
        onClick={generateSpeech}
        disabled={isGenerating}
        className={cn('ml-2', className)}
        title="텍스트 읽기"
      >
        {isGenerating ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
      </Button>
    );
  }

  // Full player interface
  return (
    <div className={cn('space-y-4', className)}>
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            onClick={generateSpeech}
            disabled={isGenerating || isPlaying}
            className="gap-2"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                생성 중...
              </>
            ) : isPlaying ? (
              <>
                <PauseCircle className="h-4 w-4" />
                재생 중
              </>
            ) : (
              <>
                <PlayCircle className="h-4 w-4" />
                읽기 시작
              </>
            )}
          </Button>

          {/* Voice Settings */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="icon" disabled={isGenerating}>
                <Settings className="h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-80">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">음성 선택</label>
                  <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {voices.map(voice => (
                        <SelectItem key={voice.id} value={voice.id}>
                          <div>
                            <div className="font-medium">{voice.name}</div>
                            <div className="text-xs text-gray-500">
                              {voice.description}
                            </div>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">
                    재생 속도: {speed}x
                  </label>
                  <Slider
                    value={[speed]}
                    min={0.5}
                    max={2}
                    step={0.25}
                    onValueChange={(value) => setSpeed(value[0])}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0.5x</span>
                    <span>1x</span>
                    <span>2x</span>
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {/* Status */}
        {audioUrl && (
          <div className="text-sm text-gray-500">
            {isPlaying ? '재생 중...' : '준비 완료'}
          </div>
        )}
      </div>

      {/* Audio Player */}
      {audioUrl && (
        <AudioPlayer
          audioUrl={audioUrl}
          title={title || '텍스트 읽기'}
          onEnded={handleAudioEnded}
          autoPlay={true}
          showDownload={true}
        />
      )}

      {/* Text with highlighting (optional) */}
      {autoHighlight && isPlaying && (
        <div className="p-4 bg-gray-50 rounded-lg">
          <div className="text-sm leading-relaxed">
            {sentencesRef.current.map((sentence, index) => (
              <span
                key={index}
                className={cn(
                  'transition-colors duration-300',
                  index === currentSentence 
                    ? 'bg-yellow-200 font-medium' 
                    : 'text-gray-700'
                )}
              >
                {sentence}
                {index < sentencesRef.current.length - 1 && '. '}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}