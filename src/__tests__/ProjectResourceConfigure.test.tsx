/* eslint-disable testing-library/no-node-access */
import { render } from '@testing-library/react';
import ProjectResourceConfigure from '../components/PassageDetail/Internalization/ProjectResourceConfigure';
import { MediaFile, MediaFileD, SectionResource } from '../model';
import { UnsavedProvider } from '../context/UnsavedContext';
import { PropsWithChildren } from 'react';
import { memory } from '../schema';
import { InitializedRecord } from '@orbit/records';

var mockMemory = memory;
var mockMediafile: MediaFile[] = [];
var mockSectionResource: SectionResource[] = [];

jest.mock('../components/passageDetail/PassageDetailPlayer', () => ({
  PassageDetailPlayer: () => <div>PassageDetailPlayer</div>,
}));
jest.mock(
  '../components/PassageDetail/Internalization/useProjectResourceSave',
  () => ({
    useProjectResourceSave: jest.fn(),
  })
);
jest.mock(
  '../components/PassageDetail/Internalization/useProjectSegmentSave',
  () => ({
    useProjectSegmentSave: jest.fn(),
  })
);
jest.mock('../control', () => ({
  ActionRow: ({ children }: PropsWithChildren) => (
    <div>
      <span>ActionRow</span>
      {children}
    </div>
  ),
  AltButton: ({ children }: PropsWithChildren) => (
    <div>
      <span>AltButton</span>
      {children}
    </div>
  ),
  GrowingSpacer: () => <div>GrowingSpacer</div>,
  LightTooltip: ({ children }: PropsWithChildren) => (
    <div>
      <span>LightTooltip</span>
      {children}
    </div>
  ),
  PriButton: ({ children }: PropsWithChildren) => (
    <div>
      <span>PriButton</span>
      {children}
    </div>
  ),
}));
jest.mock('../hoc/useOrbitData', () => ({
  useOrbitData: (recType: string) =>
    recType === 'mediafile'
      ? mockMediafile
      : recType === 'sectionresource'
      ? mockSectionResource
      : [],
}));
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

const defMedia: MediaFileD = {
  type: 'mediafile',
  attributes: {
    versionNumber: 1,
    eafUrl: 'General Resource',
    audioUrl: 'media/OT_Book_32___01_Jonah_______ESV_lLuke.ogg',
    s3file: '',
    duration: 0,
    contentType: '',
    audioQuality: '',
    textQuality: '',
    transcription: '',
    originalFile: 'OT_Book_32___01_Jonah_______ESV_lLuke.ogg',
    filesize: 1011383,
    position: 0,
    segments: '{}', // value null incompatible with string
    languagebcp47: '',
    link: false,
    readyToShare: false,
    performedBy: '',
    sourceSegments: '{}', // value null incompatible with string
    sourceMediaOfflineId: '',
    transcriptionstate: '',
    topic: '',
    lastModifiedBy: -1, // Add the missing property
    resourcePassageId: -1, // Add the missing property
    offlineId: '', // Add the missing property
    dateCreated: '2024-05-08T15:38:09.121Z',
    dateUpdated: '2024-05-08T15:38:09.121Z',
  },
  id: 'm1',
  relationships: {
    lastModifiedByUser: {
      data: { type: 'user', id: 'u1' },
    },
    plan: {
      data: { type: 'plan', id: 'pl1' },
    },
    artifactType: {
      data: { type: 'artifacttype', id: 'at1' },
    },
    recordedbyUser: {
      data: { type: 'user', id: 'u1' },
    },
  },
} as MediaFileD;

const runTest = (props: any) =>
  render(
    <UnsavedProvider>
      <ProjectResourceConfigure {...props} />
    </UnsavedProvider>
  );

const defItems = [
  { type: 'passage', id: 'pa1' },
  { type: 'section', id: 'se2' },
  { type: 'passage', id: 'pa2' },
  { type: 'passage', id: 'pa5' },
  { type: 'passage', id: 'pa3' },
  { type: 'passage', id: 'pa4' },
  { type: 'passage', id: 'pa6' },
];

const defPass = {
  type: 'passage',
  attributes: {
    book: 'LUK',
    title: '',
    state: 'noMedia',
    dateCreated: '2024-05-08T15:37:36.284Z',
    dateUpdated: '2024-05-08T15:37:36.284Z',
  },
  relationships: {
    lastModifiedByUser: {
      data: { type: 'user', id: 'u1' },
    },
  },
};

