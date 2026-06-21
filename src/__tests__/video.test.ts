/**
 * Tests for VideoService — unit tests with mocked googleapis
 */

import { VideoService } from '../../src/services/video.js';

// Mock googleapis
const mockVideosList = jest.fn();
const mockSearchList = jest.fn();

jest.mock('googleapis', () => ({
  google: {
    youtube: jest.fn().mockImplementation(() => ({
      videos: {
        list: mockVideosList,
      },
      search: {
        list: mockSearchList,
      },
    })),
  },
}));

describe('VideoService', () => {
  let service: VideoService;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new VideoService();
    // Set API key before each test
    process.env.YOUTUBE_API_KEY = mockApiKey;
  });

  afterEach(() => {
    delete process.env.YOUTUBE_API_KEY;
  });

  describe('getVideo', () => {
    it('should return video details', async () => {
      const mockVideo = {
        id: 'test123',
        snippet: { title: 'Test Video' },
        contentDetails: { duration: 'PT5M30S' },
        statistics: { viewCount: '1000' },
      };
      mockVideosList.mockResolvedValueOnce({ data: { items: [mockVideo] } });

      const result = await service.getVideo({ videoId: 'test123' });

      expect(result).toEqual(mockVideo);
      expect(mockVideosList).toHaveBeenCalledWith({
        part: ['snippet', 'contentDetails', 'statistics'],
        id: ['test123'],
      });
    });

    it('should return null for non-existent video', async () => {
      mockVideosList.mockResolvedValueOnce({ data: { items: [] } });

      const result = await service.getVideo({ videoId: 'nonexistent' });

      expect(result).toBeNull();
    });

    it('should throw error when API key is missing', async () => {
      delete process.env.YOUTUBE_API_KEY;
      const newService = new VideoService();

      await expect(
        newService.getVideo({ videoId: 'test123' })
      ).rejects.toThrow('YOUTUBE_API_KEY environment variable is not set');
    });
  });

  describe('searchVideos', () => {
    it('should return search results', async () => {
      const mockResults = [
        { id: { videoId: 'vid1' }, snippet: { title: 'Video 1' } },
        { id: { videoId: 'vid2' }, snippet: { title: 'Video 2' } },
      ];
      mockSearchList.mockResolvedValueOnce({ data: { items: mockResults } });

      const result = await service.searchVideos({ query: 'test', maxResults: 5 });

      expect(result).toEqual(mockResults);
      expect(mockSearchList).toHaveBeenCalledWith({
        part: ['snippet'],
        q: 'test',
        maxResults: 5,
        type: ['video'],
      });
    });

    it('should return empty array when no results', async () => {
      mockSearchList.mockResolvedValueOnce({ data: { items: [] } });

      const result = await service.searchVideos({ query: 'nonexistent' });

      expect(result).toEqual([]);
    });
  });

  describe('getVideoStats', () => {
    it('should return video statistics', async () => {
      const mockStats = {
        viewCount: '1000',
        likeCount: '50',
        commentCount: '10',
      };
      mockVideosList.mockResolvedValueOnce({
        data: { items: [{ statistics: mockStats }] },
      });

      const result = await service.getVideoStats({ videoId: 'test123' });

      expect(result).toEqual(mockStats);
    });

    it('should return null for non-existent video', async () => {
      mockVideosList.mockResolvedValueOnce({ data: { items: [] } });

      const result = await service.getVideoStats({ videoId: 'nonexistent' });

      expect(result).toBeNull();
    });
  });

  describe('getTrendingVideos', () => {
    it('should return trending videos with default params', async () => {
      const mockTrending = [
        { id: { videoId: 'trend1' }, snippet: { title: 'Trending 1' } },
      ];
      mockVideosList.mockResolvedValueOnce({ data: { items: mockTrending } });

      const result = await service.getTrendingVideos({});

      expect(result).toEqual(mockTrending);
      expect(mockVideosList).toHaveBeenCalledWith({
        part: ['snippet', 'contentDetails', 'statistics'],
        chart: 'mostPopular',
        regionCode: 'US',
        maxResults: 10,
      });
    });

    it('should include videoCategoryId when provided', async () => {
      const mockTrending = [];
      mockVideosList.mockResolvedValueOnce({ data: { items: mockTrending } });

      await service.getTrendingVideos({
        regionCode: 'ES',
        maxResults: 5,
        videoCategoryId: '10',
      });

      expect(mockVideosList).toHaveBeenCalledWith(
        expect.objectContaining({
          regionCode: 'ES',
          maxResults: 5,
          videoCategoryId: '10',
        })
      );
    });
  });

  describe('getRelatedVideos', () => {
    it('should return related videos', async () => {
      const mockRelated = [
        { id: { videoId: 'rel1' }, snippet: { title: 'Related 1' } },
      ];
      mockSearchList.mockResolvedValueOnce({ data: { items: mockRelated } });

      const result = await service.getRelatedVideos({ videoId: 'source123' });

      expect(result).toEqual(mockRelated);
      expect(mockSearchList).toHaveBeenCalledWith({
        part: ['snippet'],
        relatedToVideoId: 'source123',
        maxResults: 10,
        type: ['video'],
      });
    });
  });
});
