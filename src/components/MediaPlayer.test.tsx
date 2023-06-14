/* eslint-disable testing-library/no-node-access */
/* eslint-disable testing-library/no-container */
import { cleanup, render } from '@testing-library/react';
import { MediaPlayer } from './MediaPlayer';

const mockFn = jest.fn();

jest.mock('reactn', () => ({
  useGlobal: () => [{}, () => {}],
}));
jest.mock('../crud', () => ({
  useFetchMediaUrl: () => ({
    fetchMediaUrl: mockFn,
    mediaState: { id: '1' },
  }),
  MediaSt: { IDLE: 0, PENDING: 1, FETCHED: 2, ERROR: 3 },
}));
jest.mock('../utils', () => ({
  logError: () => {},
}));
jest.mock('../hoc/SnackBar', () => ({
  useSnackBar: () => ({ showMessage: () => {} }),
}));
jest.mock('../model', () => ({
  ISharedStrings: {
    fileNotFound: 'File not found',
    mediaError: 'Media error',
  },
}));
jest.mock('../selector', () => ({
  sharedSelector: () => {},
}));
jest.mock('react-redux', () => ({
  useSelector: () => {},
  shallowEqual: () => {},
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

  it('should render without crashing when requestPlay is true and onTogglePlay is defined', () => {
    const props = {
      srcMediaId: '1',
      requestPlay: true,
      onEnded: () => {},
      onTogglePlay: () => {},
    };
    const { container } = render(<MediaPlayer {...props} />);
    expect(container.firstChild).toBe(null);
  });

  it('should render without crashing when requestPlay is true and onPosition is defined', () => {
    const props = {
      srcMediaId: '1',
      requestPlay: true,
      onEnded: () => {},
      onPosition: () => {},
    };
    const { container } = render(<MediaPlayer {...props} />);
    expect(container.firstChild).toBe(null);
  });

  it('should render without crashing when requestPlay is true and position is defined', () => {
    const props = {
      srcMediaId: '1',
      requestPlay: true,
      onEnded: () => {},
      position: 1,
    };
    const { container } = render(<MediaPlayer {...props} />);
    expect(container.firstChild).toBe(null);
  });

  it('should render without crashing when requestPlay is true and onDuration is defined', () => {
    const props = {
      srcMediaId: '1',
      requestPlay: true,
      onEnded: () => {},
      onDuration: () => {},
    };
    const { container } = render(<MediaPlayer {...props} />);
    expect(container.firstChild).toBe(null);
  });

  it('should render without crashing when requestPlay is true and controls is defined', () => {
    const props = {
      srcMediaId: '1',
      requestPlay: true,
      onEnded: () => {},
      controls: true,
    };
    const { container } = render(<MediaPlayer {...props} />);
    expect(container.firstChild).toBe(null);
  });

  it('should render without crashing when requestPlay is true and onTogglePlay, onPosition, position, onDuration, and controls are defined', () => {
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

  it('calls fetchMediaUrl with srcMediaId id', () => {
    const props = {
      srcMediaId: '1',
      requestPlay: false,
      onEnded: () => {},
    };
    render(<MediaPlayer {...props} />);
    expect(mockFn).toHaveBeenCalledTimes(1);
    expect(mockFn).toHaveBeenCalledWith({ id: '1' });
  });
});
