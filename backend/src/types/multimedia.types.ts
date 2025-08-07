export interface UploadedFile {
  id: string;
  filename: string;
  originalName: string;
  mimeType: string;
  size: number;
  url: string;
  type: 'IMAGE' | 'VIDEO' | 'PDF' | 'DOCUMENT' | 'OTHER';
  userId: string;
  textbookId?: string | null;
  classId?: string | null;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface MediaLibraryQuery {
  type?: 'IMAGE' | 'VIDEO' | 'PDF' | 'DOCUMENT' | 'OTHER';
  textbookId?: string;
  classId?: string;
  page?: number;
  limit?: number;
}

export interface MediaUploadOptions {
  textbookId?: string;
  classId?: string;
  metadata?: Record<string, any>;
}

export interface MediaUpdateOptions {
  originalName?: string;
  textbookId?: string | null;
  classId?: string | null;
  metadata?: Record<string, any>;
}