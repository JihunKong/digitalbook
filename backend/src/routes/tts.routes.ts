import { Router } from 'express';
import { ttsService } from '../services/tts.service';
import { auth } from '../middlewares/auth.unified';
import { logger } from '../utils/logger';
import { z } from 'zod';

const router = Router();

// Validation schemas
const generateSpeechSchema = z.object({
  text: z.string().min(1).max(5000),
  voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).optional(),
  model: z.enum(['tts-1', 'tts-1-hd']).optional(),
  speed: z.number().min(0.25).max(4.0).optional(),
  language: z.enum(['ko', 'en']).optional()
});

const batchSpeechSchema = z.object({
  segments: z.array(z.object({
    id: z.string(),
    text: z.string().min(1).max(5000),
    voice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).optional()
  })).min(1).max(50),
  defaultVoice: z.enum(['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer']).optional()
});

/**
 * Generate speech from text
 * POST /api/tts/generate
 */
router.post('/generate', auth, async (req, res) => {
  try {
    const validated = generateSpeechSchema.parse(req.body);
    
    logger.info('TTS generation requested', { 
      userId: req.user?.id,
      textLength: validated.text.length 
    });

    const result = await ttsService.generateSpeech(validated.text, {
      voice: validated.voice,
      model: validated.model,
      speed: validated.speed,
      language: validated.language
    });

    res.json({
      success: true,
      data: result
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    logger.error('TTS generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate speech'
    });
  }
});

/**
 * Generate speech for multiple segments
 * POST /api/tts/batch
 */
router.post('/batch', auth, async (req, res) => {
  try {
    const validated = batchSpeechSchema.parse(req.body);
    
    logger.info('Batch TTS generation requested', { 
      userId: req.user?.id,
      segmentCount: validated.segments.length 
    });

    const results = await ttsService.generateBatchSpeech(
      validated.segments,
      validated.defaultVoice
    );

    res.json({
      success: true,
      data: results
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid request data',
        details: error.errors
      });
    }

    logger.error('Batch TTS generation failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate batch speech'
    });
  }
});

/**
 * Stream audio file
 * GET /api/tts/audio/:cacheKey
 */
router.get('/audio/:cacheKey', async (req, res) => {
  try {
    const { cacheKey } = req.params;
    
    // Validate cache key format
    if (!/^[a-f0-9]{16}$/.test(cacheKey)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid cache key'
      });
    }

    const audioStream = await ttsService.getAudioStream(cacheKey);
    
    if (!audioStream) {
      return res.status(404).json({
        success: false,
        error: 'Audio not found'
      });
    }

    // Set appropriate headers
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Cache-Control', 'public, max-age=3600');
    
    // Stream the audio
    audioStream.pipe(res);

  } catch (error) {
    logger.error('Audio streaming failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to stream audio'
    });
  }
});

/**
 * Get available voices
 * GET /api/tts/voices
 */
router.get('/voices', auth, (req, res) => {
  const voices = ttsService.getAvailableVoices();
  
  res.json({
    success: true,
    data: voices
  });
});

/**
 * Clean up old cache files (admin only)
 * POST /api/tts/cleanup
 */
router.post('/cleanup', auth, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user?.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: 'Admin access required'
      });
    }

    const maxAgeHours = req.body.maxAgeHours || 24;
    const deletedCount = await ttsService.cleanupCache(maxAgeHours);

    logger.info('TTS cache cleanup completed', { 
      adminId: req.user.id,
      deletedCount 
    });

    res.json({
      success: true,
      data: {
        deletedFiles: deletedCount
      }
    });

  } catch (error) {
    logger.error('Cache cleanup failed:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to cleanup cache'
    });
  }
});

export default router;