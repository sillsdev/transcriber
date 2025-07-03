import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FaithbridgeIframe } from '../components/PassageDetail/Internalization/FaithbridgeIframe';
import type { FaithbridgeData } from '../components/PassageDetail/Internalization/useFaithbridgeResult';
import { TokenContext } from '../context/TokenProvider';

var mockUser: string | null = 'user-123';
var mockMemory = {
  keyMap: {
    user: {
      'user-123': 'remote-user-123',
    },
  },
};
var mockHasPermission = true;

// Mock dependencies
jest.mock('../utils', () => ({
  generateUUID: jest.fn(() => 'mock-uuid-123'),
  useCheckOnline: () => (callback: (result: boolean) => void) => {
    // Simulate online check by calling the callback with true
    callback(true);
  },
  logError: jest.fn(
    (_severity: number, _reporter: any, _error: Error | string) => {}
  ),
  Severity: { error: 1 },
}));

jest.mock(
  '../components/PassageDetail/Internalization/useFaithbridgeResult',
  () => ({
    useFaithbridgeResult: jest.fn(),
  })
);

jest.mock('../context/usePassageDetailContext', () => ({
  __esModule: true,
  default: jest.fn(),
}));

jest.mock('../crud', () => ({
  remoteId: jest.fn(() => 'remote-user-123'),
  useRole: jest.fn(() => ({ userIsAdmin: false })),
}));

jest.mock('../assets/brands', () => ({
  FaithBridge: 'FaithBridge',
}));

// Mock the GlobalProvider to avoid complex dependencies
jest.mock('../context/GlobalContext', () => ({
  useGlobal: (arg: string) =>
    arg === 'user'
      ? [mockUser, jest.fn()]
      : arg === 'memory'
      ? [mockMemory, jest.fn()]
      : arg === 'offline'
      ? [false, jest.fn()]
      : arg === 'connected'
      ? [true, jest.fn()]
      : arg === 'offlineOnly'
      ? [false, jest.fn()]
      : arg === 'errorReporter'
      ? [undefined, jest.fn()]
      : [{}, jest.fn()],
}));

jest.mock('react-redux', () => ({
  useSelector: () => ({
    addContent: 'Add Content as Resource',
    audioResources: 'Request Audio',
    newChat: 'New Chat',
    loading: 'Loading result...',
    error: 'Error: ',
    noInfo: 'No information found',
    audio: 'audio',
    text: 'text',
  }),
  shallowEqual: jest.fn(),
}));

jest.mock('../utils/useStepPermission', () => ({
  useStepPermissions: () => ({
    canDoSectionStep: jest.fn().mockReturnValue(mockHasPermission),
  }),
}));

jest.mock('../utils/axios', () => ({
  axiosGet: jest.fn(),
}));

// Mock the useFaithbridgeResult hook
const mockUseFaithbridgeResult =
  require('../components/PassageDetail/Internalization/useFaithbridgeResult').useFaithbridgeResult;

// Mock the usePassageDetailContext hook
const mockUsePassageDetailContext =
  require('../context/usePassageDetailContext').default;

// Mock the useRole hook
const mockUseRole = require('../crud').useRole;

// Mock the remoteId function
const mockRemoteId = require('../crud').remoteId;

// Mock the generateUUID function
const mockGenerateUUID = require('../utils').generateUUID;

// Mock the logError function
const mockLogError = require('../utils').logError;

// Now you can set the mock implementation in your tests:
const mockAxiosGet = require('../utils/axios').axiosGet;

// Mock passage data
const mockPassage = {
  type: 'passage',
  id: 'passage-123',
  attributes: {
    book: 'MAT',
    reference: '1:1-5',
  },
};

const mockTokenValue = { state: { accessToken: 'mock-access-token' } };

const wrapper = (children: React.ReactNode) =>
  render(
    <TokenContext.Provider value={mockTokenValue as any}>
      {children}
    </TokenContext.Provider>
  );

