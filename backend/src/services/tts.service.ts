import OpenAI from 'openai';
import { logger } from '../utils/logger';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

/**
 * Text-to-Speech Service using OpenAI's TTS API
 * Provides high-quality voice synthesis for educational content
 */
export class TTSService {
  private openai: OpenAI | null;
  private cacheDir: string;
  private mockMode: boolean;

  constructor() {
    this.mockMode = !process.env.OPENAI_API_KEY;
    
    if (this.mockMode) {
      logger.warn('OpenAI API key not found for TTS. Running in mock mode.');
      this.openai = null;
    } else {
      this.openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });
    }
    
    // Create cache directory for audio files
    this.cacheDir = path.join(process.cwd(), 'uploads', 'tts-cache');
    if (!fs.existsSync(this.cacheDir)) {
      fs.mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Batch generate speech for multiple texts
   * @param texts - Array of texts to convert
   * @param voice - Voice option
   */
  async batchGenerateSpeech(
    texts: string[],
    voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer'
  ) {
    const results = [];
    for (const text of texts) {
      try {
        const result = await this.generateSpeech(text, { voice });
        results.push({ success: true, ...result });
      } catch (error) {
        logger.error('Failed to generate speech for text:', error);
        results.push({ success: false, error: 'Failed to generate speech' });
      }
    }
    return results;
  }

  /**
   * Generate speech from text using OpenAI TTS
   * @param text - Text to convert to speech
   * @param options - Voice options
   */
  async generateSpeech(
    text: string,
    options: {
      voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
      model?: 'tts-1' | 'tts-1-hd';
      speed?: number; // 0.25 to 4.0
      language?: 'ko' | 'en';
    } = {}
  ) {
    try {
      const {
        voice = 'nova', // Default to nova for natural female voice
        model = 'tts-1-hd', // Use HD model for better quality
        speed = 1.0,
        language = 'ko'
      } = options;

      // Generate cache key
      const cacheKey = this.generateCacheKey(text, options);
      const cachedFile = path.join(this.cacheDir, `${cacheKey}.mp3`);

      // Check if cached version exists
      if (fs.existsSync(cachedFile)) {
        logger.info('TTS: Using cached audio file', { cacheKey });
        return {
          audioUrl: `/api/tts/audio/${cacheKey}`,
          cached: true,
          duration: await this.getAudioDuration(cachedFile)
        };
      }

      // Check if in mock mode
      if (this.mockMode) {
        logger.info('TTS: Mock mode - returning placeholder');
        return {
          audioUrl: '/api/tts/mock-audio',
          cached: false,
          duration: Math.ceil(text.length / 10), // Rough estimate
          mockMode: true
        };
      }

      // Generate new audio
      logger.info('TTS: Generating new audio', { 
        textLength: text.length, 
        voice, 
        model,
        language 
      });

      const response = await this.openai!.audio.speech.create({
        model,
        voice,
        input: text,
        speed,
        response_format: 'mp3'
      });

      // Save to cache
      const buffer = Buffer.from(await response.arrayBuffer());
      fs.writeFileSync(cachedFile, buffer);

      // Calculate duration (approximate)
      const duration = this.estimateDuration(text, speed);

      logger.info('TTS: Audio generated successfully', { 
        cacheKey,
        fileSize: buffer.length,
        duration 
      });

      return {
        audioUrl: `/api/tts/audio/${cacheKey}`,
        cached: false,
        duration
      };

    } catch (error) {
      logger.error('TTS generation failed:', error);
      throw new Error('Failed to generate speech');
    }
  }

  /**
   * Generate speech for multiple text segments
   * Useful for textbook chapters with multiple paragraphs
   */
  async generateBatchSpeech(
    segments: Array<{
      id: string;
      text: string;
      voice?: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';
    }>,
    defaultVoice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova'
  ) {
    const results = [];

    for (const segment of segments) {
      try {
        const result = await this.generateSpeech(segment.text, {
          voice: segment.voice || defaultVoice
        });
        
        results.push({
          id: segment.id,
          ...result
        });

        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 500));
      } catch (error) {
        logger.error(`TTS: Failed for segment ${segment.id}:`, error);
        results.push({
          id: segment.id,
          error: 'Failed to generate audio'
        });
      }
    }

    return results;
  }

  /**
   * Stream audio file from cache
   */
  async getAudioStream(cacheKey: string): Promise<fs.ReadStream | null> {
    const filePath = path.join(this.cacheDir, `${cacheKey}.mp3`);
    
    if (!fs.existsSync(filePath)) {
      return null;
    }

    return fs.createReadStream(filePath);
  }

  /**
   * Clean up old cache files
   */
  async cleanupCache(maxAgeHours: number = 24) {
    const now = Date.now();
    const maxAge = maxAgeHours * 60 * 60 * 1000;

    const files = fs.readdirSync(this.cacheDir);
    let deletedCount = 0;

    for (const file of files) {
      const filePath = path.join(this.cacheDir, file);
      const stats = fs.statSync(filePath);
      
      if (now - stats.mtimeMs > maxAge) {
        fs.unlinkSync(filePath);
        deletedCount++;
      }
    }

    logger.info(`TTS: Cleaned up ${deletedCount} old cache files`);
    return deletedCount;
  }

  /**
   * Generate cache key for text and options
   */
  private generateCacheKey(text: string, options: any): string {
    const hash = crypto.createHash('sha256');
    hash.update(text);
    hash.update(JSON.stringify(options));
    return hash.digest('hex').substring(0, 16);
  }

  /**
   * Estimate audio duration based on text length and speed
   */
  private estimateDuration(text: string, speed: number): number {
    // Average speaking rate: 150 words per minute
    // Korean: ~350 characters per minute
    const charactersPerSecond = 350 / 60;
    const adjustedRate = charactersPerSecond * speed;
    return Math.ceil(text.length / adjustedRate);
  }

  /**
   * Get actual audio duration (requires ffmpeg)
   */
  private async getAudioDuration(filePath: string): Promise<number> {
    // This would require ffmpeg or similar tool
    // For now, return estimate
    const stats = fs.statSync(filePath);
    // Rough estimate: 128kbps MP3 ≈ 16KB per second
    return Math.ceil(stats.size / 16000);
  }

  /**
   * Get available voices with descriptions
   */
  getAvailableVoices() {
    return [
      { id: 'alloy', name: 'Alloy', description: '중성적이고 균형잡힌 목소리' },
      { id: 'echo', name: 'Echo', description: '남성, 차분하고 깊은 목소리' },
      { id: 'fable', name: 'Fable', description: '영국식 억양의 남성 목소리' },
      { id: 'onyx', name: 'Onyx', description: '깊고 권위있는 남성 목소리' },
      { id: 'nova', name: 'Nova', description: '젊고 활기찬 여성 목소리' },
      { id: 'shimmer', name: 'Shimmer', description: '부드럽고 따뜻한 여성 목소리' }
    ];
  }
}