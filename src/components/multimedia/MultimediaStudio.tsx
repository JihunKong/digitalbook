'use client';

import React, { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Toggle } from '@/components/ui/toggle';
import {
  Image,
  Video,
  Mic,
  Music,
  FileText,
  Upload,
  Download,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  Layers,
  Move,
  Type,
  Square,
  Circle,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  Palette,
  Sparkles
} from 'lucide-react';
import { DndProvider, useDrag, useDrop } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';

interface MediaElement {
  id: string;
  type: 'image' | 'video' | 'audio' | 'text' | 'shape';
  content: any;
  position: { x: number; y: number };
  size: { width: number; height: number };
  rotation: number;
  opacity: number;
  locked: boolean;
  visible: boolean;
  layer: number;
}

interface ImageContent {
  src: string;
  alt: string;
  filters: {
    brightness: number;
    contrast: number;
    saturation: number;
  };
}

interface VideoContent {
  src: string;
  currentTime: number;
  duration: number;
  volume: number;
}

interface AudioContent {
  src: string;
  title: string;
  duration: number;
  volume: number;
}

interface TextContent {
  text: string;
  fontSize: number;
  fontFamily: string;
  color: string;
  align: 'left' | 'center' | 'right';
  bold: boolean;
  italic: boolean;
}

interface ShapeContent {
  type: 'rectangle' | 'circle' | 'triangle';
  fill: string;
  stroke: string;
  strokeWidth: number;
}

interface Timeline {
  duration: number;
  currentTime: number;
  tracks: {
    id: string;
    elements: {
      elementId: string;
      startTime: number;
      endTime: number;
    }[];
  }[];
}

const CANVAS_WIDTH = 1920;
const CANVAS_HEIGHT = 1080;

function MediaElementComponent({ element, isSelected, onSelect, onUpdate }: any) {
  const [{ isDragging }, drag] = useDrag(() => ({
    type: 'element',
    item: { id: element.id },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
  }));

  const handleMouseDown = (e: React.MouseEvent) => {
    onSelect(element.id);
  };

  const style: React.CSSProperties = {
    position: 'absolute',
    left: element.position.x,
    top: element.position.y,
    width: element.size.width,
    height: element.size.height,
    transform: `rotate(${element.rotation}deg)`,
    opacity: element.opacity,
    cursor: element.locked ? 'not-allowed' : 'move',
    border: isSelected ? '2px solid #3B82F6' : 'none',
    display: element.visible ? 'block' : 'none',
  };

  return (
    <div
      ref={drag as any}
      style={style}
      onMouseDown={handleMouseDown}
      className="group"
    >
      {element.type === 'image' && (
        <img
          src={element.content.src}
          alt={element.content.alt}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            filter: `brightness(${element.content.filters.brightness}%) contrast(${element.content.filters.contrast}%) saturate(${element.content.filters.saturation}%)`
          }}
        />
      )}
      
      {element.type === 'text' && (
        <div
          style={{
            fontSize: element.content.fontSize,
            fontFamily: element.content.fontFamily,
            color: element.content.color,
            textAlign: element.content.align,
            fontWeight: element.content.bold ? 'bold' : 'normal',
            fontStyle: element.content.italic ? 'italic' : 'normal',
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: element.content.align === 'center' ? 'center' : 
                           element.content.align === 'right' ? 'flex-end' : 'flex-start'
          }}
        >
          {element.content.text}
        </div>
      )}
      
      {element.type === 'shape' && (
        <svg width="100%" height="100%" viewBox="0 0 100 100">
          {element.content.type === 'rectangle' && (
            <rect
              x="0"
              y="0"
              width="100"
              height="100"
              fill={element.content.fill}
              stroke={element.content.stroke}
              strokeWidth={element.content.strokeWidth}
            />
          )}
          {element.content.type === 'circle' && (
            <circle
              cx="50"
              cy="50"
              r="50"
              fill={element.content.fill}
              stroke={element.content.stroke}
              strokeWidth={element.content.strokeWidth}
            />
          )}
        </svg>
      )}

      {element.type === 'video' && (
        <div className="relative w-full h-full bg-black rounded overflow-hidden">
          <video
            src={element.content.url}
            poster={element.content.poster}
            controls
            loop={element.content.loop}
            muted
            className="w-full h-full object-contain"
          >
            Your browser does not support the video tag.
          </video>
          {!element.content.url && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <Video className="w-12 h-12 opacity-50" />
            </div>
          )}
        </div>
      )}

      {element.type === 'audio' && (
        <div className="relative w-full h-full bg-gray-800 rounded p-4 flex items-center justify-center">
          {element.content.url ? (
            <audio
              src={element.content.url}
              controls
              loop={element.content.loop}
              className="w-full"
            >
              Your browser does not support the audio tag.
            </audio>
          ) : (
            <div className="flex items-center justify-center text-white">
              <Mic className="w-8 h-8 opacity-50" />
            </div>
          )}
        </div>
      )}

      {/* 조작 핸들 */}
      {isSelected && !element.locked && (
        <>
          <div className="absolute -top-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-nw-resize" />
          <div className="absolute -top-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-ne-resize" />
          <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-500 rounded-full cursor-sw-resize" />
          <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-blue-500 rounded-full cursor-se-resize" />
        </>
      )}
    </div>
  );
}

