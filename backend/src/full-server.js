const express = require('express');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');
const OpenAI = require('openai');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
require('dotenv').config();

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: ['http://localhost:3000', 'https://xn--220bu63c.com'],
  credentials: true
}));
app.use(express.json());

// JWT Secret - Must be set via environment variables
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

if (!JWT_SECRET || !JWT_REFRESH_SECRET) {
  console.error('FATAL: JWT_SECRET and JWT_REFRESH_SECRET must be set in environment variables');
  console.error('Please set these in your .env file with strong, random values');
  process.exit(1);
}

// TTS Service
class TTSService {
  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
    
    // Create cache directory for audio files
    this.cacheDir = path.join(process.cwd(), 'uploads', 'tts-cache');
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  generateCacheKey(text, options) {
    const hash = crypto.createHash('md5');
    hash.update(text + JSON.stringify(options));
    return hash.digest('hex');
  }

  async generateSpeech(text, options = {}) {
    try {
      const {
        voice = 'nova',
        model = 'tts-1-hd',
        speed = 1.0,
        language = 'ko'
      } = options;

      // Generate cache key
      const cacheKey = this.generateCacheKey(text, options);
      const cachedFile = path.join(this.cacheDir, `${cacheKey}.mp3`);

      // Check if cached version exists
      if (fs.existsSync(cachedFile)) {
        console.log('TTS: Using cached audio file', cacheKey);
        return {
          audioUrl: `/api/tts/audio/${cacheKey}`,
          cached: true,
          duration: 0
        };
      }

      // Generate new audio
      console.log('TTS: Generating new audio');
      const response = await this.openai.audio.speech.create({
        model,
        voice,
        input: text,
        speed,
        response_format: 'mp3'
      });

      // Save to cache
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(cachedFile, buffer);

      return {
        audioUrl: `/api/tts/audio/${cacheKey}`,
        cached: false,
        duration: 0
      };

    } catch (error) {
      console.error('TTS generation failed:', error);
      throw new Error('Failed to generate speech');
    }
  }

  getAvailableVoices() {
    return [
      { id: 'alloy', name: 'Alloy', gender: 'neutral' },
      { id: 'echo', name: 'Echo', gender: 'male' },
      { id: 'fable', name: 'Fable', gender: 'neutral' },
      { id: 'onyx', name: 'Onyx', gender: 'male' },
      { id: 'nova', name: 'Nova', gender: 'female' },
      { id: 'shimmer', name: 'Shimmer', gender: 'female' }
    ];
  }
}

// Initialize TTS service
const ttsService = new TTSService();

// Authentication middleware
const authenticate = async (req, res, next) => {
  try {
    // More flexible token extraction
    const authHeader = req.headers.authorization;
    let token = null;
    
    if (authHeader) {
      // First trim the entire header
      const trimmedHeader = authHeader.trim();
      
      // Check if it starts with "Bearer" (case-insensitive)
      const bearerMatch = trimmedHeader.match(/^bearer\s+(.+)$/i);
      if (bearerMatch) {
        token = bearerMatch[1].trim();
      } else {
        // Assume it's just the token without "Bearer" prefix
        token = trimmedHeader;
      }
    }
    
    if (!token) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Get fresh user data
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid authentication' });
    }

    req.user = {
      userId: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    };
    
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
};

// Authorization middleware
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }
    
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }
    
    next();
  };
};

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ==================== TTS ENDPOINTS ====================

// Generate speech from text
app.post('/api/tts/generate', async (req, res) => {
  try {
    const { text, voice, model, speed, language } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const result = await ttsService.generateSpeech(text, {
      voice,
      model,
      speed,
      language
    });

    res.json(result);
  } catch (error) {
    console.error('TTS generation error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate speech' });
  }
});

// Get audio file by cache key
app.get('/api/tts/audio/:cacheKey', (req, res) => {
  try {
    const { cacheKey } = req.params;
    const cacheDir = path.join(process.cwd(), 'uploads', 'tts-cache');
    const audioFile = path.join(cacheDir, `${cacheKey}.mp3`);

    if (!fs.existsSync(audioFile)) {
      return res.status(404).json({ error: 'Audio not found' });
    }

    res.set({
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=86400'
    });

    fs.createReadStream(audioFile).pipe(res);
  } catch (error) {
    console.error('Audio retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve audio' });
  }
});

