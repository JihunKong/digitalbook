import { Request, Response } from 'express';
import { TTSService } from '../services/tts.service';
import { AuthRequest } from '../middleware/auth';

const ttsService = new TTSService();

export const generateSpeech = async (req: AuthRequest, res: Response) => {
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

export const batchGenerateSpeech = async (req: AuthRequest, res: Response) => {
  try {
    const { texts, voice, model, speed, language } = req.body;

    if (!texts || !Array.isArray(texts) || texts.length === 0) {
      return res.status(400).json({ error: 'Texts array is required' });
    }

    const results = await ttsService.batchGenerateSpeech(texts, {
      voice,
      model,
      speed,
      language
    });

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

    const audioBuffer = await ttsService.getAudioFromCache(cacheKey);

    if (!audioBuffer) {
      return res.status(404).json({ error: 'Audio not found' });
    }

    res.set({
      'Content-Type': 'audio/mpeg',
      'Content-Length': audioBuffer.length.toString(),
      'Cache-Control': 'public, max-age=86400'
    });

    res.send(audioBuffer);
  } catch (error) {
    console.error('Audio retrieval error:', error);
    res.status(500).json({ error: 'Failed to retrieve audio' });
  }
};

export const getVoices = async (req: Request, res: Response) => {
  try {
    const voices = await ttsService.getAvailableVoices();
    res.json({ voices });
  } catch (error) {
    console.error('Get voices error:', error);
    res.status(500).json({ error: 'Failed to get available voices' });
  }
};

export const deleteAudioCache = async (req: AuthRequest, res: Response) => {
  try {
    const { cacheKey } = req.params;

    if (!cacheKey) {
      return res.status(400).json({ error: 'Cache key is required' });
    }

    const success = await ttsService.deleteFromCache(cacheKey);

    if (!success) {
      return res.status(404).json({ error: 'Cache entry not found' });
    }

    res.json({ message: 'Cache entry deleted successfully' });
  } catch (error) {
    console.error('Cache deletion error:', error);
    res.status(500).json({ error: 'Failed to delete cache entry' });
  }
};

export const getCacheStats = async (req: AuthRequest, res: Response) => {
  try {
    const stats = await ttsService.getCacheStats();
    res.json(stats);
  } catch (error) {
    console.error('Cache stats error:', error);
    res.status(500).json({ error: 'Failed to get cache stats' });
  }
};