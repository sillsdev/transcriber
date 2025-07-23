import React, { useReducer, useCallback } from 'react';

interface FaithbridgeSourceOrigin {
  service: string;
  service_id: string;
}

interface FaithbridgeMsgSource {
  id: string;
  name: string;
  source_origin: FaithbridgeSourceOrigin;
}
interface FaithbridgeMsg {
  content: string;
  audioUrl?: string; // Optional field for audio URL
  language: string;
  messageType: 'USER' | 'BOT';
  sources: FaithbridgeMsgSource[];
  timestamp: string;
}

export interface FaithbridgeData {
  chatSessionId: string;
  messages: FaithbridgeMsg[];
}

interface FaithbridgeResult {
  data: FaithbridgeData | null;
  loading: boolean;
  error: string | null;
}

type FaithbridgeAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: any }
  | { type: 'FETCH_ERROR'; payload: string }
  | { type: 'FETCH_RESET' };

const initialState: FaithbridgeResult = {
  data: null,
  loading: false,
  error: null,
};

const faithbridgeReducer = (
  state: FaithbridgeResult,
  action: FaithbridgeAction
): FaithbridgeResult => {
  switch (action.type) {
    case 'FETCH_START':
      return {
        ...state,
        loading: true,
        error: null,
      };
    case 'FETCH_SUCCESS':
      return {
        ...state,
        loading: false,
        data: action.payload,
        error: null,
      };
    case 'FETCH_ERROR':
      return {
        ...state,
        loading: false,
        error: action.payload,
      };
    case 'FETCH_RESET':
      return {
        ...initialState,
      };
    default:
      return state;
  }
};

export const useFaithbridgeResult = (reset?: number) => {
  const [state, dispatch] = useReducer(faithbridgeReducer, initialState);

  const fetchResult = useCallback(
    async (chatSessionId: string, userId: string, includeAudio?: boolean) => {
      if (!chatSessionId || !userId) {
        dispatch({
          type: 'FETCH_ERROR',
          payload: 'Missing required parameters',
        });
        return;
      }

      dispatch({ type: 'FETCH_START' });

      try {
        const params = new URLSearchParams({
          chatSessionId,
          userId,
          includeAudio: includeAudio ? 'true' : 'false',
        });

        let response: Response | null = null;
        let retryCount = 0;

        while (retryCount < 5) {
          try {
            response = await fetch(
              `https://faithbridge.multilingualai.com/apmResult?${params}`,
              {
                method: 'GET',
                headers: {
                  'Content-Type': 'application/json',
                },
              }
            );
            if (response?.ok) break; // Exit loop if successful
          } catch (error) {
            if (
              error instanceof Error &&
              !/network/i.test(error?.message || error?.name)
            )
              throw error; // Only retry on network errors
            if (retryCount >= 3) throw error; // Throw error after 3 retries
          }
          retryCount++;
        }

        if (!response?.ok) {
          throw new Error(`HTTP error! status: ${response?.status}`);
        }

        const data: FaithbridgeData = await response.json();
        dispatch({ type: 'FETCH_SUCCESS', payload: data });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'An unknown error occurred';
        dispatch({ type: 'FETCH_ERROR', payload: errorMessage });
      }
    },
    []
  );

  React.useEffect(() => {
    if (reset !== undefined && reset > 0) {
      dispatch({ type: 'FETCH_RESET' });
    }
  }, [reset]);

  return {
    ...state,
    fetchResult,
  };
};
