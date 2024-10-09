/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
// See: https://www.w3schools.com/TAGS/ref_av_dom.asp
import { cleanup, render, waitFor, screen } from '@testing-library/react';
import { LimitedMediaPlayer } from './LimitedMediaPlayer';
import { act } from 'react-dom/test-utils';
import userEvent from '@testing-library/user-event';
import { HiddenPlayerProps } from './HiddenPlayer';

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

enum BlobStatus {
  'IDLE',
  'PENDING',
  'RESET', // 403 when getting blob
  'FETCHED',
  'ERROR',
}

interface IBlobState extends IMediaState {
  blob: Blob;
  blobStat: BlobStatus;
}

var mediaClean = {
  status: MediaSt.IDLE,
  error: null,
  url: '',
  id: '',
  remoteId: '',
  cancelled: false,
};
var mockBlobClean = {
  ...mediaClean,
  blob: new Blob(),
  blobStat: BlobStatus.IDLE,
};
var mockBlobState: IBlobState = { ...mockBlobClean };

var blobFetched = {
  ...mockBlobClean,
  blobStat: BlobStatus.FETCHED,
  url: 'https://localhost/media/1.mp3',
  id: 'apcd-1',
  remoteId: '1',
};

var mockFetchBlob = jest.fn();

var mockOnProgress = jest.fn();
var mockOnDuration = jest.fn();
var mockPosition = 0;
var mockSetPlaying = jest.fn();

jest.mock('./HiddenPlayer', () => (props: HiddenPlayerProps) => {
  mockOnProgress = props.onProgress as any;
  mockOnDuration = props.onDuration as any;
  mockPosition = props.position as any;
  mockSetPlaying = props.setPlaying as any;
  return <div id="hiddenplayer" />;
});

jest.mock('../crud/useFetchMediaBlob', () => {
  const BlobStatus = {
    IDLE: 0,
    PENDING: 1,
    RESET: 2,
    FETCHED: 3,
    ERROR: 4,
  };
  return {
    useFetchMediaBlob: (id: string) => {
      return [mockBlobState, mockFetchBlob];
    },
    BlobStatus,
  };
});