// Get available voices
app.get('/api/tts/voices', (req, res) => {
  try {
    const voices = ttsService.getAvailableVoices();
    res.json({ voices });
  } catch (error) {
    console.error('Get voices error:', error);
    res.status(500).json({ error: 'Failed to get available voices' });
  }
});

// ==================== AUTH ENDPOINTS ====================

// Login endpoint
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        teacherProfile: true,
        studentProfile: true
      }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const accessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    res.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        avatar: user.avatar,
        isActive: user.isActive,
        teacherProfile: user.teacherProfile,
        studentProfile: user.studentProfile
      },
      accessToken,
      refreshToken
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Refresh token endpoint
app.post('/api/auth/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(400).json({ error: 'Refresh token required' });
    }

    const decoded = jwt.verify(refreshToken, JWT_REFRESH_SECRET);
    
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid refresh token' });
    }

    const newAccessToken = jwt.sign(
      { id: user.id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    console.error('Refresh error:', error);
    res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// ==================== TEXTBOOK ENDPOINTS ====================

// Get all textbooks
app.get('/api/textbooks', authenticate, async (req, res) => {
  try {
    const { role, userId } = req.user;
    
    let textbooks;
    if (role === 'TEACHER') {
      // First get the teacher profile
      const teacherProfile = await prisma.teacherProfile.findUnique({
        where: { userId }
      });
      
      if (!teacherProfile) {
        return res.json([]);
      }
      
      // Teachers see their own textbooks
      textbooks = await prisma.textbook.findMany({
        where: { authorId: teacherProfile.id },
        include: {
          author: {
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          },
          classes: {
            include: {
              class: true
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (role === 'STUDENT') {
      // Students see textbooks from their enrolled classes  
      const enrollments = await prisma.classEnrollment.findMany({
        where: { studentId: userId },
        select: { classId: true }
      });
      
      const classIds = enrollments.map(e => e.classId);
      
      textbooks = await prisma.textbook.findMany({
        where: {
          classes: {
            some: {
              classId: { in: classIds }
            }
          },
          isPublic: true
        },
        include: {
          author: {
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else {
      // Admin sees all textbooks
      textbooks = await prisma.textbook.findMany({
        include: {
          author: {
            include: {
              user: {
                select: { name: true, email: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }
    
    res.json(textbooks);
  } catch (error) {
    console.error('Get textbooks error:', error);
    res.status(500).json({ error: 'Failed to fetch textbooks' });
  }
});

// Get single textbook
app.get('/api/textbooks/:id', authenticate, async (req, res) => {
  try {
    const { id } = req.params;
    
    const textbook = await prisma.textbook.findUnique({
      where: { id },
      include: {
        author: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        },
        pages: {
          orderBy: { pageNumber: 'asc' }
        },
        classes: {
          include: {
            class: true
          }
        }
      }
    });
    
    if (!textbook) {
      return res.status(404).json({ error: 'Textbook not found' });
    }
    
    res.json(textbook);
  } catch (error) {
    console.error('Get textbook error:', error);
    res.status(500).json({ error: 'Failed to fetch textbook' });
  }
});

// Create textbook
app.post('/api/textbooks', authenticate, authorize('TEACHER'), async (req, res) => {
  try {
    const { title, description, content, metadata, aiGenerated, aiModel, aiPrompt } = req.body;
    const { userId } = req.user;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    // Get or create teacher profile
    let teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId }
    });
    
    if (!teacherProfile) {
      // Create teacher profile if it doesn't exist
      teacherProfile = await prisma.teacherProfile.create({
        data: {
          userId,
          school: '',
          subject: '',
          grade: '',
          bio: ''
        }
      });
    }
    
    const textbook = await prisma.textbook.create({
      data: {
        title,
        description: description || '',
        authorId: teacherProfile.id,
        content: content || {},
        metadata: metadata || {},
        aiGenerated: aiGenerated || false,
        aiModel: aiModel || null,
        aiPrompt: aiPrompt || null,
        isPublic: false
      },
      include: {
        author: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });
    
    res.status(201).json(textbook);
  } catch (error) {
    console.error('Create textbook error:', error);
    res.status(500).json({ error: 'Failed to create textbook' });
  }
});

// Update textbook
app.put('/api/textbooks/:id', authenticate, authorize('TEACHER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    const { title, description, content, metadata, isPublic } = req.body;
    
    // Get teacher profile
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId }
    });
    
    if (!teacherProfile) {
      return res.status(403).json({ error: 'Teacher profile not found' });
    }
    
    // Check ownership
    const existing = await prisma.textbook.findUnique({
      where: { id },
      select: { authorId: true }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Textbook not found' });
    }
    
    if (existing.authorId !== teacherProfile.id) {
      return res.status(403).json({ error: 'You can only edit your own textbooks' });
    }
    
    const textbook = await prisma.textbook.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(content !== undefined && { content }),
        ...(metadata !== undefined && { metadata }),
        ...(isPublic !== undefined && { isPublic })
      },
      include: {
        author: {
          include: {
            user: {
              select: { name: true, email: true }
            }
          }
        }
      }
    });
    
    res.json(textbook);
  } catch (error) {
    console.error('Update textbook error:', error);
    res.status(500).json({ error: 'Failed to update textbook' });
  }
});

// Delete textbook
app.delete('/api/textbooks/:id', authenticate, authorize('TEACHER'), async (req, res) => {
  try {
    const { id } = req.params;
    const { userId } = req.user;
    
    // Get teacher profile
    const teacherProfile = await prisma.teacherProfile.findUnique({
      where: { userId }
    });
    
    if (!teacherProfile) {
      return res.status(403).json({ error: 'Teacher profile not found' });
    }
    
    // Check ownership
    const existing = await prisma.textbook.findUnique({
      where: { id },
      select: { authorId: true }
    });
    
    if (!existing) {
      return res.status(404).json({ error: 'Textbook not found' });
    }
    
    if (existing.authorId !== teacherProfile.id) {
      return res.status(403).json({ error: 'You can only delete your own textbooks' });
    }
    
    await prisma.textbook.delete({
      where: { id }
    });
    
    res.json({ message: 'Textbook deleted successfully' });
  } catch (error) {
    console.error('Delete textbook error:', error);
    res.status(500).json({ error: 'Failed to delete textbook' });
  }
});

// ==================== USER ENDPOINTS ====================

// Get current user
app.get('/api/users/me', authenticate, async (req, res) => {
  try {
    const { userId } = req.user;
    
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        isActive: true,
        teacherProfile: true,
        studentProfile: true,
        createdAt: true,
        lastLoginAt: true
      }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// ==================== CLASS ENDPOINTS ====================

// Get all classes
app.get('/api/classes', authenticate, async (req, res) => {
  try {
    const { role, userId } = req.user;
    
    let classes;
    if (role === 'TEACHER') {
      classes = await prisma.class.findMany({
        where: { teacherId: userId },
        include: {
          teacher: {
            select: { name: true }
          },
          _count: {
            select: { enrollments: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    } else if (role === 'STUDENT') {
      const enrollments = await prisma.classEnrollment.findMany({
        where: { studentId: userId },
        include: {
          class: {
            include: {
              teacher: {
                select: { name: true }
              },
              _count: {
                select: { enrollments: true }
              }
            }
          }
        },
        orderBy: { enrolledAt: 'desc' }
      });
      
      classes = enrollments.map(e => e.class);
    } else {
      classes = await prisma.class.findMany({
        include: {
          teacher: {
            select: { name: true }
          },
          _count: {
            select: { enrollments: true }
          }
        },
        orderBy: { createdAt: 'desc' }
      });
    }
    
    res.json(classes);
  } catch (error) {
    console.error('Get classes error:', error);
    res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Full server running on port ${PORT}`);
  console.log('Available endpoints:');
  console.log('  - GET    /api/health');
  console.log('  - POST   /api/tts/generate');
  console.log('  - GET    /api/tts/audio/:cacheKey');
  console.log('  - GET    /api/tts/voices');
  console.log('  - POST   /api/auth/login');
  console.log('  - POST   /api/auth/refresh');
  console.log('  - GET    /api/textbooks');
  console.log('  - GET    /api/textbooks/:id');
  console.log('  - POST   /api/textbooks');
  console.log('  - PUT    /api/textbooks/:id');
  console.log('  - DELETE /api/textbooks/:id');
  console.log('  - GET    /api/users/me');
  console.log('  - GET    /api/classes');
});