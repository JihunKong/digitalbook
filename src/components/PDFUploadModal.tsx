'use client'

import { useState, useRef } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select'
import { Alert, AlertDescription } from './ui/alert'
import { Upload, FileText, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { apiClient } from '@/lib/api'

interface PDFUploadModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess?: (pdfId: string) => void
  classes?: Array<{ id: string; name: string }>
}

export function PDFUploadModal({ isOpen, onClose, onSuccess, classes = [] }: PDFUploadModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [selectedClassId, setSelectedClassId] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'processing' | 'generating' | 'success' | 'error'>('idle')
  const [errorMessage, setErrorMessage] = useState('')
  const [pdfId, setPdfId] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file)
      setErrorMessage('')
    } else {
      setErrorMessage('PDF 파일만 업로드 가능합니다.')
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !selectedClassId) {
      setErrorMessage('파일과 학급을 선택해주세요.')
      return
    }

    setIsUploading(true)
    setUploadStatus('uploading')
    setErrorMessage('')

    try {
      // Debug: Log file details
      console.log('Selected file:', {
        name: selectedFile.name,
        type: selectedFile.type,
        size: selectedFile.size
      })
      console.log('Selected class ID:', selectedClassId)
      
      // Upload PDF
      const uploadResponse = await apiClient.uploadPDF(selectedFile, selectedClassId)
      
      if (uploadResponse.error) {
        throw new Error(uploadResponse.error.message)
      }

      const uploadedPdfId = uploadResponse.data.id
      setPdfId(uploadedPdfId)
      setUploadStatus('processing')

      // Wait for processing
      await new Promise(resolve => setTimeout(resolve, 2000))
      setUploadStatus('generating')

      // Generate activities
      const activitiesResponse = await apiClient.generateActivities(uploadedPdfId, true)
      
      if (activitiesResponse.error) {
        throw new Error(activitiesResponse.error.message)
      }

      setUploadStatus('success')
      
      // Call success callback
      if (onSuccess) {
        onSuccess(uploadedPdfId)
      }

      // Close modal after 2 seconds
      setTimeout(() => {
        handleClose()
      }, 2000)

    } catch (error) {
      console.error('Upload error:', error)
      setUploadStatus('error')
      setErrorMessage(error instanceof Error ? error.message : 'PDF 업로드 중 오류가 발생했습니다.')
    } finally {
      setIsUploading(false)
    }
  }

  const handleClose = () => {
    setSelectedFile(null)
    setSelectedClassId('')
    setUploadStatus('idle')
    setErrorMessage('')
    setPdfId(null)
    onClose()
  }

  const getStatusMessage = () => {
    switch (uploadStatus) {
      case 'uploading':
        return 'PDF 파일을 업로드하고 있습니다...'
      case 'processing':
        return 'PDF 내용을 분석하고 있습니다...'
      case 'generating':
        return 'AI가 학습 활동을 생성하고 있습니다...'
      case 'success':
        return 'PDF 업로드가 완료되었습니다!'
      default:
        return ''
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>PDF 교과서 업로드</DialogTitle>
          <DialogDescription>
            PDF 파일을 업로드하면 AI가 자동으로 내용을 분석하고 학습 활동을 생성합니다.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Class Selection */}
          <div className="space-y-2">
            <Label htmlFor="class">학급 선택</Label>
            <Select value={selectedClassId} onValueChange={setSelectedClassId} disabled={isUploading}>
              <SelectTrigger id="class">
                <SelectValue placeholder="학급을 선택하세요" />
              </SelectTrigger>
              <SelectContent>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* File Upload */}
          <div className="space-y-2">
            <Label htmlFor="pdf">PDF 파일</Label>
            <div className="flex items-center gap-2">
              <Input
                ref={fileInputRef}
                id="pdf"
                type="file"
                accept=".pdf"
                onChange={handleFileChange}
                disabled={isUploading}
                className="hidden"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="w-full"
              >
                <Upload className="w-4 h-4 mr-2" />
                {selectedFile ? selectedFile.name : 'PDF 파일 선택'}
              </Button>
            </div>
          </div>

          {/* Status Messages */}
          {uploadStatus !== 'idle' && (
            <Alert className={uploadStatus === 'error' ? 'border-red-500' : uploadStatus === 'success' ? 'border-green-500' : ''}>
              <div className="flex items-center gap-2">
                {uploadStatus === 'error' && <XCircle className="w-4 h-4 text-red-500" />}
                {uploadStatus === 'success' && <CheckCircle className="w-4 h-4 text-green-500" />}
                {['uploading', 'processing', 'generating'].includes(uploadStatus) && (
                  <Loader2 className="w-4 h-4 animate-spin" />
                )}
                <AlertDescription>{getStatusMessage()}</AlertDescription>
              </div>
            </Alert>
          )}

          {/* Error Message */}
          {errorMessage && (
            <Alert className="border-red-500">
              <XCircle className="w-4 h-4 text-red-500" />
              <AlertDescription className="text-red-600">{errorMessage}</AlertDescription>
            </Alert>
          )}

          {/* File Preview */}
          {selectedFile && (
            <div className="bg-gray-50 rounded-lg p-3 flex items-center gap-3">
              <FileText className="w-8 h-8 text-gray-400" />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} disabled={isUploading}>
            취소
          </Button>
          <Button onClick={handleUpload} disabled={!selectedFile || !selectedClassId || isUploading}>
            {isUploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                처리 중...
              </>
            ) : (
              '업로드'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}