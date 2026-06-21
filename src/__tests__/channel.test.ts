/**
 * Tests for ChannelService
 */

import { ChannelService } from '../../src/services/channel.js';

const mockChannelsList = jest.fn();
const mockSearchList = jest.fn();

jest.mock('googleapis', () => ({
  google: {
    youtube: jest.fn().mockImplementation(() => ({
      channels: {
        list: mockChannelsList,
      },
      search: {
        list: mockSearchList,
      },
    })),
  },
}));

describe('ChannelService', () => {
  let service: ChannelService;
  const mockApiKey = 'test-api-key';

  beforeEach(() => {
    jest.clearAllMocks();
    service = new ChannelService();
    process.env.YOUTUBE_API_KEY = mockApiKey;
  });

  afterEach(() => {
    delete process.env.YOUTUBE_API_KEY;
  });

  describe('getChannel', () => {
    it('should return channel details', async () => {
      const mockChannel = {
        id: 'UC123',
        snippet: { title: 'Test Channel', customUrl: '@testchannel' },
        statistics: { subscriberCount: '100000' },
      };
      mockChannelsList.mockResolvedValueOnce({ data: { items: [mockChannel] } });

      const result = await service.getChannel({ channelId: 'UC123' });

      expect(result).toEqual(mockChannel);
    });

    it('should return null for non-existent channel', async () => {
      mockChannelsList.mockResolvedValueOnce({ data: { items: [] } });

      const result = await service.getChannel({ channelId: 'nonexistent' });

      expect(result).toBeNull();
    });
  });

  describe('listVideos', () => {
    it('should return channel videos', async () => {
      const mockVideos = [
        { id: { videoId: 'vid1' }, snippet: { title: 'Video 1' } },
      ];
      mockSearchList.mockResolvedValueOnce({ data: { items: mockVideos } });

      const result = await service.listVideos({ channelId: 'UC123' });

      expect(result).toEqual(mockVideos);
    });

    it('should respect maxResults', async () => {
      mockSearchList.mockResolvedValueOnce({ data: { items: [] } });

      await service.listVideos({ channelId: 'UC123', maxResults: 25 });

      expect(mockSearchList).toHaveBeenCalledWith(
        expect.objectContaining({ maxResults: 25 })
      );
    });
  });
});
