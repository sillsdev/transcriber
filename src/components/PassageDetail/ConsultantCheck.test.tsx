import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import ConsultantCheck from './ConsultantCheck';
import { SimpleWf } from '../../context/PassageDetailContext';
import { ArtifactTypeSlug } from '../../crud';

let mockWorkflow: SimpleWf[] = [];
let mockSetStepComplete = jest.fn();
let mockCurrentStep = '';
let mockCompare: string[] = [];
var mockPassageStepComplete: string | null = null;
var mockUpdateRecord = jest.fn();

jest.mock('reactn', () => ({
  useGlobal: (token: string) => {
    if (token === 'remoteBusy') return [false, jest.fn()];
    else return [null, jest.fn()];
  },
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
  useOrgDefaults: () => ({
    getOrgDefault: () => {
      return mockCompare;
    },
    setOrgDefault: jest.fn(),
  }),
  useUpdateRecord: () => mockUpdateRecord,
  ArtifactTypeSlug: jest.requireActual('../../crud/artifactTypeSlug')
    .ArtifactTypeSlug,
  ToolSlug: jest.requireActual('../../crud/toolSlug').ToolSlug,
}));
jest.mock('../../context/usePassageDetailContext', () => () => ({
  workflow: mockWorkflow,
  stepComplete: () => false,
  setStepComplete: mockSetStepComplete,
  currentstep: mockCurrentStep,
  passage: { attributes: { stepComplete: mockPassageStepComplete } },
}));
jest.mock('../MediaPlayer', () => () => <div>MediaPlayer</div>);
jest.mock('./ConsultantCheckReview', () => ({ item }: { item: string }) => (
  <>
    <div>ConsultantCheckReview</div>
    <div>{item}</div>
  </>
));
jest.mock('../../control', () => ({
  ActionRow: jest.requireActual('../../control/ActionRow').ActionRow,
  AltButton: jest.requireActual('../../control/AltButton').AltButton,
  PriButton: jest.requireActual('../../control/PriButton').PriButton,
  GrowingDiv: jest.requireActual('../../control/GrowingDiv').GrowingDiv,
}));
jest.mock('../../selector', () => ({
  consultantSelector: jest.fn(),
  sharedSelector: jest.fn(),
}));
jest.mock('react-redux', () => ({
  useSelector: () => ({
    furtherReview: 'Further Review',
    approved: 'Approved',
    wait: 'Please wait.',
  }),
  shallowEqual: jest.fn(),
}));
jest.mock('../../hoc/BigDialog', () => (props: any) => (
  <>
    <div>BigDialog</div>
    <div>{props.isOpen ? 'compare-open' : 'compare-close'}</div>
    <div>{props.children}</div>
  </>
));
jest.mock('./ConsultantCheckCompare', () => (props: any) => (
  <>
    <div>ConsultantCheckCompare</div>
    <div>{JSON.stringify(props, null, 2)}</div>
  </>
));
jest.mock('../../model/baseModel', () => ({
  UpdateRecord: jest.fn(),
}));
jest.mock('@orbit/data', () => ({
  TransformBuilder: jest.fn(),
}));
jest.mock('../../hoc/SnackBar', () => ({
  useSnackBar: () => ({
    showMessage: (message: string) => <div>{message}</div>,
  }),
}));

describe('ConsultantCheck', () => {
  beforeEach(cleanup);
  afterEach(() => {
    mockWorkflow = [];
    mockCurrentStep = '';
    mockCompare = [];
    mockPassageStepComplete = null;
    mockSetStepComplete.mockClear();
    mockUpdateRecord.mockClear();
  });

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
    expect(screen.getByText('vernacular')).not.toBe(null);
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
    // eslint-disable-next-line testing-library/no-unnecessary-act
    fireEvent.click(screen.getByTestId('pri-button'));
    expect(screen.getByTestId('alt-button')).not.toBe(null);
    expect(screen.queryAllByTestId('pri-button')).toHaveLength(0);
  });

  it('should render remain selected when its the only tab and Pri Button is clicked', async () => {
    mockWorkflow = [
      {
        id: '1',
        label: 'Record',
      },
    ];
    mockCurrentStep = 'record';
    render(<ConsultantCheck width={500} />);
    fireEvent.click(screen.getByTestId('pri-button'));
    expect(screen.getByText('Vernacular')).toHaveClass('Mui-selected');
    await waitFor(() => expect(mockSetStepComplete).toBeCalledTimes(1));
    expect(mockSetStepComplete).toBeCalledWith('record', true);
  });

  it('should update passage record and include completed when Pri Button is clicked', async () => {
    mockWorkflow = [
      {
        id: '1',
        label: 'Record',
      },
    ];
    mockCurrentStep = 'record';
    render(<ConsultantCheck width={500} />);
    fireEvent.click(screen.getByTestId('pri-button'));
    await waitFor(() => expect(mockSetStepComplete).toBeCalledTimes(1));
    expect(mockSetStepComplete).toBeCalledWith('record', true);
    expect(mockUpdateRecord).toBeCalledTimes(1);
    const stepCompleteJson =
      mockUpdateRecord['mock'].calls[0][0]?.attributes?.stepComplete;
    const result = JSON.parse(stepCompleteJson);
    expect(result.completed).toEqual([]);
  });

  it('should update passage record and keep completed when Pri Button is clicked', async () => {
    mockWorkflow = [
      {
        id: '1',
        label: 'Record',
      },
    ];
    mockCurrentStep = 'record';
    mockPassageStepComplete = `{"completed":["record"]}`;
    render(<ConsultantCheck width={500} />);
    fireEvent.click(screen.getByTestId('pri-button'));
    await waitFor(() => expect(mockSetStepComplete).toBeCalledTimes(1));
    expect(mockSetStepComplete).toBeCalledWith('record', true);
    expect(mockUpdateRecord).toBeCalledTimes(1);
    const stepCompleteJson =
      mockUpdateRecord['mock'].calls[0][0]?.attributes?.stepComplete;
    const result = JSON.parse(stepCompleteJson);
    expect(result.completed).toEqual(['record']);
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

  it('should open the compare dialog when compare button clicked', () => {
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
    expect(screen.getByText('compare-close')).toBeInTheDocument();
    fireEvent.click(screen.getByTestId('compare-button'));
    expect(screen.getByText('compare-open')).toBeInTheDocument();
  });

  it('should not have a compare button with one artifact type', () => {
    mockWorkflow = [
      {
        id: '1',
        label: 'Record',
      },
    ];
    render(<ConsultantCheck width={500} />);
    expect(screen.queryAllByTestId('compare-button')).toHaveLength(0);
  });

  it('should render a table if compare set', () => {
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
    mockCompare = ['1', '2'];
    const { container } = render(<ConsultantCheck width={500} />);
    // eslint-disable-next-line testing-library/no-node-access, testing-library/no-container
    expect(container.querySelector('table')).toBeInTheDocument();
  });

  it('should only include each artifact type once in the list of tabs', () => {
    mockWorkflow = [
      {
        id: '1',
        label: 'Record',
      },
      {
        id: '2',
        label: 'Phrase Back Translation',
      },
      {
        id: '3',
        label: 'Phrase Back Translation',
      },
    ];
    render(<ConsultantCheck width={500} />);
    expect(screen.queryAllByText('Phrase Back Translation')).toHaveLength(1);
  });
});
