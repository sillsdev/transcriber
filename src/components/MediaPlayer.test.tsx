/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
// import { expect, jest, test } from '@jest/globals';
import { cleanup, render, waitFor } from '@testing-library/react';
import { MediaPlayer } from './MediaPlayer';

enum MediaSt {
  'IDLE',
  'PENDING',
  'FETCHED',
  'ERROR',
}
interface IMediaState {
  status: MediaSt;
  error: null | string;
  url: string; // temporary url
  id: string; // media id
  remoteId: string;
  cancelled: boolean;
}

const mediaClean = {
  status: MediaSt.IDLE,
  error: null,
  url: '',
  id: '',
  remoteId: '',
  cancelled: false,
};
let mockMediaState: IMediaState = { ...mediaClean };

jest.mock('../crud', () => {
  const MediaSt = {
    IDLE: 0,
    PENDING: 1,
    FETCHED: 2,
    ERROR: 3,
  };
  return {
    useFetchMediaUrl: () => {
      return {
        mediaState: mockMediaState,
        fetchMediaUrl: ({ id }: { id: string }) => {
          if (id === '1') {
            mockMediaState = {
              ...mockMediaState,
              id: 'abcd-1',
              remoteId: '1',
              error: '',
              status: MediaSt.PENDING,
            };
            setTimeout(() => {
              mockMediaState = {
                ...mockMediaState,
                status: MediaSt.FETCHED,
                url: 'https://localhost/media/1.mp3',
              };
            }, 500);
          } else {
            mockMediaState = { ...mockMediaState, error: 'error' };
          }
        },
      };
    },
    MediaSt,
  };
});

jest.mock('../hoc/SnackBar', () => ({
  useSnackBar: () => ({
    showMessage: jest.fn(),
  }),
}));

jest.mock('../selector', () => ({
  sharedSelector: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: jest.fn(),
  shallowEqual: jest.fn(),
}));

jest.mock('reactn', () => ({
  useGlobal: () => [jest.fn()],
}));

jest.mock('../utils', () => ({
  logError: jest.fn(),
  Severity: {
    Error: 1,
  },
}));

describe('<MediaPlayer />', () => {
  beforeEach(cleanup);

  it('should render without crashing', () => {
    const props = {
      srcMediaId: '1',
      requestPlay: false,
      onEnded: () => {},
    };
    const { container } = render(<MediaPlayer {...props} />);
    expect(container.firstChild).toBe(null);
  });

  it('should render without crashing when requestPlay is true', () => {
    const props = {
      srcMediaId: '1',
      requestPlay: true,
      onEnded: () => {},
    };
    const { container } = render(<MediaPlayer {...props} />);
    expect(container.firstChild).toBe(null);
  });

  it('should render without crashing when onTogglePlay is defined', () => {
    const props = {
      srcMediaId: '1',
      requestPlay: true,
      onEnded: () => {},
      onTogglePlay: () => {},
    };
    const { container } = render(<MediaPlayer {...props} />);
    expect(container.firstChild).toBe(null);
  });

  it('should render without crashing when onPosition is defined', () => {
    const props = {
      srcMediaId: '1',
      requestPlay: true,
      onEnded: () => {},
      onPosition: () => {},
    };
    const { container } = render(<MediaPlayer {...props} />);
    expect(container.firstChild).toBe(null);
  });

  it('should render without crashing when position is defined', () => {
    const props = {
      srcMediaId: '1',
      requestPlay: true,
      onEnded: () => {},
      position: 1,
    };
    const { container } = render(<MediaPlayer {...props} />);
    expect(container.firstChild).toBe(null);
  });

  it('should render without crashing when onDuration is defined', () => {
    const props = {
      srcMediaId: '1',
      requestPlay: true,
      onEnded: () => {},
      onDuration: () => {},
    };
    const { container } = render(<MediaPlayer {...props} />);
    expect(container.firstChild).toBe(null);
  });

  it('should render without crashing when controls is defined', () => {
    const props = {
      srcMediaId: '1',
      requestPlay: true,
      onEnded: () => {},
      controls: true,
    };
    const { container } = render(<MediaPlayer {...props} />);
    expect(container.firstChild).toBe(null);
  });

  it('should render without crashing when onTogglePlay, onPosition, position, onDuration, and controls are defined', () => {
    const props = {
      srcMediaId: '1',
      requestPlay: true,
      onEnded: () => {},
      onTogglePlay: () => {},
      onPosition: () => {},
      position: 1,
      onDuration: () => {},
      controls: true,
    };
    const { container } = render(<MediaPlayer {...props} />);
    expect(container.firstChild).toBe(null);
  });

  it('returns an error if srcMediaId is not 1', async () => {
    const props = {
      srcMediaId: '2',
      requestPlay: false,
      onEnded: () => {},
    };
    render(<MediaPlayer {...props} />);
    await waitFor(() => expect(mockMediaState.error).toBe('error'));
  });

  it('fetchMediaUrl sets url when srcMediaId is 1', async () => {
    const props = {
      srcMediaId: '1',
      requestPlay: false,
      onEnded: () => {},
    };
    render(<MediaPlayer {...props} />);
    await waitFor(() => expect(mockMediaState.id).toBe('abcd-1'));
    await waitFor(() => expect(mockMediaState.remoteId).toBe('1'));
    await waitFor(() => expect(mockMediaState.error).toBe(''));
    await waitFor(() => expect(mockMediaState.status).toBe(MediaSt.PENDING));
    await waitFor(() => expect(mockMediaState.status).toBe(MediaSt.FETCHED));
    await waitFor(() =>
      expect(mockMediaState.url).toBe('https://localhost/media/1.mp3')
    );
  });
});
