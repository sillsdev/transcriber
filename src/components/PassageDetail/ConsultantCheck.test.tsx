import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import ConsultantCheck from './ConsultantCheck';
// import { ToolSlug } from '../../crud/toolSlug';
// import { ArtifactTypeSlug } from '../../crud/artifactTypeSlug';
import { SimpleWf } from '../../context/PassageDetailContext';
import { ArtifactTypeSlug } from '../../crud';

let mockWorkflow: SimpleWf[] = [];

jest.mock('reactn', () => ({
  useGlobal: () => [[], jest.fn()],
}));
jest.mock('../../crud', () => ({
  useArtifactType: () => ({
    localizedArtifactType: (slug: ArtifactTypeSlug) => {
      if (slug === 'vernacular') return 'Vernacular';
      else if (slug === 'backtranslation') return 'Phrase Back Translation';
      else return 'other';
    },
  }),
  findRecord: (memory: any, table: any, id: string) => {
    if (id === '1') return { attributes: { tool: '{"tool": "record"}' } };
    else if (id === '2')
      return { attributes: { tool: '{"tool": "phraseBackTranslate"}' } };
  },
  ArtifactTypeSlug: jest.requireActual('../../crud/artifactTypeSlug')
    .ArtifactTypeSlug,
  ToolSlug: jest.requireActual('../../crud/toolSlug').ToolSlug,
}));
jest.mock('../../context/usePassageDetailContext', () => () => ({
  workflow: mockWorkflow,
  stepComplete: jest.fn(),
  currentstep: '',
}));
jest.mock('./ConsultantCheckReview', () => () => (
  <div>ConsultantCheckReview</div>
));
jest.mock('../StepEditor', () => ({
  ActionRow: jest.requireActual('../../control/ActionRow').ActionRow,
  AltButton: jest.requireActual('../../control/AltButton').AltButton,
  PriButton: jest.requireActual('../../control/PriButton').PriButton,
}));
jest.mock('../../selector', () => ({
  consultantSelector: jest.fn(),
}));
jest.mock('react-redux', () => ({
  useSelector: () => ({
    furtherReview: 'Further Review',
    approved: 'Approved',
  }),
  shallowEqual: jest.fn(),
}));

describe('ConsultantCheck', () => {
  beforeEach(cleanup);

  it('should render', () => {
    const { container } = render(<ConsultantCheck width={500} />);
    expect(container).not.toBe(null);
  });

  it('should render ConsultantCheckReview', () => {
    mockWorkflow = [
      {
        id: '1',
        label: 'Record',
      },
    ];
    render(<ConsultantCheck width={500} />);
    expect(screen.getByText('ConsultantCheckReview')).not.toBe(null);
  });

  it('should render Vernacular tab', () => {
    mockWorkflow = [
      {
        id: '1',
        label: 'Record',
      },
    ];
    render(<ConsultantCheck width={500} />);
    expect(screen.getByText('Vernacular')).not.toBe(null);
  });

  it('should render ActionRow', () => {
    mockWorkflow = [
      {
        id: '1',
        label: 'Record',
      },
    ];
    render(<ConsultantCheck width={500} />);
    expect(screen.getByTestId('action-row')).not.toBe(null);
  });

  it('should render PriButton', () => {
    mockWorkflow = [
      {
        id: '1',
        label: 'Record',
      },
    ];
    render(<ConsultantCheck width={500} />);
    expect(screen.getByTestId('pri-button')).not.toBe(null);
  });

  it('should render Alt Button when Pri Button is clicked', () => {
    mockWorkflow = [
      {
        id: '1',
        label: 'Record',
      },
    ];
    render(<ConsultantCheck width={500} />);
    fireEvent.click(screen.getByTestId('pri-button'));
    expect(screen.getByTestId('alt-button')).not.toBe(null);
    expect(screen.queryAllByTestId('pri-button')).toHaveLength(0);
  });

  it('should render remain selected when its the only tab and Pri Button is clicked', () => {
    mockWorkflow = [
      {
        id: '1',
        label: 'Record',
      },
    ];
    render(<ConsultantCheck width={500} />);
    fireEvent.click(screen.getByTestId('pri-button'));
    expect(screen.getByText('Vernacular')).toHaveClass('Mui-selected');
  });

  it('should have a second tab when workflow has the right two items', () => {
    mockWorkflow = [
      {
        id: '1',
        label: 'Record',
      },
      {
        id: '2',
        label: 'Phrase Back Translation',
      },
    ];
    render(<ConsultantCheck width={500} />);
    expect(screen.getByText('Vernacular')).not.toBe(null);
    expect(screen.getByText('Phrase Back Translation')).not.toBe(null);
  });

  it('should have selected PBT when it has two items', () => {
    mockWorkflow = [
      {
        id: '1',
        label: 'Record',
      },
      {
        id: '2',
        label: 'Phrase Back Translation',
      },
    ];
    render(<ConsultantCheck width={500} />);
    expect(screen.getByText('Phrase Back Translation')).not.toBe(null);
    expect(screen.getByText('Phrase Back Translation')).toHaveClass(
      'Mui-selected'
    );
  });

  it('should select Vernacular when the primary button is clicked', () => {
    mockWorkflow = [
      {
        id: '1',
        label: 'Record',
      },
      {
        id: '2',
        label: 'Phrase Back Translation',
      },
    ];
    render(<ConsultantCheck width={500} />);
    fireEvent.click(screen.getByTestId('pri-button'));
    expect(screen.getByText('Vernacular')).not.toBe(null);
    expect(screen.getByText('Vernacular')).toHaveClass('Mui-selected');
  });
});
