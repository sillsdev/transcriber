import { renderHook, act } from '@testing-library/react';
import { useFaithbridgeResult } from '../components/PassageDetail/Internalization/useFaithbridgeResult';
import type { FaithbridgeData } from '../components/PassageDetail/Internalization/useFaithbridgeResult';

// Mock fetch globally
const mockFetch = jest.fn();
global.fetch = mockFetch;

describe('useFaithbridgeResult', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('initial state', () => {
    it('should have correct initial state', () => {
      const { result } = renderHook(() => useFaithbridgeResult());

      expect(result.current).toEqual({
        data: null,
        loading: false,
        error: null,
        fetchResult: expect.any(Function),
      });
    });
  });

  describe('fetchResult - success cases', () => {
    it('should fetch data successfully with required parameters', async () => {
      const mockResponse: FaithbridgeData = {
        chatSessionId: '123',
        messages: [
          {
            content: 'Sample translation result',
            language: 'ENG',
            messageType: 'BOT',
            sources: [
              {
                id: '123',
                name: 'FaithBridge',
                source_origin: {
                  service: 'FaithBridge',
                  service_id: '123',
                },
              },
            ],
            timestamp: '2024-01-01T00:00:00Z',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useFaithbridgeResult());

      await act(async () => {
        await result.current.fetchResult('chat123', 'user456');
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://faithbridge.multilingualai.com/apmResult?chatSessionId=chat123&userId=user456&includeAudio=false',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      expect(result.current).toEqual({
        data: mockResponse,
        loading: false,
        error: null,
        fetchResult: expect.any(Function),
      });
    });

    it('should fetch data with includeAudio set to true', async () => {
      const mockResponse: FaithbridgeData = {
        chatSessionId: '123',
        messages: [
          {
            content: 'Sample translation result',
            audioUrl: 'https://example.com/audio.mp3',
            language: 'ENG',
            messageType: 'BOT',
            sources: [
              {
                id: '123',
                name: 'FaithBridge',
                source_origin: {
                  service: 'FaithBridge',
                  service_id: '123',
                },
              },
            ],
            timestamp: '2024-01-01T00:00:00Z',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useFaithbridgeResult());

      await act(async () => {
        await result.current.fetchResult('chat123', 'user456', true);
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://faithbridge.multilingualai.com/apmResult?chatSessionId=chat123&userId=user456&includeAudio=true',
        {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      );

      expect(result.current.data).toEqual(mockResponse);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });

    it('should handle response data including query', async () => {
      const mockResponse = {
        chatSessionId: '123',
        messages: [
          {
            content: 'My Query',
            language: 'ENG',
            messageType: 'USER',
            sources: [],
            timestamp: '2024-01-01T00:00:00Z',
          },
          {
            content: 'Sample translation result',
            audioUrl: 'https://example.com/audio.mp3',
            language: 'ENG',
            messageType: 'BOT',
            sources: [
              {
                id: '123',
                name: 'FaithBridge',
                source_origin: {
                  service: 'FaithBridge',
                  service_id: '123',
                },
              },
            ],
            timestamp: '2024-01-01T00:00:00Z',
          },
        ],
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useFaithbridgeResult());

      await act(async () => {
        await result.current.fetchResult('chat123', 'user456');
      });

      expect(result.current.data).toEqual(mockResponse);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('fetchResult - error cases', () => {
    it('should handle missing chatSessionId', async () => {
      const { result } = renderHook(() => useFaithbridgeResult());

      await act(async () => {
        await result.current.fetchResult('', 'user456');
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current).toEqual({
        data: null,
        loading: false,
        error: 'Missing required parameters',
        fetchResult: expect.any(Function),
      });
    });

    it('should handle missing userId', async () => {
      const { result } = renderHook(() => useFaithbridgeResult());

      await act(async () => {
        await result.current.fetchResult('chat123', '');
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current).toEqual({
        data: null,
        loading: false,
        error: 'Missing required parameters',
        fetchResult: expect.any(Function),
      });
    });

    it('should handle missing both parameters', async () => {
      const { result } = renderHook(() => useFaithbridgeResult());

      await act(async () => {
        await result.current.fetchResult('', '');
      });

      expect(mockFetch).not.toHaveBeenCalled();
      expect(result.current).toEqual({
        data: null,
        loading: false,
        error: 'Missing required parameters',
        fetchResult: expect.any(Function),
      });
    });

    it('should handle HTTP error responses', async () => {
      mockFetch.mockResolvedValue({
        ok: false,
        status: 404,
      });

      const { result } = renderHook(() => useFaithbridgeResult());

      await act(async () => {
        await result.current.fetchResult('chat123', 'user456');
      });

      expect(mockFetch).toHaveBeenCalledTimes(5);

      expect(result.current).toEqual({
        data: null,
        loading: false,
        error: 'HTTP error! status: 404',
        fetchResult: expect.any(Function),
      });
    });

    it('should handle network errors', async () => {
      const networkError = new Error('Network error');
      mockFetch.mockRejectedValue(networkError);

      const { result } = renderHook(() => useFaithbridgeResult());

      await act(async () => {
        await result.current.fetchResult('chat123', 'user456');
      });

      expect(mockFetch).toHaveBeenCalledTimes(4);

      expect(result.current).toEqual({
        data: null,
        loading: false,
        error: 'Network error',
        fetchResult: expect.any(Function),
      });
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const { result } = renderHook(() => useFaithbridgeResult());

      await act(async () => {
        await result.current.fetchResult('chat123', 'user456');
      });

      expect(result.current).toEqual({
        data: null,
        loading: false,
        error: 'Invalid JSON',
        fetchResult: expect.any(Function),
      });
    });

    it('should handle unknown errors', async () => {
      mockFetch.mockRejectedValueOnce('Unknown error string');

      const { result } = renderHook(() => useFaithbridgeResult());

      await act(async () => {
        await result.current.fetchResult('chat123', 'user456');
      });

      expect(result.current).toEqual({
        data: null,
        loading: false,
        error: 'HTTP error! status: undefined',
        fetchResult: expect.any(Function),
      });
    });
  });

  describe('fetchResult - loading states', () => {
    it('should set loading to true during fetch', async () => {
      // Create a promise that we can control
      let resolvePromise: (value: any) => void;
      const fetchPromise = new Promise((resolve) => {
        resolvePromise = resolve;
      });

      mockFetch.mockReturnValueOnce(fetchPromise);

      const { result } = renderHook(() => useFaithbridgeResult());

      // Start the fetch
      act(() => {
        result.current.fetchResult('chat123', 'user456');
      });

      // Check loading state
      expect(result.current.loading).toBe(true);
      expect(result.current.error).toBe(null);

      // Resolve the promise
      await act(async () => {
        resolvePromise!({
          ok: true,
          json: async () => ({ success: true }),
        });
      });

      // Check final state
      expect(result.current.loading).toBe(false);
    });

    it('should clear previous error when starting new fetch', async () => {
      // First, set up an error state
      mockFetch.mockRejectedValueOnce(new Error('First error'));

      const { result } = renderHook(() => useFaithbridgeResult());

      await act(async () => {
        await result.current.fetchResult('chat123', 'user456');
      });

      expect(result.current.error).toBe('First error');

      // Now start a new successful fetch
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true }),
      });

      await act(async () => {
        await result.current.fetchResult('chat123', 'user456');
      });

      expect(result.current.error).toBe(null);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('multiple calls', () => {
    it('should handle multiple sequential calls', async () => {
      const mockResponse1 = { id: '1', result: 'First result' };
      const mockResponse2 = { id: '2', result: 'Second result' };

      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse1,
        })
        .mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse2,
        });

      const { result } = renderHook(() => useFaithbridgeResult());

      // First call
      await act(async () => {
        await result.current.fetchResult('chat1', 'user1');
      });

      expect(result.current.data).toEqual(mockResponse1);

      // Second call
      await act(async () => {
        await result.current.fetchResult('chat2', 'user2');
      });

      expect(result.current.data).toEqual(mockResponse2);
      expect(mockFetch).toHaveBeenCalledTimes(2);
    });

    it('should handle rapid successive calls', async () => {
      const mockResponse = { id: '1', result: 'Result' };

      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => mockResponse,
      });

      const { result } = renderHook(() => useFaithbridgeResult());

      // Make multiple rapid calls
      await act(async () => {
        await Promise.all([
          result.current.fetchResult('chat1', 'user1'),
          result.current.fetchResult('chat2', 'user2'),
          result.current.fetchResult('chat3', 'user3'),
        ]);
      });

      expect(mockFetch).toHaveBeenCalledTimes(3);
      expect(result.current.loading).toBe(false);
    });
  });

  describe('URL construction', () => {
    it('should construct URL with correct parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useFaithbridgeResult());

      await act(async () => {
        await result.current.fetchResult('test-chat-id', 'test-user-id', true);
      });

      const expectedUrl =
        'https://faithbridge.multilingualai.com/apmResult?chatSessionId=test-chat-id&userId=test-user-id&includeAudio=true';
      expect(mockFetch).toHaveBeenCalledWith(
        expectedUrl,
        expect.objectContaining({
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        })
      );
    });

    it('should handle special characters in parameters', async () => {
      mockFetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true }),
      });

      const { result } = renderHook(() => useFaithbridgeResult());

      await act(async () => {
        await result.current.fetchResult(
          'chat-id with spaces',
          'user@email.com'
        );
      });

      expect(mockFetch).toHaveBeenCalledWith(
        'https://faithbridge.multilingualai.com/apmResult?chatSessionId=chat-id+with+spaces&userId=user%40email.com&includeAudio=false',
        expect.any(Object)
      );
    });
  });
});
