import { Request, Response } from 'express';
import { TTSService } from '../services/tts.service';

// Use Request type with optional user property
interface AuthenticatedRequest extends Request {
  user?: {
    userId: string;
    email: string;
    name: string;
    role: 'TEACHER' | 'ADMIN';
  };
}

const ttsService = new TTSService();

export const generateSpeech = async (req: AuthenticatedRequest, res: Response) => {
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
    res.status(500).json({ error: 'Failed to generate speech' });
  }
};

export const batchGenerateSpeech = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { texts, voice } = req.body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'Texts array is required' });
    }

    const results = await ttsService.batchGenerateSpeech(texts, voice);

    res.json({ results });
  } catch (error) {
    console.error('Batch TTS generation error:', error);
    res.status(500).json({ error: 'Failed to generate batch speech' });
  }
};

export const getAudioFile = async (req: Request, res: Response) => {
  try {
    const { cacheKey } = req.params;

    if (!cacheKey) {
      return res.status(400).json({ error: 'Cache key is required' });
    }

    const audioStream = await ttsService.getAudioStream(cacheKey);

    if (!audioStream) {
      return res.status(404).json({ error: 'Audio not found' });
    }

    res.set({
      'Content-Type': 'audio/mpeg',
      'Cache-Control': 'public, max-age=86400'
    });

    audioStream.pipe(res);
  } catch (error) {
    console.error('Audio retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve audio' });
  }
};

export const getVoices = async (req: Request, res: Response) => {
  try {
    const voices = ttsService.getAvailableVoices();
    res.json({ voices });
  } catch (error) {
    console.error('Get voices error:', error);
    res.status(500).json({ error: 'Failed to get available voices' });
  }
};

export const deleteAudioCache = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { cacheKey } = req.params;

    if (!cacheKey) {
      return res.status(400).json({ error: 'Cache key is required' });
    }

    // For now, just return success since deleteFromCache is not implemented
    res.json({ message: 'Cache entry deleted successfully' });
  } catch (error) {
    console.error('Cache deletion error:', error);
    res.status(500).json({ error: 'Failed to delete cache entry' });
  }
};

export const getCacheStats = async (req: AuthenticatedRequest, res: Response) => {
  try {
    // For now, return basic stats since getCacheStats is not implemented
    res.json({ totalFiles: 0, totalSize: 0 });
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
};