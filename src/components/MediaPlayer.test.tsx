/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
// See: https://www.w3schools.com/TAGS/ref_av_dom.asp
import {
  cleanup,
  render,
  waitFor,
  screen,
  fireEvent,
} from '@testing-library/react';
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

  it('should render without crashing when limits are defined', () => {
    const props = {
      srcMediaId: '1',
      requestPlay: true,
      onEnded: () => {},
      limits: { start: 0, end: 100 },
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

  it('should render without crashing when onTogglePlay, limits, and controls are defined', () => {
    const props = {
      srcMediaId: '1',
      requestPlay: true,
      onEnded: () => {},
      onTogglePlay: () => {},
      controls: true,
      limits: { start: 0, end: 100 },
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

  it('should set currentTime if limits set', async () => {
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
      limits: { start: 10, end: 100 },
      onLoaded: jest.fn(),
    };

    const currentTime = jest.fn();
    const currentTimeStub = jest
      .spyOn(window.HTMLMediaElement.prototype, 'currentTime', 'set')
      .mockImplementation(currentTime);
    const { container } = render(<MediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    container
      .querySelector('audio')
      ?.dispatchEvent(new Event('durationchange'));
    expect(props.onLoaded).toHaveBeenCalled();
    await waitFor(() => expect(currentTime).toHaveBeenCalledWith(10));
    currentTimeStub.mockRestore();
  });

  it('should call onEnded if timeUpdate is more than limits.end', async () => {
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
      limits: { start: 10, end: 100 },
    };

    const pauseFn = jest.fn();
    const pauseStub = jest
      .spyOn(window.HTMLMediaElement.prototype, 'pause')
      .mockImplementation(pauseFn);
    const currentTimeStub = jest
      .spyOn(window.HTMLMediaElement.prototype, 'currentTime', 'get')
      .mockImplementation(() => 101);
    const { container } = render(<MediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    act(() => {
      // durationchange sets the stop value
      container
        .querySelector('audio')
        ?.dispatchEvent(new Event('durationchange'));
      container.querySelector('audio')?.dispatchEvent(new Event('timeupdate'));
    });
    expect(props.onEnded).toHaveBeenCalled();
    expect(pauseFn).toHaveBeenCalled();
    currentTimeStub.mockRestore();
    pauseStub.mockRestore();
  });

  it('should not call onEnded if timeUpdate is less than limits.end', async () => {
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
      limits: { start: 10, end: 100 },
    };

    const pauseFn = jest.fn();
    const pauseStub = jest
      .spyOn(window.HTMLMediaElement.prototype, 'pause')
      .mockImplementation(pauseFn);
    const currentTimeStub = jest
      .spyOn(window.HTMLMediaElement.prototype, 'currentTime', 'get')
      .mockImplementation(() => 95);
    const { container } = render(<MediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    act(() => {
      // durationchange sets the stop value
      container
        .querySelector('audio')
        ?.dispatchEvent(new Event('durationchange'));
      container.querySelector('audio')?.dispatchEvent(new Event('timeupdate'));
    });
    expect(props.onEnded).not.toHaveBeenCalled();
    expect(pauseFn).not.toHaveBeenCalled();
    currentTimeStub.mockRestore();
    pauseStub.mockRestore();
  });

  it('should include extra controls if limits set', async () => {
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
      limits: { start: 10, end: 100 },
    };

    const { container } = render(<MediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    expect(screen.getByTestId('segment-start')).toBeInTheDocument();
    expect(screen.getByTestId('skip-back')).toBeInTheDocument();
    // skip-next needs the limits.end to be less than the duration
    expect(screen.queryByTestId('skip-next')).toBeNull();
  });

  it('should include skip-next if limits set and duration is greater than limits.end', async () => {
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
      limits: { start: 10, end: 100 },
    };

    const durationStub = jest
      .spyOn(window.HTMLMediaElement.prototype, 'duration', 'get')
      .mockImplementation(() => 200);
    const { container } = render(<MediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    act(() => {
      container
        .querySelector('audio')
        ?.dispatchEvent(new Event('durationchange'));
    });
    expect(screen.getByTestId('skip-next')).toBeInTheDocument();
    durationStub.mockRestore();
  });

  it('should set currentTime to start if segment-start clicked', async () => {
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
      controls: true,
      limits: { start: 10, end: 100 },
    };

    const currentTimeGetStub = jest
      .spyOn(window.HTMLMediaElement.prototype, 'currentTime', 'get')
      .mockImplementation(() => 95);
    const currentTimeFn = jest.fn();
    const currentTimeSetStub = jest
      .spyOn(window.HTMLMediaElement.prototype, 'currentTime', 'set')
      .mockImplementation(currentTimeFn);
    const { container } = render(<MediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    const startEl = screen.getByTestId('segment-start');
    expect(startEl).toBeInTheDocument();
    act(() => {
      startEl.click();
    });
    expect(currentTimeFn).toHaveBeenCalledWith(10);
    currentTimeGetStub.mockRestore();
    currentTimeSetStub.mockRestore();
  });

  it('should set currentTime back 3 if skip-back clicked', async () => {
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
      controls: true,
      limits: { start: 10, end: 100 },
    };

    const currentTimeGetStub = jest
      .spyOn(window.HTMLMediaElement.prototype, 'currentTime', 'get')
      .mockImplementation(() => 95.5);
    const currentTimeFn = jest.fn();
    const currentTimeSetStub = jest
      .spyOn(window.HTMLMediaElement.prototype, 'currentTime', 'set')
      .mockImplementation(currentTimeFn);
    const { container } = render(<MediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    const backEl = screen.getByTestId('skip-back');
    expect(backEl).toBeInTheDocument();
    act(() => {
      backEl.click();
    });
    expect(currentTimeFn).toHaveBeenCalledWith(92.5);
    currentTimeGetStub.mockRestore();
    currentTimeSetStub.mockRestore();
  });

  it('should set currentTime to end if skip-next clicked', async () => {
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
      controls: true,
      limits: { start: 10, end: 100 },
    };

    const durationStub = jest
      .spyOn(window.HTMLMediaElement.prototype, 'duration', 'get')
      .mockImplementation(() => 200);
    const currentTimeGetStub = jest
      .spyOn(window.HTMLMediaElement.prototype, 'currentTime', 'get')
      .mockImplementation(() => 95);
    const currentTimeFn = jest.fn();
    const currentTimeSetStub = jest
      .spyOn(window.HTMLMediaElement.prototype, 'currentTime', 'set')
      .mockImplementation(currentTimeFn);
    const { container } = render(<MediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    act(() => {
      // duration must be set for skip-next to be rendered
      container
        .querySelector('audio')
        ?.dispatchEvent(new Event('durationchange'));
    });
    const nextEl = screen.getByTestId('skip-next');
    expect(nextEl).toBeInTheDocument();
    act(() => {
      nextEl.click();
    });
    expect(currentTimeFn).toHaveBeenCalledWith(100);
    currentTimeGetStub.mockRestore();
    currentTimeSetStub.mockRestore();
    durationStub.mockRestore();
  });

  it('should set playbackRate when speed button menu item chosen', async () => {
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
      controls: true,
      limits: { start: 10, end: 100 },
    };

    const durationStub = jest
      .spyOn(window.HTMLMediaElement.prototype, 'duration', 'get')
      .mockImplementation(() => 200);
    const rateFn = jest.fn();
    const rateSetStub = jest
      .spyOn(window.HTMLMediaElement.prototype, 'playbackRate', 'set')
      .mockImplementation(rateFn);
    const { container } = render(<MediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    act(() => {
      // duration must be set for speed-button to be rendered
      container
        .querySelector('audio')
        ?.dispatchEvent(new Event('durationchange'));
    });
    const nextEl = screen.getByTestId('speed-button');
    expect(nextEl).toBeInTheDocument();
    act(() => {
      nextEl.click();
    });
    await screen.findByTestId('speed-menu');
    fireEvent.click(screen.getByText('1.5x'));
    expect(rateFn).toHaveBeenCalledWith(1.5);
    rateSetStub.mockRestore();
    durationStub.mockRestore();
  });

  it('should show negative time when if currentTime is less than start', async () => {
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
      controls: true,
      limits: { start: 10, end: 100 },
    };

    const currentTimeGetStub = jest
      .spyOn(window.HTMLMediaElement.prototype, 'currentTime', 'get')
      .mockImplementation(() => 5);
    const { container } = render(<MediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    expect(screen.getByText('-0:10')).toBeInTheDocument();
    currentTimeGetStub.mockRestore();
  });
});
