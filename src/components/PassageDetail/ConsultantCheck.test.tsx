import { cleanup, render, screen } from '@testing-library/react';
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
  findRecord: () => ({
    attributes: {
      tool: '{"tool": "record"}',
    },
  }),
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
  ActionRow: ({ children }: { children: any }) => (
    <div>ActionRow{children}</div>
  ),
  AltButton: () => <div>AltButton</div>,
  PriButton: () => <div>PriButton</div>,
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
    expect(screen.getByText('ActionRow')).not.toBe(null);
  });

  it('should render PriButton', () => {
    mockWorkflow = [
      {
        id: '1',
        label: 'Record',
      },
    ];
    render(<ConsultantCheck width={500} />);
    expect(screen.getByText('PriButton')).not.toBe(null);
  });
});