jest.mock('../selector', () => ({
  peerCheckSelector: jest.fn(),
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

jest.mock('../utils', () => {
  const logError = jest.fn((error: string, severity: number) => {});
  return {
    logError,
  };
});

describe('<LimitedMediaPlayer />', () => {
  beforeEach(cleanup);
  afterEach(() => {
    mockBlobState = { ...mockBlobClean };
  });

  it('should render without crashing when limits are defined', () => {
    const props = {
      srcMediaId: '1',
      requestPlay: true,
      onEnded: () => {},
      limits: { start: 0, end: 100 },
    };
    const { container } = render(<LimitedMediaPlayer {...props} />);
    expect(container.firstChild).toBe(null);
  });

  it('should render without crashing when limits are zeros', () => {
    const props = {
      srcMediaId: '1',
      requestPlay: true,
      onEnded: () => {},
      limits: { start: 0, end: 0 },
    };
    const { container } = render(<LimitedMediaPlayer {...props} />);
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
    const { container } = render(<LimitedMediaPlayer {...props} />);
    expect(container.firstChild).toBe(null);
  });

  it('should set currentTime if limits set', async () => {
    mockBlobState = { ...blobFetched };

    const props = {
      srcMediaId: '1',
      requestPlay: false,
      onEnded: () => {},
      limits: { start: 10, end: 100 },
      onLoaded: jest.fn(),
    };

    const { container } = render(<LimitedMediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    expect(props.onLoaded).toHaveBeenCalled();
    expect(mockPosition).toBe(10);
  });

  it('should set currentTime if limits are zeros', async () => {
    mockBlobState = { ...blobFetched };

    const props = {
      srcMediaId: '1',
      requestPlay: false,
      onEnded: () => {},
      limits: { start: 0, end: 0 },
      onLoaded: jest.fn(),
    };

    const { container } = render(<LimitedMediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    expect(props.onLoaded).toHaveBeenCalled();
    expect(mockPosition).toBe(0);
  });

  it('should call onEnded if timeUpdate is more than limits.end', async () => {
    mockBlobState = { ...blobFetched };

    const props = {
      srcMediaId: '1',
      requestPlay: false,
      onEnded: jest.fn(),
      limits: { start: 10, end: 100 },
    };

    const { container } = render(<LimitedMediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    act(() => {
      mockOnDuration(200);
      mockSetPlaying(true);
      mockOnProgress(101);
    });
    expect(props.onEnded).toHaveBeenCalled();
  });

  it('should set length when limist.end set', async () => {
    mockBlobState = { ...blobFetched };

    const props = {
      srcMediaId: '1',
      requestPlay: false,
      onEnded: jest.fn(),
      controls: true,
      limits: { start: 10, end: 100 },
    };

    const { container } = render(<LimitedMediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    await screen.findAllByText('1:30');
  });

  it('should set length to duration', async () => {
    mockBlobState = { ...blobFetched };

    const props = {
      srcMediaId: '1',
      requestPlay: false,
      onEnded: jest.fn(),
      controls: true,
      limits: { start: 0, end: 0 },
    };

    let { container, rerender } = render(<LimitedMediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    // eslint-disable-next-line testing-library/no-unnecessary-act
    act(() => {
      mockOnDuration(200);
    });
    rerender(<LimitedMediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    expect(screen.getByText('3:20')).toBeTruthy();
  });

  it('should set length to limits even if duration set', async () => {
    mockBlobState = { ...blobFetched };

    const props = {
      srcMediaId: '1',
      requestPlay: false,
      onEnded: jest.fn(),
      controls: true,
      limits: { start: 10, end: 100 },
    };

    let { container, rerender } = render(<LimitedMediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    // eslint-disable-next-line testing-library/no-unnecessary-act
    act(() => {
      mockOnDuration(200);
    });
    rerender(<LimitedMediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    expect(screen.getByText('1:30')).toBeTruthy();
  });

  it('should call onEnded if timeUpdate is at end', async () => {
    mockBlobState = { ...blobFetched };

    const props = {
      srcMediaId: '1',
      requestPlay: false,
      onEnded: jest.fn(),
      limits: { start: 0, end: 0 },
    };

    const { container } = render(<LimitedMediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    act(() => {
      mockOnDuration(200);
      mockSetPlaying(true);
      mockOnProgress(200);
    });
    expect(props.onEnded).toHaveBeenCalled();
  });


  it('should not call onEnded if timeUpdate is less than limits.end', async () => {
    mockBlobState = { ...blobFetched };

    const props = {
      srcMediaId: '1',
      requestPlay: false,
      onEnded: jest.fn(),
      limits: { start: 10, end: 100 },
    };

    const { container } = render(<LimitedMediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    act(() => {
      mockOnDuration(200);
      mockSetPlaying(true);
      mockOnProgress(95);
    });
    expect(props.onEnded).not.toHaveBeenCalled();
  });

  it('should not call onEnded if timeUpdate is less than duration', async () => {
    mockBlobState = { ...blobFetched };

    const props = {
      srcMediaId: '1',
      requestPlay: false,
      onEnded: jest.fn(),
      limits: { start: 0, end: 0 },
    };

    const { container } = render(<LimitedMediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    act(() => {
      mockOnDuration(200);
      mockSetPlaying(true);
      mockOnProgress(95);
    });
    expect(props.onEnded).not.toHaveBeenCalled();
  });

  it('should include extra controls if limits set', async () => {
    mockBlobState = { ...blobFetched };

    const props = {
      srcMediaId: '1',
      requestPlay: false,
      onEnded: () => {},
      controls: true,
      limits: { start: 10, end: 100 },
    };

    const { container } = render(<LimitedMediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    expect(screen.getByTestId('segment-start')).toBeInTheDocument();
    expect(screen.getByTestId('skip-back')).toBeInTheDocument();
    // skip-next needs the limits.end to be less than the duration
    expect(screen.queryByTestId('skip-next')).toBeNull();
  });

  it('should include extra controls if limits set to zero', async () => {
    mockBlobState = { ...blobFetched };

    const props = {
      srcMediaId: '1',
      requestPlay: false,
      onEnded: () => {},
      controls: true,
      limits: { start: 0, end: 0 },
    };

    const { container } = render(<LimitedMediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    expect(screen.getByTestId('segment-start')).toBeInTheDocument();
    expect(screen.getByTestId('skip-back')).toBeInTheDocument();
    // skip-next needs the limits.end to be less than the duration
    expect(screen.queryByTestId('skip-next')).toBeNull();
  });

  it('should include skip-next if limits set and duration is greater than limits.end', async () => {
    mockBlobState = { ...blobFetched };

    const props = {
      srcMediaId: '1',
      requestPlay: false,
      onEnded: () => {},
      controls: true,
      limits: { start: 10, end: 100 },
    };

    const { container } = render(<LimitedMediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    act(() => {
      mockOnDuration(200);
    });
    expect(screen.getByTestId('skip-next')).toBeInTheDocument();
  });

  it('should set currentTime to start if segment-start clicked', async () => {
    const user = userEvent.setup();
    mockBlobState = { ...blobFetched };

    const props = {
      srcMediaId: '1',
      requestPlay: false,
      onEnded: jest.fn(),
      controls: true,
      limits: { start: 10, end: 100 },
    };

    const { container } = render(<LimitedMediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    const startEl = screen.getByTestId('segment-start');
    await screen.findByText('1:30');
    act(() => {
      mockSetPlaying(true);
      mockOnProgress(50);
    });
    await screen.findByText('0:40');
    expect(startEl).toBeInTheDocument();
    user.click(startEl);
    await waitFor(() => expect(mockPosition).toBe(10));
  });

  it('should set currentTime back 3 if skip-back clicked', async () => {
    const user = userEvent.setup();
    mockBlobState = { ...blobFetched };

    const props = {
      srcMediaId: '1',
      requestPlay: false,
      onEnded: jest.fn(),
      controls: true,
      limits: { start: 10, end: 100 },
    };

    const { container } = render(<LimitedMediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    await screen.findByText('1:30');
    act(() => {
      mockSetPlaying(true);
      mockOnProgress(50);
    });
    await screen.findByText('0:40');
    const backEl = screen.getByTestId('skip-back');
    expect(backEl).toBeInTheDocument();
    user.click(backEl);
    await waitFor(() => expect(mockPosition).toBe(47));
  });

  it('should set currentTime back 3 if skip-back clicked and limits are zeros', async () => {
    const user = userEvent.setup();
    mockBlobState = { ...blobFetched };

    const props = {
      srcMediaId: '1',
      requestPlay: false,
      onEnded: jest.fn(),
      controls: true,
      limits: { start: 0, end: 0 },
    };

    const { container } = render(<LimitedMediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    act(() => {
      mockSetPlaying(true);
      mockOnProgress(50);
    });
    await screen.findByText('0:50');
    user.click(screen.getByTestId('skip-back'));
    await waitFor(() => expect(mockPosition).toBe(47));
  });

  it('should set currentTime to end if skip-next clicked', async () => {
    const user = userEvent.setup();
    mockBlobState = { ...blobFetched };

    const props = {
      srcMediaId: '1',
      requestPlay: false,
      onEnded: jest.fn(),
      controls: true,
      limits: { start: 10, end: 100 },
    };

    const { container } = render(<LimitedMediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    act(() => {
      mockOnDuration(200);
    });
    const nextEl = screen.getByTestId('skip-next');
    expect(nextEl).toBeInTheDocument();
    user.click(nextEl);
    await waitFor(() => expect(mockPosition).toBe(100));
  });

  it('should set currentTime to end if skip-next clicked and limits are zeros', async () => {
    const user = userEvent.setup();
    mockBlobState = { ...blobFetched };

    const props = {
      srcMediaId: '1',
      requestPlay: false,
      onEnded: jest.fn(),
      controls: true,
      limits: { start: 0, end: 0 },
    };

    const { container } = render(<LimitedMediaPlayer {...props} />);
    await waitFor(() => expect(container.firstChild).not.toBe(null));
    act(() => {
      mockOnDuration(200);
    });
    user.click(screen.getByTestId('skip-next'));
    await waitFor(() => expect(mockPosition).toBe(200));
  });

  it('should show negative time when if currentTime is less than start', async () => {
    const user = userEvent.setup();
    mockBlobState = { ...blobFetched };

    const props = {
      srcMediaId: '1',
      requestPlay: false,
      onEnded: jest.fn(),
      controls: true,
      limits: { start: 10, end: 100 },
    };

    render(<LimitedMediaPlayer {...props} />);
    expect(await screen.findByTestId('skip-back')).toBeInTheDocument();
    user.click(screen.getByTestId('skip-back'));
    await screen.findByText('-0:03');
  });
});
