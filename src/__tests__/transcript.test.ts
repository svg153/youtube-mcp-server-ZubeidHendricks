/**
 * Tests for TranscriptService — unit tests with mocked youtube-transcript
 */

import { TranscriptService } from '../../src/services/transcript.js';

// Mock youtube-transcript
const mockFetchTranscript = jest.fn();

jest.mock('youtube-transcript', () => ({
  YoutubeTranscript: {
    fetchTranscript: mockFetchTranscript,
  },
}));

describe('TranscriptService', () => {
  let service: TranscriptService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new TranscriptService();
  });

  describe('getTranscript', () => {
    it('should return transcript with default language', async () => {
      const mockTranscript = [
        { text: 'Hello world', offset: 0, duration: 3000 },
        { text: 'This is a test', offset: 3000, duration: 2500 },
      ];
      mockFetchTranscript.mockResolvedValueOnce(mockTranscript);

      const result = await service.getTranscript({ videoId: 'test123' });

      expect(result).toEqual({
        videoId: 'test123',
        language: 'en',
        transcript: mockTranscript,
      });
      expect(mockFetchTranscript).toHaveBeenCalledWith('test123');
    });

    it('should use custom language', async () => {
      const mockTranscript = [{ text: 'Hola mundo', offset: 0, duration: 3000 }];
      mockFetchTranscript.mockResolvedValueOnce(mockTranscript);

      const result = await service.getTranscript({
        videoId: 'test123',
        language: 'es',
      });

      expect(result.language).toBe('es');
    });

    it('should use YOUTUBE_TRANSCRIPT_LANG env var', async () => {
      process.env.YOUTUBE_TRANSCRIPT_LANG = 'fr';
      const mockTranscript = [{ text: 'Bonjour', offset: 0, duration: 3000 }];
      mockFetchTranscript.mockResolvedValueOnce(mockTranscript);

      const result = await service.getTranscript({ videoId: 'test123' });

      expect(result.language).toBe('fr');
      delete process.env.YOUTUBE_TRANSCRIPT_LANG;
    });

    it('should throw error on failed fetch', async () => {
      mockFetchTranscript.mockRejectedValueOnce(new Error('Video not found'));

      await expect(
        service.getTranscript({ videoId: 'invalid' })
      ).rejects.toThrow('Failed to get transcript');
    });
  });

  describe('searchTranscript', () => {
    it('should find matching lines', async () => {
      const mockTranscript = [
        { text: 'Hello world', offset: 0, duration: 3000 },
        { text: 'Goodbye world', offset: 3000, duration: 2500 },
        { text: 'Something else', offset: 6000, duration: 2000 },
      ];
      mockFetchTranscript.mockResolvedValueOnce(mockTranscript);

      const result = await service.searchTranscript({
        videoId: 'test123',
        query: 'world',
      });

      expect(result.matches).toHaveLength(2);
      expect(result.totalMatches).toBe(2);
      expect(result.query).toBe('world');
    });

    it('should return empty matches for no results', async () => {
      const mockTranscript = [
        { text: 'Hello world', offset: 0, duration: 3000 },
      ];
      mockFetchTranscript.mockResolvedValueOnce(mockTranscript);

      const result = await service.searchTranscript({
        videoId: 'test123',
        query: 'xyznonexistent',
      });

      expect(result.matches).toHaveLength(0);
      expect(result.totalMatches).toBe(0);
    });

    it('should be case-insensitive', async () => {
      const mockTranscript = [
        { text: 'Hello World', offset: 0, duration: 3000 },
      ];
      mockFetchTranscript.mockResolvedValueOnce(mockTranscript);

      const result = await service.searchTranscript({
        videoId: 'test123',
        query: 'world',
      });

      expect(result.totalMatches).toBe(1);
    });
  });

  describe('getTimestampedTranscript', () => {
    it('should format timestamps correctly', async () => {
      const mockTranscript = [
        { text: 'First line', offset: 0, duration: 3000 },
        { text: 'Second line', offset: 65000, duration: 4000 },
      ];
      mockFetchTranscript.mockResolvedValueOnce(mockTranscript);

      const result = await service.getTimestampedTranscript({ videoId: 'test123' });

      expect(result.timestampedTranscript).toHaveLength(2);
      expect(result.timestampedTranscript[0].timestamp).toBe('0:00');
      expect(result.timestampedTranscript[1].timestamp).toBe('1:05');
      expect(result.timestampedTranscript[0].text).toBe('First line');
      expect(result.timestampedTranscript[0].startTimeMs).toBe(0);
      expect(result.timestampedTranscript[0].durationMs).toBe(3000);
    });
  });
});
