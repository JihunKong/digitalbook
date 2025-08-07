import { Router } from 'express';
import { 
  generateSpeech, 
  batchGenerateSpeech, 
  getAudioFile, 
  getVoices,
  deleteAudioCache,
  getCacheStats 
} from '../controllers/tts.controller';
import { auth } from '../middlewares/auth';

const router = Router();

/**
 * Generate speech from text
 * POST /api/tts/generate
 */
router.post('/generate', generateSpeech);

/**
 * Generate speech for multiple texts
 * POST /api/tts/batch
 */
router.post('/batch', batchGenerateSpeech);

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
router.delete('/cache/:cacheKey', deleteAudioCache);

/**
 * Get cache statistics
 * GET /api/tts/cache/stats
 */
router.get('/cache/stats', getCacheStats);

export default router;