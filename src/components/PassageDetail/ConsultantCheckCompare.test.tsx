import { cleanup, render, screen } from '@testing-library/react';
import ConsultantCheckCompare from './ConsultantCheckCompare';

jest.mock('react-redux', () => ({
  useSelector: () => ({
    cancel: 'Cancel',
    save: 'Save',
  }),
  shallowEqual: jest.fn(),
}));
jest.mock('../../crud', () => ({
  useArtifactType: () => ({
    localizedArtifactType: (item: string) => item,
  }),
}));
jest.mock('../../selector', () => ({
  sharedSelector: jest.fn(),
}));
jest.mock('../../control', () => ({
  ActionRow: jest.requireActual('../../control/ActionRow').ActionRow,
  AltButton: jest.requireActual('../../control/AltButton').AltButton,
  PriButton: jest.requireActual('../../control/PriButton').PriButton,
  GrowingDiv: jest.requireActual('../../control/GrowingDiv').GrowingDiv,
}));

describe('ConsultantCheckCompare', () => {
  beforeEach(cleanup);

  it('should render ConsultantCheckCompare', () => {
    const props = {
      compare: [],
      allItems: [],
      onChange: function (compare: string[]): void {},
    };

    const { container } = render(<ConsultantCheckCompare {...props} />);
    expect(container).not.toBe(null);
  });

  it('should render ConsultantCheckCompare with compare', () => {
    const props = {
      compare: ['1'],
      allItems: ['1', '2'],
      onChange: function (compare: string[]): void {},
    };

    const { container } = render(<ConsultantCheckCompare {...props} />);
    expect(container).not.toBe(null);
  });

  it('should render ConsultantCheckCompare with allItems', () => {
    const props = {
      compare: [],
      allItems: ['1', '2'],
      onChange: function (compare: string[]): void {},
    };

    const { container } = render(<ConsultantCheckCompare {...props} />);
    expect(container).not.toBe(null);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('should render ConsultantCheckCompare with allItems and compare', () => {
    const props = {
      compare: ['1'],
      allItems: ['1', '2'],
      onChange: function (compare: string[]): void {},
    };

    const { container } = render(<ConsultantCheckCompare {...props} />);
    expect(container).not.toBe(null);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-0')).toHaveClass('Mui-checked');
    expect(screen.getByTestId('checkbox-1')).not.toHaveClass('Mui-checked');
  });

  it('should return compare value if cancel is clicked', () => {
    const props = {
      compare: ['1'],
      allItems: ['1', '2'],
      onChange: jest.fn(),
    };

    const { container } = render(<ConsultantCheckCompare {...props} />);
    expect(container).not.toBe(null);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-0')).toHaveClass('Mui-checked');
    expect(screen.getByTestId('checkbox-1')).not.toHaveClass('Mui-checked');

    screen.getByText('Cancel').click();

    expect(props.onChange).toHaveBeenCalledWith(['1']);
  });

  it('should return compare value if save is clicked', () => {
    const props = {
      compare: ['1'],
      allItems: ['1', '2'],
      onChange: jest.fn(),
    };

    const { container } = render(<ConsultantCheckCompare {...props} />);
    expect(container).not.toBe(null);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-0')).toHaveClass('Mui-checked');
    expect(screen.getByTestId('checkbox-1')).not.toHaveClass('Mui-checked');

    screen.getByText('Save').click();

    expect(props.onChange).toHaveBeenCalledWith(['1']);
  });

  it('should return allItems value if save is clicked after checking 2', () => {
    const props = {
      compare: ['1'],
      allItems: ['1', '2'],
      onChange: jest.fn(),
    };

    const { container } = render(<ConsultantCheckCompare {...props} />);
    expect(container).not.toBe(null);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('2')).toBeInTheDocument();
    expect(screen.getByTestId('checkbox-0')).toHaveClass('Mui-checked');
    expect(screen.getByTestId('checkbox-1')).not.toHaveClass('Mui-checked');

    screen.getByTestId('checkbox-1').click();
    screen.getByText('Save').click();

    expect(props.onChange).toHaveBeenCalledWith(['1', '2']);
  });
});