const passages = [
  {
    ...defPass,
    attributes: { ...defPass.attributes, sequencenum: 1, reference: '1:1-4' },
    id: 'pa1',
    relationships: {
      ...defPass.relationships,
      section: {
        data: { type: 'section', id: 'se1' },
      },
    },
  },
  {
    ...defPass,
    attributes: {
      ...defPass.attributes,
      sequencenum: 1,
      reference: '1:5-7',
      startChapter: 1,
      startVerse: 5,
      endChapter: 1,
      endVerse: 7,
    },
    id: 'pa2',
    relationships: {
      ...defPass.relationships,
      section: {
        data: { type: 'section', id: 'se2' },
      },
    },
  },
  {
    ...defPass,
    attributes: { ...defPass.attributes, sequencenum: 3, reference: '1:11-17' },
    id: 'pa3',
    relationships: {
      ...defPass.relationships,
      section: {
        data: { type: 'section', id: 'se2' },
      },
    },
  },
  {
    ...defPass,
    attributes: { ...defPass.attributes, sequencenum: 4, reference: '1:18-20' },
    id: 'pa4',
    relationships: {
      ...defPass.relationships,
      section: {
        data: { type: 'section', id: 'se2' },
      },
    },
  },
  {
    ...defPass,
    attributes: { ...defPass.attributes, sequencenum: 2, reference: '1:8-10' },
    id: 'pa5',
    relationships: {
      ...defPass.relationships,
      section: {
        data: { type: 'section', id: 'se2' },
      },
    },
  },
  {
    ...defPass,
    attributes: {
      ...defPass.attributes,
      sequencenum: 5,
      reference: '1:21-25',
      startChapter: 1,
      startVerse: 21,
      endChapter: 1,
      endVerse: 25,
    },
    id: 'pa6',
    relationships: {
      ...defPass.relationships,
      section: {
        data: { type: 'section', id: 'se2' },
      },
    },
  },
] as InitializedRecord[];

const defSec = {
  type: 'section',
  attributes: {
    state: '',
    level: 3,
    published: false,
    publishTo: '{}',
    dateCreated: '2024-05-08T15:37:36.186Z',
    dateUpdated: '2024-05-08T15:37:36.186Z',
  },
  relationships: {
    lastModifiedByUser: {
      data: { type: 'user', id: 'u1' },
    },
    plan: {
      data: { type: 'plan', id: 'pl1' },
    },
  },
};

const sections = [
  {
    ...defSec,
    attributes: {
      ...defSec.attributes,
      sequencenum: 1,
      name: 'Luke wrote this book about Jesus for Theophilus',
    },
    id: 'se1',
    relationships: {
      ...defSec.relationships,
      passages: {
        data: [{ type: 'passage', id: 'pa1' }],
      },
    },
  },
  {
    ...defSec,
    attributes: {
      ...defSec.attributes,
      sequencenum: 2,
      name: 'An angel said that John the Baptizer would be born',
    },
    id: 'se2',
    relationships: {
      ...defSec.relationships,
      passages: {
        data: [
          { type: 'passage', id: 'pa2' },
          { type: 'passage', id: 'pa5' },
          { type: 'passage', id: 'pa3' },
          { type: 'passage', id: 'pa4' },
          { type: 'passage', id: 'pa6' },
        ],
      },
    },
  },
] as InitializedRecord[];

describe('ProjectResourceConfigure', () => {
  it('should render correctly', () => {
    const props = {
      media: undefined,
      items: [],
    };
    const { container } = runTest(props);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('should render correctly with media', () => {
    const props = {
      media: defMedia,
      items: [],
    };
    const { container } = runTest(props);
    expect(container.firstChild).toMatchSnapshot();
  });

  it('should render correctly with items', async () => {
    const props = {
      media: defMedia,
      items: defItems,
      bookData: [{ code: 'LUK', abbr: 'Lk' }],
    };
    const recs = passages.concat(sections);
    for (let rec of recs) {
      await memory.update((t) => t.addRecord(rec));
    }
    const { container } = runTest(props);
    expect(container.firstChild).toMatchSnapshot();
  });
});
