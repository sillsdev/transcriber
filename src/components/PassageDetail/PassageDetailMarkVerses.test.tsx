/* eslint-disable testing-library/no-unnecessary-act */
/* eslint-disable testing-library/no-node-access */
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UnsavedProvider } from '../../context/UnsavedContext';
import PassageDetailMarkVerses, {
  MarkVersesProps,
} from './PassageDetailMarkVerses';
import { PassageD, OrgWorkflowStepD } from '../../model';
import { memory } from '../../schema';
// import { HotKeyProvider } from '../../context/HotKeyContext';

var mockMemory = memory;
var mockMediafileId = 'm1';
var mockPassageId = 'p1';
var mockCurrentStep = 'step1';
var mockSetCurrentStep = jest.fn();

const passageAttributes = {
  sequencenum: 1,
  book: 'LUK',
  reference: '1:1-4',
  title: '',
  state: 'noMedia',
  dateCreated: '2024-05-08T15:37:36.284Z',
  dateUpdated: '2024-05-08T15:37:36.284Z',
};

var mockPassage = {
  id: mockPassageId,
  type: 'passage',
  attributes: { ...passageAttributes },
  relationships: {
    lastModifiedByUser: {
      data: { type: 'user', id: 'u1' },
    },
  },
} as PassageD;

var mockOrgWorkflowStep = {
  id: 'step1',
  type: 'orgworkflowstep',
  attributes: {
    process: 'obt',
    name: 'markVerse',
    sequencenum: 1,
    tool: '{}',
    permissions: '{}',
    dateCreated: '2024-05-08T15:37:36.284Z',
    dateUpdated: '2024-05-08T15:37:36.284Z',
  },
  relationships: {
    lastModifiedByUser: {
      data: { type: 'user', id: 'u1' },
    },
  },
} as OrgWorkflowStepD;

jest.mock('../../context/usePassageDetailContext', () => () => ({
  mediafileId: mockMediafileId,
  passage: mockPassage,
  currentstep: mockCurrentStep,
  setCurrentStep: mockSetCurrentStep,
  orgWorkflowSteps: [mockOrgWorkflowStep],
  setupLocate: jest.fn(),
}));
jest.mock('./PassageDetailPlayer', () => () => <div>PassageDetailPlayer</div>);
// jest.mock('../../crud/useMediaRecorder', () => ({
//   useMediaRecorder: () => ({
//     allowRecord: false,
//     onRecordStart: jest.fn(),
//     onRecordStop: jest.fn(),
//   }),
// }));
jest.mock('../../utils/logErrorService', () => jest.fn());
jest.mock('reactn', () => ({
  useGlobal: (arg: string) =>
    arg === 'memory' ? [mockMemory, jest.fn()] : [{}, jest.fn()],
}));
jest.mock('react-redux', () => ({
  useSelector: () => ({
    availableOnClipboard: 'Available on Clipboard',
    cancel: 'Cancel',
    canceling: 'Canceling',
    cantCopy: "Can't Copy",
    clipboard: 'Clipboard',
    copyToClipboard: 'Copy to Clipboard',
    markVerses: 'Mark Verses',
    noData: 'No Data {0}',
    pasteFormat: 'Paste Format',
    reference: 'Reference',
    saveVerseMarkup: 'Save Verse Markup',
    startStop: 'Start --> Stop',
    // prevRegion: 'Previous Segment [{0}]',
    // nextRegion: 'Next Segment [{0}]',
    // beginningTip: 'Go to Beginning [{0}]',
    // aheadTip: 'Ahead {jump} {1} [{0}]',
    // backTip: 'Rewind {jump} {1} [{0}]',
    // pauseTip: 'Pause [{0}]',
    // playTip: 'Play [{0}]',
    // endTip: 'Go to End [{0}]',
    // splitSegment: 'Add/Remove Boundary [Double Click/{0}]',
    // removeSegment: 'Remove Next Boundary [{0}]',
  }),
  shallowEqual: jest.fn(),
}));

const runTest = (props: MarkVersesProps) =>
  render(
    // <HotKeyProvider>
    <UnsavedProvider>
      <PassageDetailMarkVerses {...props} />
    </UnsavedProvider>
    // </HotKeyProvider>
  );

afterEach(() => {
  mockPassage.attributes = { ...passageAttributes } as any;
  cleanup();
  jest.clearAllMocks();
});

test('should render a table of verses', () => {
  // Arrange

  // Act
  runTest({ width: 1000 });

  // Assert
  const tbody = screen.getByTestId('verse-sheet')?.firstChild?.firstChild
    ?.firstChild as HTMLElement;
  expect(tbody.children.length).toBe(5); // 4 verses + 1 header
  expect(tbody.children[0].children.length).toBe(2); // 2 columns
});

test('should mark cell selected when clicking', async () => {
  // Arrange
  const user = userEvent.setup();

  // Act
  runTest({ width: 1000 });
  const tbody = screen.getByTestId('verse-sheet')?.firstChild?.firstChild
    ?.firstChild as HTMLElement;
  const firstLimit = tbody.children[1].firstChild as HTMLTableCellElement;

  expect(firstLimit.getAttribute('class')?.includes('selected')).toBeFalsy();

  await user.click(firstLimit);

  // Assert
  expect(firstLimit.getAttribute('class')?.includes('selected')).toBeTruthy();
});

test('should prevent changes', async () => {
  // Arrange
  const user = userEvent.setup();

  // Act
  runTest({ width: 1000 });
  const tbody = screen.getByTestId('verse-sheet')?.firstChild?.firstChild
    ?.firstChild as HTMLElement;
  const headerLimit = tbody.children[0].firstChild as HTMLTableCellElement;
  const firstLimit = tbody.children[1].firstChild as HTMLTableCellElement;

  await user.dblClick(firstLimit);
  await user.type(firstLimit?.firstChild as HTMLInputElement, 'Luke 1:2');
  await user.click(headerLimit);

  // Assert
  expect(firstLimit.textContent).toBe('');
});

test('should handle start verse with a letter in one chapter', () => {
  // Arrange
  mockPassage.attributes = { ...passageAttributes, reference: '1:1b-4' } as any;

  // Act
  runTest({ width: 1000 });
  const tbody = screen.getByTestId('verse-sheet')?.firstChild?.firstChild
    ?.firstChild as HTMLElement;
  const firstReference = tbody.children[1].children[1] as HTMLTableCellElement;

  // Assert
  expect(firstReference.textContent).toBe('1:1b');
});

test('should handle end verse with a letter in one chapter', () => {
  // Arrange
  mockPassage.attributes = { ...passageAttributes, reference: '1:1-2a' } as any;

  // Act
  runTest({ width: 1000 });
  const tbody = screen.getByTestId('verse-sheet')?.firstChild?.firstChild
    ?.firstChild as HTMLElement;
  const firstReference = tbody.children[2].children[1] as HTMLTableCellElement;

  // Assert
  expect(firstReference.textContent).toBe('1:2a');
});
