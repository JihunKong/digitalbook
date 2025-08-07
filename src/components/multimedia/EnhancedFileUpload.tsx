'use client'

import { useState, useCallback, useRef } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { 
  Upload, 
  X, 
  CheckCircle, 
  AlertCircle, 
  File, 
  Image, 
  Video, 
  Music,
  FileText,
  Loader2
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { apiClient } from '@/lib/api'

interface UploadFile {
  id: string
  file: File
  progress: number
  status: 'pending' | 'uploading' | 'completed' | 'error'
  url?: string
  error?: string
}

interface EnhancedFileUploadProps {
  acceptedTypes?: string[]
  maxFileSize?: number // in MB
  maxFiles?: number
  onUploadComplete?: (files: Array<{ id: string; url: string; type: string; name: string }>) => void
  className?: string
}

export function EnhancedFileUpload({
  acceptedTypes = ['image/*', 'video/*', 'audio/*', 'application/pdf', 'text/plain', 
                   'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 
                   'application/msword', '.txt', '.docx', '.doc'],
  maxFileSize = 100, // 100MB
  maxFiles = 10,
  onUploadComplete,
  className = ''
}: EnhancedFileUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getFileIcon = (file: File) => {
    const type = file.type
    const name = file.name.toLowerCase()
    if (type.startsWith('image/')) return <Image className="w-6 h-6" />
    if (type.startsWith('video/')) return <Video className="w-6 h-6" />
    if (type.startsWith('audio/')) return <Music className="w-6 h-6" />
    if (type === 'application/pdf' || name.endsWith('.pdf')) return <FileText className="w-6 h-6" />
    if (type === 'text/plain' || name.endsWith('.txt')) return <FileText className="w-6 h-6" />
    if (type.includes('word') || name.endsWith('.docx') || name.endsWith('.doc')) return <FileText className="w-6 h-6" />
    return <File className="w-6 h-6" />
  }

  const getFileTypeColor = (file: File) => {
    const type = file.type
    const name = file.name.toLowerCase()
    if (type.startsWith('image/')) return 'text-blue-600 bg-blue-100'
    if (type.startsWith('video/')) return 'text-purple-600 bg-purple-100'
    if (type.startsWith('audio/')) return 'text-green-600 bg-green-100'
    if (type === 'application/pdf' || name.endsWith('.pdf')) return 'text-red-600 bg-red-100'
    if (type === 'text/plain' || name.endsWith('.txt')) return 'text-yellow-600 bg-yellow-100'
    if (type.includes('word') || name.endsWith('.docx') || name.endsWith('.doc')) return 'text-indigo-600 bg-indigo-100'
    return 'text-gray-600 bg-gray-100'
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    // Check file size
    if (file.size > maxFileSize * 1024 * 1024) {
      return `파일 크기가 ${maxFileSize}MB를 초과합니다`
    }

    // Check file type
    const isValidType = acceptedTypes.some(type => {
      // Check file extension matches
      if (type.startsWith('.')) {
        return file.name.toLowerCase().endsWith(type)
      }
      // Check MIME type with wildcard
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1))
      }
      // Check exact MIME type match
      return file.type === type
    })

    if (!isValidType) {
      return '지원되지 않는 파일 형식입니다'
    }

    return null
  }

  const handleFiles = useCallback((fileList: FileList) => {
    const newFiles: UploadFile[] = []
    
    for (let i = 0; i < fileList.length; i++) {
      const file = fileList[i]
      
      // Check max files limit
      if (files.length + newFiles.length >= maxFiles) {
        toast.error(`최대 ${maxFiles}개의 파일만 업로드할 수 있습니다`)
        break
      }

      const error = validateFile(file)
      
      const uploadFile: UploadFile = {
        id: `${Date.now()}-${i}`,
        file,
        progress: 0,
        status: error ? 'error' : 'pending',
        error: error || undefined
      }
      
      newFiles.push(uploadFile)
    }

    setFiles(prev => [...prev, ...newFiles])

    // Start uploading valid files
    newFiles.forEach(uploadFile => {
      if (uploadFile.status === 'pending') {
        uploadFile.status = 'uploading'
        simulateUpload(uploadFile)
      }
    })
  }, [files.length, maxFiles])

  const simulateUpload = async (uploadFile: UploadFile) => {
    try {
      // Update file status
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'uploading' as const }
          : f
      ))

      // Create FormData for file upload
      const formData = new FormData()
      formData.append('document', uploadFile.file)

      // Upload file to server with progress tracking
      const xhr = new XMLHttpRequest()
      
      // Track upload progress
      xhr.upload.addEventListener('progress', (event) => {
        if (event.lengthComputable) {
          const progress = Math.round((event.loaded / event.total) * 100)
          setFiles(prev => prev.map(f => 
            f.id === uploadFile.id 
              ? { ...f, progress }
              : f
          ))
        }
      })

      // Handle upload completion
      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.onload = function() {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText)
            resolve(response)
          } else {
            reject(new Error(`Upload failed with status ${xhr.status}`))
          }
        }
        
        xhr.onerror = () => reject(new Error('Network error'))
        xhr.onabort = () => reject(new Error('Upload cancelled'))
      })

      // Send request
      xhr.open('POST', '/api/files/upload')
      
      // Add auth token if available
      const token = localStorage.getItem('token')
      if (token) {
        xhr.setRequestHeader('Authorization', `Bearer ${token}`)
      }
      
      xhr.send(formData)
      
      // Wait for upload to complete
      const response = await uploadPromise
      
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'completed' as const, 
              progress: 100,
              url: response.file?.id || URL.createObjectURL(uploadFile.file)
            }
          : f
      ))

      // Notify parent component with actual response data
      if (onUploadComplete) {
        const completedFiles = files
          .filter(f => f.status === 'completed' || f.id === uploadFile.id)
          .map(f => ({
            id: f.id,
            url: f.url || response.file?.id || '',
            type: f.file.type,
            name: f.file.name,
            extractedText: response.content?.text
          }))
        onUploadComplete(completedFiles)
      }

      toast.success(`${uploadFile.file.name} 업로드 완료`)
    } catch (error) {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { 
              ...f, 
              status: 'error' as const, 
              error: error instanceof Error ? error.message : '업로드 중 오류가 발생했습니다' 
            }
          : f
      ))
      toast.error(`${uploadFile.file.name} 업로드 실패`)
    }
  }

  const removeFile = (id: string) => {
    setFiles(prev => prev.filter(f => f.id !== id))
  }

  const retryUpload = (uploadFile: UploadFile) => {
    setFiles(prev => prev.map(f => 
      f.id === uploadFile.id 
        ? { ...f, status: 'pending' as const, error: undefined, progress: 0 }
        : f
    ))
    
    setTimeout(() => {
      setFiles(prev => prev.map(f => 
        f.id === uploadFile.id 
          ? { ...f, status: 'uploading' as const }
          : f
      ))
      simulateUpload(uploadFile)
    }, 100)
  }

  const handleDragEnter = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    const droppedFiles = e.dataTransfer.files
    if (droppedFiles.length > 0) {
      handleFiles(droppedFiles)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files
    if (selectedFiles && selectedFiles.length > 0) {
      handleFiles(selectedFiles)
    }
  }

  const getStatusIcon = (status: UploadFile['status']) => {
    switch (status) {
      case 'uploading':
        return <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-600" />
      default:
        return null
    }
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      <Card 
        className={`border-2 border-dashed transition-colors cursor-pointer ${
          isDragging 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <CardContent className="p-8 text-center">
          <Upload className={`w-12 h-12 mx-auto mb-4 ${
            isDragging ? 'text-blue-500' : 'text-gray-400'
          }`} />
          <h3 className="text-lg font-semibold mb-2">
            파일을 드래그하거나 클릭하여 업로드
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            최대 {maxFileSize}MB, {maxFiles}개 파일까지 지원
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {acceptedTypes.map(type => (
              <Badge key={type} variant="outline" className="text-xs">
                {type.replace('/*', '').replace('application/', '')}
              </Badge>
            ))}
          </div>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept={acceptedTypes.join(',')}
            onChange={handleFileSelect}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* File List */}
      {files.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">업로드 진행 상황</CardTitle>
            <CardDescription>
              {files.filter(f => f.status === 'completed').length} / {files.length} 완료
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <AnimatePresence>
                {files.map((uploadFile) => (
                  <motion.div
                    key={uploadFile.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-3 p-3 border rounded-lg"
                  >
                    <div className={`p-2 rounded ${getFileTypeColor(uploadFile.file)}`}>
                      {getFileIcon(uploadFile.file)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-medium truncate">{uploadFile.file.name}</p>
                        <div className="flex items-center gap-2">
                          {getStatusIcon(uploadFile.status)}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => removeFile(uploadFile.id)}
                          >
                            <X className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
                        <span>{formatFileSize(uploadFile.file.size)}</span>
                        <span>{uploadFile.status === 'uploading' ? `${uploadFile.progress}%` : uploadFile.status}</span>
                      </div>
                      
                      {uploadFile.status === 'uploading' && (
                        <Progress value={uploadFile.progress} className="h-1" />
                      )}
                      
                      {uploadFile.error && (
                        <div className="flex items-center justify-between">
                          <p className="text-xs text-red-600">{uploadFile.error}</p>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => retryUpload(uploadFile)}
                            className="text-xs h-6"
                          >
                            다시 시도
                          </Button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}