export function MultimediaStudio() {
  const [elements, setElements] = useState<MediaElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [zoom, setZoom] = useState(50); // 50% zoom to fit canvas
  const canvasRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const importInputRef = useRef<HTMLInputElement>(null);
  
  const [timeline, setTimeline] = useState<Timeline>({
    duration: 60,
    currentTime: 0,
    tracks: []
  });

  const addElement = (type: MediaElement['type']) => {
    const newElement: MediaElement = {
      id: Date.now().toString(),
      type,
      content: getDefaultContent(type),
      position: { x: 100, y: 100 },
      size: { width: 200, height: 200 },
      rotation: 0,
      opacity: 1,
      locked: false,
      visible: true,
      layer: elements.length
    };
    
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
  };

  const getDefaultContent = (type: MediaElement['type']): any => {
    switch (type) {
      case 'image':
        return {
          src: '/placeholder.png',
          alt: '이미지',
          filters: { brightness: 100, contrast: 100, saturation: 100 }
        };
      case 'text':
        return {
          text: '텍스트를 입력하세요',
          fontSize: 24,
          fontFamily: 'Arial',
          color: '#000000',
          align: 'left',
          bold: false,
          italic: false
        };
      case 'shape':
        return {
          type: 'rectangle',
          fill: '#3B82F6',
          stroke: '#000000',
          strokeWidth: 0
        };
      case 'video':
        return {
          url: '',
          poster: '',
          playing: false,
          volume: 1,
          loop: false
        };
      case 'audio':
        return {
          url: '',
          waveform: true,
          playing: false,
          volume: 1,
          loop: false
        };
      default:
        return {};
    }
  };

  const updateElement = (id: string, updates: Partial<MediaElement>) => {
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const deleteElement = (id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    if (selectedElement === id) {
      setSelectedElement(null);
    }
  };

  const duplicateElement = (id: string) => {
    const element = elements.find(el => el.id === id);
    if (element) {
      const newElement = {
        ...element,
        id: Date.now().toString(),
        position: {
          x: element.position.x + 20,
          y: element.position.y + 20
        }
      };
      setElements([...elements, newElement]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      
      if (file.type.startsWith('image/')) {
        addElement('image');
        const newElement = elements[elements.length];
        if (newElement) {
          updateElement(newElement.id, {
            content: { ...newElement.content, src }
          });
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const importProject = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        const projectData = JSON.parse(content);
        
        // Validate project data
        if (projectData.elements && Array.isArray(projectData.elements)) {
          setElements(projectData.elements);
          
          if (projectData.timeline) {
            setTimeline(projectData.timeline);
          }
          
          if (projectData.metadata?.title) {
            alert(`프로젝트 "${projectData.metadata.title}"를 불러왔습니다.`);
          } else {
            alert('프로젝트를 성공적으로 불러왔습니다.');
          }
        } else {
          alert('올바른 프로젝트 파일이 아닙니다.');
        }
      } catch (error) {
        console.error('Failed to import project:', error);
        alert('프로젝트를 불러오는데 실패했습니다.');
      }
    };
    
    reader.readAsText(file);
    // Reset input so the same file can be loaded again
    if (importInputRef.current) {
      importInputRef.current.value = '';
    }
  };

  const exportProject = (format: 'json' | 'html' = 'json') => {
    if (format === 'json') {
      // JSON format export
      const projectData = {
        elements,
        timeline,
        metadata: {
          title: '멀티미디어 프로젝트',
          created: new Date(),
          format: 'json'
        }
      };
      
      const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'multimedia-project.json';
      a.click();
      URL.revokeObjectURL(url);
    } else if (format === 'html') {
      // HTML format export
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <title>멀티미디어 프로젝트</title>
    <style>
        body { margin: 0; padding: 20px; font-family: Arial, sans-serif; }
        .canvas { position: relative; width: 800px; height: 600px; margin: 0 auto; border: 1px solid #ccc; }
        .element { position: absolute; }
    </style>
</head>
<body>
    <div class="canvas">
        ${elements.map(el => {
          const style = `left: ${el.position.x}px; top: ${el.position.y}px; width: ${el.size.width}px; height: ${el.size.height}px; transform: rotate(${el.rotation}deg);`;
          
          if (el.type === 'text') {
            return `<div class="element" style="${style} font-size: ${el.content.fontSize}px; color: ${el.content.color};">${el.content.text}</div>`;
          } else if (el.type === 'image') {
            return `<img class="element" style="${style}" src="${el.content.src}" alt="${el.content.alt}" />`;
          } else if (el.type === 'video') {
            return `<video class="element" style="${style}" src="${el.content.url}" controls></video>`;
          }
          return '';
        }).join('')}
    </div>
</body>
</html>`;
      
      const blob = new Blob([htmlContent], { type: 'text/html' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'multimedia-project.html';
      a.click();
      URL.revokeObjectURL(url);
    }
  };

  const selected = elements.find(el => el.id === selectedElement);

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                멀티미디어 제작 스튜디오
              </span>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => importInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4 mr-1" />
                  프로젝트 불러오기
                </Button>
                <Button size="sm" onClick={() => exportProject('json')}>
                  <Download className="h-4 w-4 mr-1" />
                  내보내기
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-12 gap-6">
              {/* 왼쪽: 도구 패널 */}
              <div className="col-span-2 space-y-4">
                <div>
                  <Label className="text-sm font-semibold mb-2 block">요소 추가</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Image className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addElement('text')}
                    >
                      <Type className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => addElement('shape')}
                    >
                      <Square className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newElement: MediaElement = {
                          id: Date.now().toString(),
                          type: 'video',
                          position: { x: 50, y: 50 },
                          size: { width: 400, height: 300 },
                          rotation: 0,
                          opacity: 1,
                          locked: false,
                          visible: true,
                          layer: elements.length,
                          content: {
                            url: 'https://www.w3schools.com/html/mov_bbb.mp4', // Sample video
                            poster: ''
                          }
                        }
                        setElements([...elements, newElement])
                        setSelectedElement(newElement.id)
                      }}
                    >
                      <Video className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const newElement: MediaElement = {
                          id: Date.now().toString(),
                          type: 'audio',
                          position: { x: 50, y: 50 },
                          size: { width: 300, height: 50 },
                          rotation: 0,
                          opacity: 1,
                          locked: false,
                          visible: true,
                          layer: elements.length,
                          content: {
                            url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3', // Sample audio
                            waveform: true
                          }
                        }
                        setElements([...elements, newElement])
                        setSelectedElement(newElement.id)
                      }}
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        alert('배경음악 기능은 준비 중입니다. 오디오 버튼을 사용해주세요.')
                      }}
                    >
                      <Music className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">레이어</Label>
                  <ScrollArea className="h-[200px] border rounded">
                    <div className="p-2 space-y-1">
                      {[...elements].reverse().map((element) => (
                        <div
                          key={element.id}
                          className={`flex items-center gap-2 p-2 rounded cursor-pointer ${
                            selectedElement === element.id ? 'bg-blue-100' : 'hover:bg-gray-100'
                          }`}
                          onClick={() => setSelectedElement(element.id)}
                        >
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateElement(element.id, { visible: !element.visible });
                            }}
                          >
                            {element.visible ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              updateElement(element.id, { locked: !element.locked });
                            }}
                          >
                            {element.locked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                          </button>
                          <span className="text-sm flex-1">
                            {element.type === 'text' ? element.content.text.substring(0, 10) + '...' : element.type}
                          </span>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div>
                  <Label className="text-sm font-semibold mb-2 block">줌</Label>
                  <Slider
                    value={[zoom]}
                    onValueChange={([value]) => setZoom(value)}
                    min={10}
                    max={200}
                    step={10}
                  />
                  <p className="text-xs text-center mt-1">{zoom}%</p>
                </div>
              </div>

              {/* 가운데: 캔버스 */}
              <div className="col-span-7">
                <div className="border rounded-lg bg-gray-100 p-4">
                  <div
                    ref={canvasRef}
                    className="relative mx-auto bg-white shadow-lg"
                    style={{
                      width: `${(CANVAS_WIDTH * zoom) / 100}px`,
                      height: `${(CANVAS_HEIGHT * zoom) / 100}px`,
                      transform: `scale(${zoom / 100})`,
                      transformOrigin: 'top left'
                    }}
                  >
                    {elements.map((element) => (
                      <MediaElementComponent
                        key={element.id}
                        element={element}
                        isSelected={selectedElement === element.id}
                        onSelect={setSelectedElement}
                        onUpdate={updateElement}
                      />
                    ))}
                  </div>
                </div>

                {/* 타임라인 */}
                <Card className="mt-4">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-4 mb-4">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setIsPlaying(!isPlaying)}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button size="sm" variant="outline">
                        <SkipBack className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <SkipForward className="h-4 w-4" />
                      </Button>
                      <div className="flex-1">
                        <Slider
                          value={[timeline.currentTime]}
                          onValueChange={([value]) => setTimeline(prev => ({ ...prev, currentTime: value }))}
                          min={0}
                          max={timeline.duration}
                          step={0.1}
                        />
                      </div>
                      <span className="text-sm">
                        {Math.floor(timeline.currentTime)}s / {timeline.duration}s
                      </span>
                    </div>
                    <div className="h-24 bg-gray-100 rounded relative overflow-hidden">
                      {/* Timeline tracks */}
                      <div className="absolute inset-0">
                        {elements.map((element, index) => (
                          <div
                            key={element.id}
                            className="absolute h-4 bg-blue-500 rounded"
                            style={{
                              left: '10px',
                              right: '10px',
                              top: `${index * 20 + 10}px`,
                              opacity: selectedElement === element.id ? 1 : 0.6
                            }}
                            onClick={() => setSelectedElement(element.id)}
                          >
                            <span className="text-xs text-white px-1">
                              {element.type === 'text' ? 'T' : 
                               element.type === 'image' ? 'I' : 
                               element.type === 'video' ? 'V' : 
                               element.type === 'audio' ? 'A' : 
                               element.type === 'shape' ? 'S' : ''}
                            </span>
                          </div>
                        ))}
                      </div>
                      {/* Playhead */}
                      <div
                        className="absolute top-0 bottom-0 w-0.5 bg-red-500"
                        style={{
                          left: `${(timeline.currentTime / timeline.duration) * 100}%`
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 오른쪽: 속성 패널 */}
              <div className="col-span-3">
                {selected ? (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">속성</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* 공통 속성 */}
                      <div>
                        <Label>위치</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <Label className="text-xs">X</Label>
                            <Input
                              type="number"
                              value={selected.position.x}
                              onChange={(e) => updateElement(selected.id, {
                                position: { ...selected.position, x: parseInt(e.target.value) }
                              })}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">Y</Label>
                            <Input
                              type="number"
                              value={selected.position.y}
                              onChange={(e) => updateElement(selected.id, {
                                position: { ...selected.position, y: parseInt(e.target.value) }
                              })}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label>크기</Label>
                        <div className="grid grid-cols-2 gap-2 mt-2">
                          <div>
                            <Label className="text-xs">너비</Label>
                            <Input
                              type="number"
                              value={selected.size.width}
                              onChange={(e) => updateElement(selected.id, {
                                size: { ...selected.size, width: parseInt(e.target.value) }
                              })}
                            />
                          </div>
                          <div>
                            <Label className="text-xs">높이</Label>
                            <Input
                              type="number"
                              value={selected.size.height}
                              onChange={(e) => updateElement(selected.id, {
                                size: { ...selected.size, height: parseInt(e.target.value) }
                              })}
                            />
                          </div>
                        </div>
                      </div>

                      <div>
                        <Label>회전</Label>
                        <Slider
                          value={[selected.rotation]}
                          onValueChange={([value]) => updateElement(selected.id, { rotation: value })}
                          min={-180}
                          max={180}
                          step={1}
                        />
                      </div>

                      <div>
                        <Label>투명도</Label>
                        <Slider
                          value={[selected.opacity * 100]}
                          onValueChange={([value]) => updateElement(selected.id, { opacity: value / 100 })}
                          min={0}
                          max={100}
                          step={1}
                        />
                      </div>

                      {/* 타입별 속성 */}
                      {selected.type === 'text' && (
                        <>
                          <div>
                            <Label>텍스트</Label>
                            <Textarea
                              value={selected.content.text}
                              onChange={(e) => updateElement(selected.id, {
                                content: { ...selected.content, text: e.target.value }
                              })}
                            />
                          </div>
                          <div>
                            <Label>글꼴 크기</Label>
                            <Input
                              type="number"
                              value={selected.content.fontSize}
                              onChange={(e) => updateElement(selected.id, {
                                content: { ...selected.content, fontSize: parseInt(e.target.value) }
                              })}
                            />
                          </div>
                          <div>
                            <Label>색상</Label>
                            <Input
                              type="color"
                              value={selected.content.color}
                              onChange={(e) => updateElement(selected.id, {
                                content: { ...selected.content, color: e.target.value }
                              })}
                            />
                          </div>
                        </>
                      )}

                      {selected.type === 'shape' && (
                        <>
                          <div>
                            <Label>채우기 색상</Label>
                            <Input
                              type="color"
                              value={selected.content.fill}
                              onChange={(e) => updateElement(selected.id, {
                                content: { ...selected.content, fill: e.target.value }
                              })}
                            />
                          </div>
                          <div>
                            <Label>테두리 색상</Label>
                            <Input
                              type="color"
                              value={selected.content.stroke}
                              onChange={(e) => updateElement(selected.id, {
                                content: { ...selected.content, stroke: e.target.value }
                              })}
                            />
                          </div>
                        </>
                      )}

                      <div className="flex gap-2 pt-4">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => duplicateElement(selected.id)}
                        >
                          <Copy className="h-4 w-4 mr-1" />
                          복제
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => deleteElement(selected.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          삭제
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card>
                    <CardContent className="p-6 text-center text-gray-500">
                      요소를 선택하세요
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileUpload}
          style={{ display: 'none' }}
        />
        
        <input
          ref={importInputRef}
          type="file"
          accept=".json,application/json"
          onChange={importProject}
          style={{ display: 'none' }}
        />
      </div>
    </DndProvider>
  );
}