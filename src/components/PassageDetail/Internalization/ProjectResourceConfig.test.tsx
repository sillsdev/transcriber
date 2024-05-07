/* eslint-disable testing-library/no-node-access */
import { render } from '@testing-library/react';
import ProjectResourceConfigure from './ProjectResourceConfigure';
import { MediaFile, SectionResource } from '../../../model';

var mockMediafile: MediaFile[] = [];
var mockSectionResource: SectionResource[] = [];

jest.mock('../PassageDetailPlayer', () => ({}));
jest.mock('./useProjectResourceSave', () => ({
  useProjectResourceSave: jest.fn(),
}));
jest.mock('./useProjectSegmentSave', () => ({
  useProjectSegmentSave: jest.fn(),
}));
jest.mock('./useFullReference', () => ({
  useFullReference: jest.fn(),
  IInfo: jest.requireActual('./useFullReference').IInfo,
}));
jest.mock('../../../control', () => ({
  ActionRow: jest.fn().mockImplementation(() => <div>ActionRow</div>),
  AltButton: jest.fn().mockImplementation(() => <div>AltButton</div>),
  GrowingSpacer: jest.fn().mockImplementation(() => <div>GrowingSpacer</div>),
  LightTooltip: jest.fn().mockImplementation(() => <div>LightTooltip</div>),
  PriButton: jest.fn().mockImplementation(() => <div>PriButton</div>),
}));
jest.mock('../../../hoc/useOrbitData', () => ({
  useOrbitData: (recType: string) =>
    recType === 'mediafile'
      ? mockMediafile
      : recType === 'sectionresource'
      ? mockSectionResource
      : [],
}));
jest.mock('react-redux', () => ({
  useSelector: () => ({
    availableOnClipboard: 'Available on Clipboard',
    cancel: 'Cancel',
    canceling: 'Canceling',
    cantCopy: "Can't Copy",
    clipboard: 'Clipboard',
    copyToClipboard: 'Copy to Clipboard',
    createResources: 'Create Resources',
    description: 'Description',
    noData: 'No Data {0}',
    pasteError: 'Paste Errors {0}, Updated {1}',
    pasteFormat: 'Paste Format',
    pasteNoChange: 'Paste No Change',
    projectResourceConfigure: 'Project Resource Configure',
    reference: 'Reference',
    startStop: 'Start/Stop',
    suffix: 'Suffix',
    suffixTip: 'Suffix Tip',
    unusedSegment: 'Unused Segment',
  }),
  shallowEqual: jest.fn(),
}));
jest.mock('../../../utils', () => ({
  LogError: jest.fn((error: string, severity: number) => {}),
  Severity: {},
}));

jest.mock('../../../context/UnsavedContext', () => ({
  UnsavedContext: () => ({
    state: {
      toolChanged: jest.fn(),
      toolsChanged: {},
      isChanged: jest.fn(),
      saveRequested: jest.fn(),
      startSave: jest.fn(),
      saveCompleted: jest.fn(),
      clearRequested: jest.fn(),
      clearCompleted: jest.fn(),
      checkSavedFn: jest.fn(),
    },
  }),
}));

describe('ProjectResourceConfig', () => {
  it('should render correctly', () => {
    const props = {
      media: undefined,
      items: [],
    };
    const { container } = render(<ProjectResourceConfigure {...props} />);
    expect(container.firstChild).toMatchSnapshot();
  });
});
