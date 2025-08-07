# Multimedia API Documentation

## Overview
The Multimedia API provides endpoints for uploading, managing, and serving various file types including images, videos, PDFs, and documents.

## Endpoints

### 1. Upload Files
**POST** `/api/multimedia/upload`

Upload one or multiple files (up to 10 files at once).

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: multipart/form-data`

**Form Data:**
- `files[]`: File(s) to upload (required)
- `textbookId`: UUID of associated textbook (optional)
- `classId`: UUID of associated class (optional)

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "id": "uuid",
      "filename": "processed-filename.jpg",
      "originalName": "original-filename.jpg",
      "mimeType": "image/jpeg",
      "size": 1024000,
      "url": "/uploads/multimedia/image/processed-filename.jpg",
      "type": "IMAGE",
      "userId": "user-uuid",
      "textbookId": "textbook-uuid",
      "classId": null,
      "metadata": {
        "thumbnailUrl": null,
        "uploadedAt": "2024-01-01T00:00:00.000Z"
      },
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ]
}
```

### 2. Get Media Library
**GET** `/api/multimedia/library`

Get paginated list of user's uploaded media files.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Query Parameters:**
- `type`: Filter by media type (IMAGE, VIDEO, PDF, DOCUMENT, OTHER)
- `textbookId`: Filter by textbook UUID
- `classId`: Filter by class UUID
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "uuid",
      "filename": "file.jpg",
      "originalName": "original.jpg",
      "mimeType": "image/jpeg",
      "size": 1024000,
      "url": "/uploads/multimedia/image/file.jpg",
      "type": "IMAGE",
      "user": {
        "id": "user-uuid",
        "name": "User Name",
        "email": "user@example.com"
      },
      "textbook": {
        "id": "textbook-uuid",
        "title": "Textbook Title"
      },
      "class": null,
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 3. Get Single Media File
**GET** `/api/multimedia/:id`

Get details of a specific media file.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "filename": "file.jpg",
    "originalName": "original.jpg",
    "mimeType": "image/jpeg",
    "size": 1024000,
    "url": "/uploads/multimedia/image/file.jpg",
    "type": "IMAGE",
    "user": {
      "id": "user-uuid",
      "name": "User Name",
      "email": "user@example.com"
    },
    "textbook": null,
    "class": null,
    "metadata": {},
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### 4. Update Media File
**PATCH** `/api/multimedia/:id`

Update metadata of a media file.

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Body:**
```json
{
  "originalName": "new-name.jpg",
  "textbookId": "textbook-uuid",
  "classId": null,
  "metadata": {
    "description": "Updated description"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    // Updated media object
  }
}
```

### 5. Delete Media File
**DELETE** `/api/multimedia/:id`

Delete a media file.

**Headers:**
- `Authorization: Bearer <token>` (required)

**Response:** 204 No Content

### 6. Bulk Delete Media Files
**POST** `/api/multimedia/bulk-delete`

Delete multiple media files at once.

**Headers:**
- `Authorization: Bearer <token>` (required)
- `Content-Type: application/json`

**Body:**
```json
{
  "ids": ["uuid1", "uuid2", "uuid3"]
}
```

**Response:**
```json
{
  "success": true,
  "deleted": 3
}
```

## Supported File Types

### Images
- JPEG/JPG (`image/jpeg`)
- PNG (`image/png`)
- GIF (`image/gif`)
- WebP (`image/webp`)
- SVG (`image/svg+xml`)

### Videos
- MP4 (`video/mp4`)
- WebM (`video/webm`)
- OGG (`video/ogg`)
- MOV (`video/quicktime`)

### Documents
- PDF (`application/pdf`)
- DOC (`application/msword`)
- DOCX (`application/vnd.openxmlformats-officedocument.wordprocessingml.document`)
- XLS (`application/vnd.ms-excel`)
- XLSX (`application/vnd.openxmlformats-officedocument.spreadsheetml.sheet`)
- PPT (`application/vnd.ms-powerpoint`)
- PPTX (`application/vnd.openxmlformats-officedocument.presentationml.presentation`)

### Text
- TXT (`text/plain`)
- CSV (`text/csv`)
- Markdown (`text/markdown`)

## File Size Limits
- Maximum file size: 100MB per file
- Maximum files per upload: 10 files

## Image Processing
Images are automatically optimized:
- Maximum dimensions: 2000x2000 pixels
- Format: JPEG with 90% quality
- Progressive encoding enabled

## File Storage
- Files are stored in `/uploads/multimedia/{type}/` directory
- Files are organized by media type (image, video, pdf, document, other)
- Static files are served with 7-day cache headers

## Error Codes
- `400`: Bad Request (no files uploaded, invalid file type, file too large)
- `401`: Unauthorized (missing or invalid token)
- `404`: Not Found (media file not found)
- `413`: Payload Too Large (file exceeds size limit)
- `500`: Internal Server Error

## Frontend Integration Example

```javascript
// Upload files
const uploadFiles = async (files, textbookId) => {
  const formData = new FormData();
  
  files.forEach(file => {
    formData.append('files', file);
  });
  
  if (textbookId) {
    formData.append('textbookId', textbookId);
  }
  
  const response = await fetch('/api/multimedia/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: formData
  });
  
  return response.json();
};

// Get media library
const getMediaLibrary = async (filters = {}) => {
  const params = new URLSearchParams(filters);
  
  const response = await fetch(`/api/multimedia/library?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  
  return response.json();
};
```