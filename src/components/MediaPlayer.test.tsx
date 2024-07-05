/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
// See: https://www.w3schools.com/TAGS/ref_av_dom.asp
import { cleanup, render, waitFor } from '@testing-library/react';
import { MediaPlayer } from './MediaPlayer';
import { act } from 'react-dom/test-utils';

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
  peerCheckSelector: jest.fn(),
  sharedSelector: jest.fn(),
}));

jest.mock('react-redux', () => ({
  useSelector: () => ({
    afterResource: 'Play from end of resource',
    back3Seconds: 'Skip back 3 seconds',
    resourceStart: 'Play from start of resource',
    mediaError: 'Media error',
  }),
  shallowEqual: jest.fn(),
}));

jest.mock('reactn', () => ({
  useGlobal: () => [jest.fn()],
}));

jest.mock('../utils', () => {
  const logError = jest.fn((error: string, severity: number) => {});
  return {
    logError,
  };
});

describe('<MediaPlayer />', () => {
  beforeEach(cleanup);
  afterEach(() => {
    mockMediaState = { ...mediaClean };
  });

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

  it('should render with an audio player with src', async () => {
    mockMediaState = {
      status: MediaSt.FETCHED,
      error: null,
      url: 'https://localhost/media/1.mp3',
      id: 'apcd-1',
      remoteId: '1',
      cancelled: false,
    };

    const props = {
      srcMediaId: '1',
      requestPlay: false,
      onEnded: () => {},
    };
    const { container } = render(<MediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    expect(container.querySelector('audio')).toBeInTheDocument();
    expect(container.querySelector('audio')).toHaveAttribute(
      'src',
      'https://localhost/media/1.mp3'
    );
  });

  it('should contain controls when controls parameter set', async () => {
    mockMediaState = {
      status: MediaSt.FETCHED,
      error: null,
      url: 'https://localhost/media/1.mp3',
      id: 'apcd-1',
      remoteId: '1',
      cancelled: false,
    };

    const props = {
      srcMediaId: '1',
      requestPlay: false,
      onEnded: () => {},
      controls: true,
    };
    const { container } = render(<MediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    expect(container.querySelector('audio')).toHaveAttribute('controls');
  });

  it('should not call onTogglePlay without requestPlay', async () => {
    mockMediaState = {
      status: MediaSt.FETCHED,
      error: null,
      url: 'https://localhost/media/1.mp3',
      id: 'apcd-1',
      remoteId: '1',
      cancelled: false,
    };

    const props = {
      srcMediaId: '1',
      requestPlay: false,
      onEnded: () => {},
      onTogglePlay: jest.fn(),
    };
    const { container } = render(<MediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    expect(container.querySelector('audio')).toBeInTheDocument();
    expect(props.onTogglePlay).not.toHaveBeenCalled();
  });

  it('should play with requestPlay true', async () => {
    mockMediaState = {
      status: MediaSt.FETCHED,
      error: null,
      url: 'https://localhost/media/1.mp3',
      id: 'apcd-1',
      remoteId: '1',
      cancelled: false,
    };

    const props = {
      srcMediaId: '1',
      requestPlay: true,
      onEnded: () => {},
    };

    const playStub = jest
      .spyOn(window.HTMLMediaElement.prototype, 'play')
      .mockImplementation(() => new Promise(() => {}));
    const { container } = render(<MediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    expect(playStub).toHaveBeenCalled();
    playStub.mockRestore();
  });

  it('should call OnTogglePlay with pause event and requestPlay true', async () => {
    mockMediaState = {
      status: MediaSt.FETCHED,
      error: null,
      url: 'https://localhost/media/1.mp3',
      id: 'apcd-1',
      remoteId: '1',
      cancelled: false,
    };

    const props = {
      srcMediaId: '1',
      requestPlay: true,
      onEnded: () => {},
      onTogglePlay: jest.fn(),
    };

    const playStub = jest
      .spyOn(window.HTMLMediaElement.prototype, 'play')
      .mockImplementation(() => new Promise(() => {}));
    const { container } = render(<MediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    container.querySelector('audio')?.dispatchEvent(new Event('pause'));
    expect(props.onTogglePlay).toHaveBeenCalled();
    expect(playStub).toHaveBeenCalled();
    playStub.mockRestore();
  });

  it('should call onEnded with ended event and requestPlay true', async () => {
    mockMediaState = {
      status: MediaSt.FETCHED,
      error: null,
      url: 'https://localhost/media/1.mp3',
      id: 'apcd-1',
      remoteId: '1',
      cancelled: false,
    };

    const props = {
      srcMediaId: '1',
      requestPlay: false,
      onEnded: jest.fn(),
    };

    const { container } = render(<MediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    act(() => {
      container.querySelector('audio')?.dispatchEvent(new Event('ended'));
    });
    expect(props.onEnded).toHaveBeenCalled();
  });
});
