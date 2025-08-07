import { Router } from 'express';
import { 
  generateSpeech, 
  batchGenerateSpeech, 
  getAudioFile, 
  getVoices,
  deleteAudioCache,
  getCacheStats 
} from '../controllers/tts.controller';
import { auth } from '../middleware/auth';

const router = Router();

/**
 * Generate speech from text
 * POST /api/tts/generate
 */
router.post('/generate', auth, generateSpeech);

/**
 * Generate speech for multiple texts
 * POST /api/tts/batch
 */
router.post('/batch', auth, batchGenerateSpeech);

/**
 * Get audio file by cache key
 * GET /api/tts/audio/:cacheKey
 */
router.get('/audio/:cacheKey', getAudioFile);

/**
 * Get available voices
 * GET /api/tts/voices
 */
router.get('/voices', getVoices);

/**
 * Delete audio from cache
 * DELETE /api/tts/cache/:cacheKey
 */
router.delete('/cache/:cacheKey', auth, deleteAudioCache);

/**
 * Get cache statistics
 * GET /api/tts/cache/stats
 */
router.get('/cache/stats', auth, getCacheStats);

export default router;