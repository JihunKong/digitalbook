'use client'

import { useEffect, useRef, useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { 
  Pencil,
  Eraser,
  Square,
  Circle,
  Type,
  Download,
  Trash2,
  Undo,
  Redo,
  Users,
  Palette,
  Wifi,
  WifiOff
} from 'lucide-react'
import { useSocket } from '@/hooks/useSocket'
import { toast } from 'sonner'

interface WhiteboardUser {
  userId: string
  userName: string
  userAvatar?: string
  color: string
}

interface DrawData {
  type: 'pen' | 'eraser' | 'rect' | 'circle' | 'text'
  startX: number
  startY: number
  endX?: number
  endY?: number
  color: string
  lineWidth: number
  text?: string
}

interface WhiteboardCanvasProps {
  whiteboardId: string
  isTeacher?: boolean
}

export function WhiteboardCanvas({ whiteboardId, isTeacher = false }: WhiteboardCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [tool, setTool] = useState<'pen' | 'eraser' | 'rect' | 'circle' | 'text'>('pen')
  const [color, setColor] = useState('#000000')
  const [lineWidth, setLineWidth] = useState(2)
  const [users, setUsers] = useState<WhiteboardUser[]>([])
  const [history, setHistory] = useState<ImageData[]>([])
  const [historyStep, setHistoryStep] = useState(-1)
  
  const { emit, on, off, isConnected } = useSocket()

  // Join whiteboard room
  useEffect(() => {
    if (!isConnected || !whiteboardId) return

    emit('whiteboard:join', { whiteboardId })

    const handleUserJoined = (data: any) => {
      setUsers(prev => [...prev, {
        userId: data.userId,
        userName: data.userName,
        userAvatar: data.userAvatar,
        color: `#${Math.floor(Math.random()*16777215).toString(16)}`
      }])
      toast.info(`${data.userName} joined the whiteboard`)
    }

    const handleUserLeft = (data: any) => {
      setUsers(prev => prev.filter(u => u.userId !== data.userId))
      toast.info(`${data.userName} left the whiteboard`)
    }

    const handleDraw = (data: any) => {
      const canvas = canvasRef.current
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      drawOnCanvas(ctx, data.drawData)
    }

    const handleClear = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.clearRect(0, 0, canvas.width, canvas.height)
      setHistory([])
      setHistoryStep(-1)
    }

    const cleanup1 = on('user:joined-whiteboard', handleUserJoined)
    const cleanup2 = on('user:left-whiteboard', handleUserLeft)
    const cleanup3 = on('whiteboard:draw', handleDraw)
    const cleanup4 = on('whiteboard:cleared', handleClear)

    return () => {
      emit('whiteboard:leave', { whiteboardId })
      cleanup1?.()
      cleanup2?.()
      cleanup3?.()
      cleanup4?.()
    }
  }, [emit, on, off, isConnected, whiteboardId])

  const drawOnCanvas = (ctx: CanvasRenderingContext2D, drawData: DrawData) => {
    ctx.globalCompositeOperation = drawData.type === 'eraser' ? 'destination-out' : 'source-over'
    ctx.strokeStyle = drawData.color
    ctx.lineWidth = drawData.lineWidth
    ctx.lineCap = 'round'

    switch (drawData.type) {
      case 'pen':
      case 'eraser':
        ctx.beginPath()
        ctx.moveTo(drawData.startX, drawData.startY)
        if (drawData.endX && drawData.endY) {
          ctx.lineTo(drawData.endX, drawData.endY)
        }
        ctx.stroke()
        break
      
      case 'rect':
        if (drawData.endX && drawData.endY) {
          const width = drawData.endX - drawData.startX
          const height = drawData.endY - drawData.startY
          ctx.strokeRect(drawData.startX, drawData.startY, width, height)
        }
        break
      
      case 'circle':
        if (drawData.endX && drawData.endY) {
          const radius = Math.sqrt(
            Math.pow(drawData.endX - drawData.startX, 2) + 
            Math.pow(drawData.endY - drawData.startY, 2)
          )
          ctx.beginPath()
          ctx.arc(drawData.startX, drawData.startY, radius, 0, 2 * Math.PI)
          ctx.stroke()
        }
        break
      
      case 'text':
        if (drawData.text) {
          ctx.font = `${drawData.lineWidth * 8}px sans-serif`
          ctx.fillStyle = drawData.color
          ctx.fillText(drawData.text, drawData.startX, drawData.startY)
        }
        break
    }
  }

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    setIsDrawing(true)

    if (tool === 'text') {
      const text = prompt('Enter text:')
      if (text) {
        const ctx = canvas.getContext('2d')
        if (ctx) {
          const drawData: DrawData = {
            type: 'text',
            startX: x,
            startY: y,
            color,
            lineWidth,
            text
          }
          drawOnCanvas(ctx, drawData)
          emit('whiteboard:draw', { whiteboardId, drawData })
          saveHistory()
        }
      }
      setIsDrawing(false)
    }
  }

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || tool === 'text') return

    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top

    const drawData: DrawData = {
      type: tool,
      startX: x,
      startY: y,
      endX: x,
      endY: y,
      color,
      lineWidth
    }

    drawOnCanvas(ctx, drawData)
    emit('whiteboard:draw', { whiteboardId, drawData })
  }

  const stopDrawing = () => {
    if (isDrawing) {
      setIsDrawing(false)
      saveHistory()
    }
  }

  const saveHistory = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height)
    const newHistory = history.slice(0, historyStep + 1)
    newHistory.push(imageData)
    
    if (newHistory.length > 50) {
      newHistory.shift()
    }
    
    setHistory(newHistory)
    setHistoryStep(newHistory.length - 1)
  }

  const undo = () => {
    if (historyStep > 0) {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const step = historyStep - 1
      ctx.putImageData(history[step], 0, 0)
      setHistoryStep(step)
      
      emit('whiteboard:undo', { whiteboardId, action: 'undo' })
    }
  }

  const redo = () => {
    if (historyStep < history.length - 1) {
      const canvas = canvasRef.current
      if (!canvas) return

      const ctx = canvas.getContext('2d')
      if (!ctx) return

      const step = historyStep + 1
      ctx.putImageData(history[step], 0, 0)
      setHistoryStep(step)
      
      emit('whiteboard:undo', { whiteboardId, action: 'redo' })
    }
  }

  const clearCanvas = () => {
    if (!isTeacher) {
      toast.error('Only teachers can clear the whiteboard')
      return
    }

    if (confirm('Are you sure you want to clear the whiteboard?')) {
      emit('whiteboard:clear', { whiteboardId })
    }
  }

  const downloadCanvas = () => {
    const canvas = canvasRef.current
    if (!canvas) return

    const link = document.createElement('a')
    link.download = `whiteboard-${whiteboardId}-${Date.now()}.png`
    link.href = canvas.toDataURL()
    link.click()
  }

  const colors = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF']

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              Collaborative Whiteboard
              {isConnected ? (
                <Badge variant="outline" className="text-xs gap-1">
                  <Wifi className="w-3 h-3 text-green-500" />
                  Connected
                </Badge>
              ) : (
                <Badge variant="outline" className="text-xs gap-1">
                  <WifiOff className="w-3 h-3 text-red-500" />
                  Offline
                </Badge>
              )}
            </CardTitle>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4" />
            <span className="text-sm">{users.length + 1} users</span>
            <div className="flex -space-x-2">
              {users.slice(0, 3).map(user => (
                <Avatar key={user.userId} className="w-6 h-6 border-2 border-white">
                  <AvatarImage src={user.userAvatar} />
                  <AvatarFallback style={{ backgroundColor: user.color }}>
                    {user.userName[0]}
                  </AvatarFallback>
                </Avatar>
              ))}
              {users.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-xs font-bold">
                  +{users.length - 3}
                </div>
              )}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Toolbar */}
        <div className="flex flex-wrap gap-2 mb-4">
          <div className="flex gap-1 border rounded p-1">
            <Button
              size="sm"
              variant={tool === 'pen' ? 'default' : 'ghost'}
              onClick={() => setTool('pen')}
            >
              <Pencil className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={tool === 'eraser' ? 'default' : 'ghost'}
              onClick={() => setTool('eraser')}
            >
              <Eraser className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={tool === 'rect' ? 'default' : 'ghost'}
              onClick={() => setTool('rect')}
            >
              <Square className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={tool === 'circle' ? 'default' : 'ghost'}
              onClick={() => setTool('circle')}
            >
              <Circle className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant={tool === 'text' ? 'default' : 'ghost'}
              onClick={() => setTool('text')}
            >
              <Type className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex gap-1 border rounded p-1">
            {colors.map(c => (
              <button
                key={c}
                className={`w-6 h-6 rounded ${color === c ? 'ring-2 ring-offset-1' : ''}`}
                style={{ backgroundColor: c }}
                onClick={() => setColor(c)}
              />
            ))}
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className="w-6 h-6"
            />
          </div>

          <div className="flex gap-1 border rounded p-1">
            <select
              value={lineWidth}
              onChange={(e) => setLineWidth(Number(e.target.value))}
              className="text-sm px-2"
            >
              <option value={1}>Thin</option>
              <option value={2}>Normal</option>
              <option value={4}>Thick</option>
              <option value={8}>Extra Thick</option>
            </select>
          </div>

          <div className="flex gap-1 border rounded p-1">
            <Button
              size="sm"
              variant="ghost"
              onClick={undo}
              disabled={historyStep <= 0}
            >
              <Undo className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={redo}
              disabled={historyStep >= history.length - 1}
            >
              <Redo className="w-4 h-4" />
            </Button>
          </div>

          <div className="flex gap-1 ml-auto">
            <Button
              size="sm"
              variant="outline"
              onClick={downloadCanvas}
            >
              <Download className="w-4 h-4" />
            </Button>
            {isTeacher && (
              <Button
                size="sm"
                variant="destructive"
                onClick={clearCanvas}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Canvas */}
        <div className="border rounded overflow-hidden">
          <canvas
            ref={canvasRef}
            width={800}
            height={600}
            className="bg-white cursor-crosshair w-full"
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseLeave={stopDrawing}
          />
        </div>
      </CardContent>
    </Card>
  )
}