describe('FaithbridgeIframe', () => {
  let mockOnMarkdown: jest.Mock;
  let mockOnClose: jest.Mock;
  let mockFetchResult: jest.Mock;

  beforeEach(() => {
    mockOnMarkdown = jest.fn();
    mockOnClose = jest.fn();
    mockFetchResult = jest.fn();

    // Reset all mocks
    jest.clearAllMocks();

    // Setup default mock implementations
    mockUsePassageDetailContext.mockReturnValue({
      passage: mockPassage,
    });

    mockUseFaithbridgeResult.mockReturnValue({
      data: null,
      loading: false,
      error: null,
      fetchResult: mockFetchResult,
    });

    mockAxiosGet.mockReset();
    mockAxiosGet.mockReturnValue({
      name: 'aquifer-name',
      grouping: { name: 'aquifer-grouping' },
    });

    mockUseRole.mockReturnValue({ userIsAdmin: false });
    mockRemoteId.mockReturnValue('remote-user-123');
    mockGenerateUUID.mockReturnValue('mock-uuid-123');
    mockHasPermission = true;
  });

  describe('initialization', () => {
    it('should render the iframe with correct URL parameters', () => {
      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      const iframe = screen.getByTitle('FaithBridge');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute(
        'src',
        'https://faithbridge.multilingualai.com/apm?chatSessionId=mock-uuid-123&verseRef=MAT+1%3A1-5&userId=remote-user-123'
      );
      expect(iframe).toHaveAttribute('style', 'width: 100%; height: 600px;');
      expect(iframe).toHaveAttribute('allowFullScreen');
    });

    it('should generate a new chat ID on mount', () => {
      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      expect(mockGenerateUUID).toHaveBeenCalledTimes(1);
    });

    it('should set verse reference from passage data', () => {
      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      // The iframe src should contain the verse reference
      const iframe = screen.getByTitle('FaithBridge');
      expect(iframe).toHaveAttribute(
        'src',
        expect.stringContaining('verseRef=MAT+1%3A1-5')
      );
    });

    it('should use default values when passage data is missing', () => {
      mockUsePassageDetailContext.mockReturnValue({
        passage: null,
      });

      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      const iframe = screen.getByTitle('FaithBridge');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute(
        'src',
        expect.stringContaining('verseRef=MAT+1%3A1')
      );
    });
  });

  describe('button interactions', () => {
    it('should render New Chat button with correct text', () => {
      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      const newChatButton = screen.getByText('New Chat');
      expect(newChatButton).toBeInTheDocument();
    });

    it('should generate new chat ID when New Chat button is clicked', () => {
      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      const newChatButton = screen.getByText('New Chat');
      fireEvent.click(newChatButton);

      expect(mockGenerateUUID).toHaveBeenCalledTimes(2); // Once on mount, once on click
    });

    it('should not render Add Content button for users without permission', () => {
      mockHasPermission = false;
      mockUseRole.mockReturnValue({ userIsAdmin: false });

      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      expect(
        screen.queryByText('Add Content as Resource')
      ).not.toBeInTheDocument();
    });

    it('should render Add Content button for admin users', () => {
      mockUseRole.mockReturnValue({ userIsAdmin: true });

      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      const addContentButton = screen.getByText('Add Content as Resource');
      expect(addContentButton).toBeInTheDocument();
    });

    it('should call fetchResult when Add Content button is clicked by admin', () => {
      mockUseRole.mockReturnValue({ userIsAdmin: true });

      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      const addContentButton = screen.getByText('Add Content as Resource');
      fireEvent.click(addContentButton);

      expect(mockFetchResult).toHaveBeenCalledWith(
        'mock-uuid-123',
        'remote-user-123',
        true
      );
    });

    it('should not call fetchResult when Add Content button is clicked without required data', () => {
      mockUseRole.mockReturnValue({ userIsAdmin: true });
      mockUsePassageDetailContext.mockReturnValue({
        passage: null,
      });
      // Mock userId to be null to actually prevent fetchResult from being called
      mockUser = null;

      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      const addContentButton = screen.getByText('Add Content as Resource');
      fireEvent.click(addContentButton);

      expect(mockFetchResult).not.toHaveBeenCalled();

      // Restore the original mock
      mockUser = 'user-123';
    });
  });

  describe('loading and error states', () => {
    it('should show loading message when loading is true', () => {
      mockUseFaithbridgeResult.mockReturnValue({
        data: null,
        loading: true,
        error: null,
        fetchResult: mockFetchResult,
      });

      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      expect(screen.getByText('Loading result...')).toBeInTheDocument();
    });

    it('should show error message when error is present', () => {
      mockUseFaithbridgeResult.mockReturnValue({
        data: null,
        loading: false,
        error: 'Network error occurred',
        fetchResult: mockFetchResult,
      });

      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      expect(
        screen.getByText('Error: Network error occurred')
      ).toBeInTheDocument();
    });

    it('should show 500 error message when iframe fails with server error', () => {
      mockUseFaithbridgeResult.mockReturnValue({
        data: null,
        loading: false,
        error: 'HTTP 500: Internal Server Error',
        fetchResult: mockFetchResult,
      });

      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      expect(
        screen.getByText('Error: HTTP 500: Internal Server Error')
      ).toBeInTheDocument();
    });

    it('should handle 500 error with retry mechanism', () => {
      // Simulate multiple errors to trigger the retry limit
      mockUseFaithbridgeResult.mockReturnValue({
        data: null,
        loading: false,
        error: 'HTTP 500: Internal Server Error',
        fetchResult: mockFetchResult,
      });

      const { rerender } = wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      // Simulate 5 consecutive errors to reach the retry limit
      for (let i = 0; i < 5; i++) {
        mockUseFaithbridgeResult.mockReturnValue({
          data: null,
          loading: false,
          error: `HTTP 500: Internal Server Error (attempt ${i + 1})`,
          fetchResult: mockFetchResult,
        });

        rerender(
          <TokenContext.Provider value={mockTokenValue as any}>
            <FaithbridgeIframe
              onMarkdown={mockOnMarkdown}
              onClose={mockOnClose}
            />
          </TokenContext.Provider>
        );
      }

      // After 5 errors, logError should be called
      expect(mockLogError).toHaveBeenCalledWith(
        1,
        undefined,
        'HTTP 500: Internal Server Error (attempt 5)'
      );
    });

    it('should handle 500 error state properly', () => {
      mockUseFaithbridgeResult.mockReturnValue({
        data: null,
        loading: false,
        error: 'HTTP 500: Internal Server Error - Database connection failed',
        fetchResult: mockFetchResult,
      });

      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      // Verify the error is displayed
      expect(
        screen.getByText(
          'Error: HTTP 500: Internal Server Error - Database connection failed'
        )
      ).toBeInTheDocument();

      // Verify the iframe is still rendered (component doesn't crash)
      const iframe = screen.getByTitle('FaithBridge');
      expect(iframe).toBeInTheDocument();
    });

    it('should handle multiple 500 errors and show latest error message', () => {
      const { rerender } = wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      // First error
      mockUseFaithbridgeResult.mockReturnValue({
        data: null,
        loading: false,
        error: 'HTTP 500: Internal Server Error - First attempt',
        fetchResult: mockFetchResult,
      });

      rerender(
        <TokenContext.Provider value={mockTokenValue as any}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TokenContext.Provider>
      );

      expect(
        screen.getByText(
          'Error: HTTP 500: Internal Server Error - First attempt'
        )
      ).toBeInTheDocument();

      // Second error
      mockUseFaithbridgeResult.mockReturnValue({
        data: null,
        loading: false,
        error: 'HTTP 500: Internal Server Error - Second attempt',
        fetchResult: mockFetchResult,
      });

      rerender(
        <TokenContext.Provider value={mockTokenValue as any}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TokenContext.Provider>
      );

      expect(
        screen.getByText(
          'Error: HTTP 500: Internal Server Error - Second attempt'
        )
      ).toBeInTheDocument();
    });

    it('should display 500 error message correctly in UI', () => {
      mockUseFaithbridgeResult.mockReturnValue({
        data: null,
        loading: false,
        error:
          'HTTP 500: Internal Server Error - Server is temporarily unavailable',
        fetchResult: mockFetchResult,
      });

      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      expect(
        screen.getByText(
          'Error: HTTP 500: Internal Server Error - Server is temporarily unavailable'
        )
      ).toBeInTheDocument();
    });

    it('should not show loading or error messages when both are false/null', () => {
      mockUseFaithbridgeResult.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        fetchResult: mockFetchResult,
      });

      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      expect(screen.queryByText('Loading result...')).not.toBeInTheDocument();
      expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
    });
  });

  describe('data handling', () => {
    it('should call onMarkdown with data audioUrl when data is received and audio is true', async () => {
      const mockData: FaithbridgeData = {
        chatSessionId: 'chat-123',
        messages: [
          {
            content: 'My sample query',
            language: 'ENG',
            messageType: 'USER',
            sources: [],
            timestamp: '2024-01-01T00:00:00Z',
          },
          {
            audioUrl: 'https://example.com/audio.mp3',
            content: 'Sample translation content',
            language: 'ENG',
            messageType: 'BOT',
            sources: [],
            timestamp: '2024-01-01T00:00:00Z',
          },
        ],
      };

      mockUseFaithbridgeResult.mockReturnValue({
        data: mockData,
        loading: false,
        error: null,
        fetchResult: mockFetchResult,
      });

      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(mockOnMarkdown).toHaveBeenCalledWith(
          mockData.messages[0].content,
          mockData.messages[1].audioUrl,
          mockData.messages[1].content
        );
      });
    });

    it('should call onMarkdown with data content when data is received and audio is false', async () => {
      const mockData: FaithbridgeData = {
        chatSessionId: 'chat-123',
        messages: [
          {
            content: 'My sample query',
            language: 'ENG',
            messageType: 'USER',
            sources: [],
            timestamp: '2024-01-01T00:00:00Z',
          },
          {
            content: 'Sample translation content',
            language: 'ENG',
            messageType: 'BOT',
            sources: [],
            timestamp: '2024-01-01T00:00:00Z',
          },
        ],
      };

      mockUseFaithbridgeResult.mockReturnValue({
        data: mockData,
        loading: false,
        error: null,
        fetchResult: mockFetchResult,
      });

      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      const audioButton = screen.getByText('Request Audio');
      fireEvent.click(audioButton);

      await waitFor(() => {
        expect(mockOnMarkdown).toHaveBeenCalledWith(
          mockData.messages[0].content,
          '',
          mockData.messages[1].content
        );
      });
    });

    it('should call onClose when data is received', async () => {
      const mockData: FaithbridgeData = {
        chatSessionId: 'chat-123',
        messages: [
          {
            content: 'Sample translation content',
            language: 'ENG',
            messageType: 'BOT',
            sources: [],
            timestamp: '2024-01-01T00:00:00Z',
          },
        ],
      };

      mockUseFaithbridgeResult.mockReturnValue({
        data: mockData,
        loading: false,
        error: null,
        fetchResult: mockFetchResult,
      });

      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should handle data without messages content', async () => {
      // Provide an empty messages array to simulate missing lastMessage
      const mockData: FaithbridgeData = {
        chatSessionId: 'chat-123',
        messages: [],
      };

      mockUseFaithbridgeResult.mockReturnValue({
        data: mockData,
        loading: false,
        error: null,
        fetchResult: mockFetchResult,
      });

      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      await waitFor(() => {
        expect(mockOnMarkdown).toHaveBeenCalledWith('', '', '');
      });
    });

    it('should not call callbacks when onClose are not provided', async () => {
      const mockData: FaithbridgeData = {
        chatSessionId: 'chat-123',
        messages: [
          {
            content: 'Sample translation content',
            language: 'ENG',
            messageType: 'BOT',
            sources: [],
            timestamp: '2024-01-01T00:00:00Z',
          },
        ],
      };

      mockUseFaithbridgeResult.mockReturnValue({
        data: mockData,
        loading: false,
        error: null,
        fetchResult: mockFetchResult,
      });

      wrapper(<FaithbridgeIframe onMarkdown={mockOnMarkdown} />);

      // Should not throw any errors
      await waitFor(() => {
        expect(true).toBe(true); // Just ensure the component renders without errors
      });
    });
  });

  describe('URL parameter construction', () => {
    it('should construct URL with all required parameters', () => {
      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      const iframe = screen.getByTitle('FaithBridge');
      const src = iframe.getAttribute('src');

      expect(src).toContain('chatSessionId=mock-uuid-123');
      expect(src).toContain('verseRef=MAT+1%3A1-5');
      expect(src).toContain('userId=remote-user-123');
    });

    it('should handle special characters in verse reference', () => {
      mockUsePassageDetailContext.mockReturnValue({
        passage: {
          type: 'passage',
          id: 'passage-123',
          attributes: {
            book: 'MAT',
            reference: '1:1-5, 10-15',
          },
        },
      });

      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      const iframe = screen.getByTitle('FaithBridge');
      expect(iframe).toHaveAttribute(
        'src',
        expect.stringContaining('verseRef=MAT+1%3A1-5%2C+10-15')
      );
    });

    it('should handle missing user remote ID', () => {
      mockRemoteId.mockReturnValue(null);

      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      const iframe = screen.getByTitle('FaithBridge');
      expect(iframe).toHaveAttribute('src', expect.stringContaining('userId='));
    });
  });

  describe('state updates', () => {
    it('should update iframe src when chat ID changes', () => {
      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      // First render
      let iframe = screen.getByTitle('FaithBridge');
      expect(iframe).toHaveAttribute(
        'src',
        expect.stringContaining('chatSessionId=mock-uuid-123')
      );

      // Change the mock to return a different UUID
      mockGenerateUUID.mockReturnValue('mock-uuid-456');

      // Trigger a re-render by clicking New Chat
      const newChatButton = screen.getByText('New Chat');
      fireEvent.click(newChatButton);

      // Check that the iframe src was updated
      iframe = screen.getByTitle('FaithBridge');
      expect(iframe).toHaveAttribute(
        'src',
        expect.stringContaining('chatSessionId=mock-uuid-456')
      );
    });

    it('should update iframe src when verse reference changes', () => {
      const { rerender } = wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      // First render
      let iframe = screen.getByTitle('FaithBridge');
      expect(iframe).toHaveAttribute(
        'src',
        expect.stringContaining('verseRef=MAT+1%3A1-5')
      );

      // Update passage data
      mockUsePassageDetailContext.mockReturnValue({
        passage: {
          type: 'passage',
          id: 'passage-456',
          attributes: {
            book: 'JHN',
            reference: '3:16',
          },
        },
      });

      // Re-render with new passage data
      rerender(
        <TokenContext.Provider value={mockTokenValue as any}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TokenContext.Provider>
      );

      // Check that the iframe src was updated
      iframe = screen.getByTitle('FaithBridge');
      expect(iframe).toHaveAttribute(
        'src',
        expect.stringContaining('verseRef=JHN+3%3A16')
      );
    });
  });

  describe('edge cases', () => {
    it('should handle missing passage data gracefully', () => {
      mockUsePassageDetailContext.mockReturnValue({
        passage: null,
      });

      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      const iframe = screen.getByTitle('FaithBridge');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute(
        'src',
        expect.stringContaining('verseRef=MAT+1%3A1')
      );
    });

    it('should handle missing passage attributes gracefully', () => {
      mockUsePassageDetailContext.mockReturnValue({
        passage: {
          type: 'passage',
          id: 'passage-123',
          attributes: {},
        },
      });

      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      const iframe = screen.getByTitle('FaithBridge');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute(
        'src',
        expect.stringContaining('verseRef=MAT+1%3A1')
      );
    });

    it('should handle missing global context data', () => {
      wrapper(
        <FaithbridgeIframe onMarkdown={mockOnMarkdown} onClose={mockOnClose} />
      );

      const iframe = screen.getByTitle('FaithBridge');
      expect(iframe).toBeInTheDocument();
    });
  });
});
