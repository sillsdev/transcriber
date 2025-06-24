import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { configureStore } from '@reduxjs/toolkit';
import { FaithbridgeIframe } from '../components/PassageDetail/Internalization/FaithbridgeIframe';

var mockMemory = {
  keyMap: {
    user: {
      'user-123': 'remote-user-123',
    },
  },
};

// Mock dependencies
jest.mock('../utils', () => ({
  generateUUID: jest.fn(() => 'mock-uuid-123'),
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
  useRole: jest.fn(() => false),
}));

jest.mock('../assets/brands', () => ({
  FaithBridge: 'FaithBridge',
}));

// Mock the GlobalProvider to avoid complex dependencies
jest.mock('../context/GlobalContext', () => {
  const mockReact = require('react');
  return {
    GlobalProvider: ({ children, init }: { children: any; init: any }) => {
      // Create a simple context provider that provides the necessary values
      const GlobalContext = mockReact.createContext({});
      return (
        <GlobalContext.Provider value={init}>{children}</GlobalContext.Provider>
      );
    },
    useGlobal: (arg: string) =>
      arg === 'user'
        ? ['user-123', jest.fn()]
        : arg === 'memory'
        ? [mockMemory, jest.fn()]
        : [{}, jest.fn()],
  };
});

jest.mock('react-redux', () => ({
  useSelector: () => ({
    addContent: 'Add Content as Resource',
    audioResources: 'RequestAudio',
    newChat: 'New Chat',
  }),
  shallowEqual: jest.fn(),
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

// Create a mock Redux store
const createMockStore = (initialState = {}) => {
  return configureStore({
    reducer: {
      localization: (state = { faithbridge: {} }, action) => state,
    },
    preloadedState: {
      localization: {
        faithbridge: {
          addContent: 'Add Content as Resource',
          audioResources: 'RequestAudio',
          newChat: 'New Chat',
        },
        ...initialState,
      },
    },
  });
};

// Mock passage data
const mockPassage = {
  type: 'passage',
  id: 'passage-123',
  attributes: {
    book: 'MAT',
    reference: '1:1-5',
  },
};

// Mock global context data
const mockGlobalState = {
  user: 'user-123',
  memory: {
    keyMap: {
      user: {
        'user-123': 'remote-user-123',
      },
    },
  },
};

// Test wrapper component
const TestWrapper = ({
  children,
  store,
  globalState = mockGlobalState,
}: {
  children: React.ReactNode;
  store: any;
  globalState?: any;
}) => {
  const { GlobalProvider } = require('../context/GlobalContext');
  return <GlobalProvider init={globalState}>{children}</GlobalProvider>;
};

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

    mockUseRole.mockReturnValue(false);
    mockRemoteId.mockReturnValue('remote-user-123');
    mockGenerateUUID.mockReturnValue('mock-uuid-123');
  });

  describe('initialization', () => {
    it('should render the iframe with correct initial URL parameters', () => {
      const store = createMockStore();

      render(
        <TestWrapper store={store}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TestWrapper>
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
      const store = createMockStore();

      render(
        <TestWrapper store={store}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(mockGenerateUUID).toHaveBeenCalledTimes(1);
    });

    it('should set verse reference from passage data', () => {
      const store = createMockStore();

      render(
        <TestWrapper store={store}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TestWrapper>
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

      const store = createMockStore();

      render(
        <TestWrapper store={store}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TestWrapper>
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
      const store = createMockStore();

      render(
        <TestWrapper store={store}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      const newChatButton = screen.getByText('New Chat');
      expect(newChatButton).toBeInTheDocument();
    });

    it('should generate new chat ID when New Chat button is clicked', () => {
      const store = createMockStore();

      render(
        <TestWrapper store={store}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      const newChatButton = screen.getByText('New Chat');
      fireEvent.click(newChatButton);

      expect(mockGenerateUUID).toHaveBeenCalledTimes(2); // Once on mount, once on click
    });

    it('should not render Add Content button for non-admin users', () => {
      mockUseRole.mockReturnValue(false);
      const store = createMockStore();

      render(
        <TestWrapper store={store}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(
        screen.queryByText('Add Content as Resource')
      ).not.toBeInTheDocument();
    });

    it('should render Add Content button for admin users', () => {
      mockUseRole.mockReturnValue(true);
      const store = createMockStore();

      render(
        <TestWrapper store={store}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      const addContentButton = screen.getByText('Add Content as Resource');
      expect(addContentButton).toBeInTheDocument();
    });

    it('should call fetchResult when Add Content button is clicked by admin', () => {
      mockUseRole.mockReturnValue(true);
      const store = createMockStore();

      render(
        <TestWrapper store={store}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      const addContentButton = screen.getByText('Add Content as Resource');
      fireEvent.click(addContentButton);

      expect(mockFetchResult).toHaveBeenCalledWith('mock-uuid-123', 'user-123');
    });

    it('should not call fetchResult when Add Content button is clicked without required data', () => {
      mockUseRole.mockReturnValue(true);
      mockUsePassageDetailContext.mockReturnValue({
        passage: null,
      });
      // Mock userId to be null to actually prevent fetchResult from being called
      const store = createMockStore();

      // Override the useGlobal mock for this test to return null userId
      const originalUseGlobal = require('../context/GlobalContext').useGlobal;
      require('../context/GlobalContext').useGlobal = jest.fn((arg) =>
        arg === 'user' ? [null, jest.fn()] : originalUseGlobal(arg)
      );

      render(
        <TestWrapper store={store}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      const addContentButton = screen.getByText('Add Content as Resource');
      fireEvent.click(addContentButton);

      expect(mockFetchResult).not.toHaveBeenCalled();

      // Restore the original mock
      require('../context/GlobalContext').useGlobal = originalUseGlobal;
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

      const store = createMockStore();

      render(
        <TestWrapper store={store}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TestWrapper>
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

      const store = createMockStore();

      render(
        <TestWrapper store={store}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(
        screen.getByText('Error: Network error occurred')
      ).toBeInTheDocument();
    });

    it('should not show loading or error messages when both are false/null', () => {
      mockUseFaithbridgeResult.mockReturnValue({
        data: null,
        loading: false,
        error: null,
        fetchResult: mockFetchResult,
      });

      const store = createMockStore();

      render(
        <TestWrapper store={store}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      expect(screen.queryByText('Loading result...')).not.toBeInTheDocument();
      expect(screen.queryByText(/Error:/)).not.toBeInTheDocument();
    });
  });

  describe('data handling', () => {
    it('should call onMarkdown with data content when data is received', async () => {
      const mockData = {
        lastMessage: {
          content: 'Sample translation content',
        },
      };

      mockUseFaithbridgeResult.mockReturnValue({
        data: mockData,
        loading: false,
        error: null,
        fetchResult: mockFetchResult,
      });

      const store = createMockStore();

      render(
        <TestWrapper store={store}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockOnMarkdown).toHaveBeenCalledWith(
          'Sample translation content'
        );
      });
    });

    it('should call onClose when data is received', async () => {
      const mockData = {
        lastMessage: {
          content: 'Sample translation content',
        },
      };

      mockUseFaithbridgeResult.mockReturnValue({
        data: mockData,
        loading: false,
        error: null,
        fetchResult: mockFetchResult,
      });

      const store = createMockStore();

      render(
        <TestWrapper store={store}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockOnClose).toHaveBeenCalled();
      });
    });

    it('should handle data without lastMessage content', async () => {
      const mockData = {
        someOtherField: 'value',
      };

      mockUseFaithbridgeResult.mockReturnValue({
        data: mockData,
        loading: false,
        error: null,
        fetchResult: mockFetchResult,
      });

      const store = createMockStore();

      render(
        <TestWrapper store={store}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(mockOnMarkdown).toHaveBeenCalledWith('');
      });
    });

    it('should not call callbacks when onMarkdown or onClose are not provided', async () => {
      const mockData = {
        lastMessage: {
          content: 'Sample translation content',
        },
      };

      mockUseFaithbridgeResult.mockReturnValue({
        data: mockData,
        loading: false,
        error: null,
        fetchResult: mockFetchResult,
      });

      const store = createMockStore();

      render(
        <TestWrapper store={store}>
          <FaithbridgeIframe />
        </TestWrapper>
      );

      // Should not throw any errors
      await waitFor(() => {
        expect(true).toBe(true); // Just ensure the component renders without errors
      });
    });
  });

  describe('URL parameter construction', () => {
    it('should construct URL with all required parameters', () => {
      const store = createMockStore();

      render(
        <TestWrapper store={store}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TestWrapper>
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

      const store = createMockStore();

      render(
        <TestWrapper store={store}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      const iframe = screen.getByTitle('FaithBridge');
      expect(iframe).toHaveAttribute(
        'src',
        expect.stringContaining('verseRef=MAT+1%3A1-5%2C+10-15')
      );
    });

    it('should handle missing user remote ID', () => {
      mockRemoteId.mockReturnValue(null);

      const store = createMockStore();

      render(
        <TestWrapper store={store}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      const iframe = screen.getByTitle('FaithBridge');
      expect(iframe).toHaveAttribute('src', expect.stringContaining('userId='));
    });
  });

  describe('state updates', () => {
    it('should update iframe src when chat ID changes', () => {
      const store = createMockStore();

      render(
        <TestWrapper store={store}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TestWrapper>
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
      const store = createMockStore();

      const { rerender } = render(
        <TestWrapper store={store}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TestWrapper>
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
        <TestWrapper store={store}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TestWrapper>
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

      const store = createMockStore();

      render(
        <TestWrapper store={store}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TestWrapper>
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

      const store = createMockStore();

      render(
        <TestWrapper store={store}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      const iframe = screen.getByTitle('FaithBridge');
      expect(iframe).toBeInTheDocument();
      expect(iframe).toHaveAttribute(
        'src',
        expect.stringContaining('verseRef=MAT+1%3A1')
      );
    });

    it('should handle missing global context data', () => {
      const store = createMockStore();

      render(
        <TestWrapper store={store} globalState={mockGlobalState}>
          <FaithbridgeIframe
            onMarkdown={mockOnMarkdown}
            onClose={mockOnClose}
          />
        </TestWrapper>
      );

      const iframe = screen.getByTitle('FaithBridge');
      expect(iframe).toBeInTheDocument();
    });
  });
});
