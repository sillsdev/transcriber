import { useReducer, useCallback } from 'react';

interface FaithbridgeResult {
  data: any;
  loading: boolean;
  error: string | null;
}

type FaithbridgeAction =
  | { type: 'FETCH_START' }
  | { type: 'FETCH_SUCCESS'; payload: any }
  | { type: 'FETCH_ERROR'; payload: string };

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
    default:
      return state;
  }
};

export const useFaithbridgeResult = () => {
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

        const data = await response.json();
        dispatch({ type: 'FETCH_SUCCESS', payload: data });
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'An unknown error occurred';
        dispatch({ type: 'FETCH_ERROR', payload: errorMessage });
      }
    },
    []
  );

  return {
    ...state,
    fetchResult,
  };
};
