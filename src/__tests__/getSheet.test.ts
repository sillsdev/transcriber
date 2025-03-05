import { cleanup } from '@testing-library/react';
import {
  ISheet,
  IWorkflowStepsStrings,
  SectionD,
  PassageD,
  OrgWorkflowStepD,
  SheetLevel,
  IwsKind,
  IMediaShare,
} from '../model';
import Memory from '@orbit/memory';
import { getSheet } from '../components/Sheet/getSheet';
import { InitializedRecord } from '@orbit/records';
import { ISTFilterState } from '../components/Sheet/filterMenu';
import { PassageTypeEnum } from '../model/passageType';
import { PublishDestinationEnum } from '../crud/usePublishDestination';

var mockMemory = {} as Memory;

jest.mock('../crud/media', () => ({
  getVernacularMediaRec: jest.fn(),
  getMediaShared: jest.fn(),
}));

const wfStr = {
  internalize: 'Internalize',
  peerReview: 'Peer Review',
  record: 'Record',
  teamCheck: 'Team Check',
  getString: (v: string) => (wfStr as any)[v],
} as IWorkflowStepsStrings;

const s1 = {
  type: 'section',
  id: 's1',
  attributes: {
    sequencenum: 1,
    name: 'Intro',
    dateCreated: '2021-09-14',
    dateUpdated: '2021-09-15',
    lastModifiedBy: 1,
  },
  relationships: {
    plan: { data: { type: 'plan', id: 'pl1' } },
    transcriber: {},
    editor: {},
    passages: { data: [{ type: 'passage', id: 'pa1' }] },
    lastModifiedByUser: { data: { type: 'user', id: 'u0' } },
  },
} as SectionD;

const pa1 = {
  type: 'passage',
  id: 'pa1',
  attributes: {
    sequencenum: 1,
    book: 'LUK',
    reference: '1:1-4',
    state: 'transcribeReady',
    title: 'salutation',
    lastComment: '',
    hold: false,
    dateCreated: '2021-09-14',
    dateUpdated: '2021-09-15',
    lastModifiedBy: 1,
    stepComplete: '',
  },
  relationships: {
    section: { data: { type: 'section', id: 's1' } },
    users: { data: [{ type: 'user', id: 'u1' }] },
    media: {},
    lastModifiedByUser: { data: { type: 'user', id: 'u0' } },
  },
} as PassageD;

const pa2 = {
  type: 'passage',
  id: 'pa2',
  attributes: {
    sequencenum: 2,
    book: 'LUK',
    reference: '1:5-7',
    state: 'transcribeReady',
    title: 'introducing John',
    lastComment: '',
    hold: false,
    dateCreated: '2021-09-14',
    dateUpdated: '2021-09-15',
    lastModifiedBy: 1,
    stepComplete: '',
  },
  relationships: {
    section: { data: { type: 'section', id: 's1' } },
    users: { data: [{ type: 'user', id: 'u1' }] },
    media: {},
    lastModifiedByUser: { data: { type: 'user', id: 'u0' } },
  },
} as PassageD;

const pa3 = {
  type: 'passage',
  id: 'pa3',
  attributes: {
    sequencenum: 3,
    book: 'LUK',
    reference: '1:8-10',
    state: 'transcribeReady',
    title: "John's call",
    lastComment: '',
    hold: false,
    dateCreated: '2021-09-14',
    dateUpdated: '2021-09-15',
    lastModifiedBy: 1,
    stepComplete: '',
  },
  relationships: {
    section: { data: { type: 'section', id: 's1' } },
    users: { data: [{ type: 'user', id: 'u1' }] },
    media: {},
    lastModifiedByUser: { data: { type: 'user', id: 'u0' } },
  },
} as PassageD;

const s2 = {
  type: 'section',
  id: 's2',
  attributes: {
    sequencenum: 2,
    name: 'Birth of John',
    dateCreated: '2021-09-14',
    dateUpdated: '2021-09-15',
    lastModifiedBy: 1,
  },
  relationships: {
    plan: { data: { type: 'plan', id: 'pl1' } },
    transcriber: {},
    editor: {},
    passages: { data: [{ type: 'passage', id: 'pa4' }] },
    lastModifiedByUser: { data: { type: 'user', id: 'u0' } },
  },
} as SectionD;

const pa4 = {
  type: 'passage',
  id: 'pa4',
  attributes: {
    sequencenum: 1,
    book: 'LUK',
    reference: '1:11-14',
    state: 'transcribeReady',
    title: 'Zechariah at the temple',
    lastComment: '',
    hold: false,
    dateCreated: '2021-09-14',
    dateUpdated: '2021-09-15',
    lastModifiedBy: 1,
    stepComplete: '',
  },
  relationships: {
    section: { data: { type: 'section', id: 's2' } },
    users: { data: [{ type: 'user', id: 'u1' }] },
    media: {},
    lastModifiedByUser: { data: { type: 'user', id: 'u0' } },
  },
} as PassageD;

const s3 = {
  type: 'section',
  id: 's3',
  attributes: {
    sequencenum: 3,
    name: 'Birth of Jesus',
    dateCreated: '2021-09-14',
    dateUpdated: '2021-09-15',
    lastModifiedBy: 1,
  },
  relationships: {
    plan: { data: { type: 'plan', id: 'pl2' } },
    transcriber: {},
    editor: {},
    passages: { data: [{ type: 'passage', id: 'pa11' }] },
    lastModifiedByUser: { data: { type: 'user', id: 'u0' } },
  },
} as SectionD;

const pa11 = {
  type: 'passage',
  id: 'pa11',
  attributes: {
    sequencenum: 1,
    book: 'LUK',
    reference: '2:1-10',
    state: 'transcribeReady',
    title: 'Birth of Jesus',
    lastComment: '',
    hold: false,
    dateCreated: '2021-09-14',
    dateUpdated: '2021-09-15',
    lastModifiedBy: 1,
    stepComplete: '',
  },
  relationships: {
    section: { data: { type: 'section', id: 's3' } },
    users: { data: [{ type: 'user', id: 'u1' }] },
    media: {},
    lastModifiedByUser: { data: { type: 'user', id: 'u0' } },
  },
} as PassageD;

const getDiscussionCount = (psg: string, step: string) => 0;

const owf: OrgWorkflowStepD[] = [
  {
    type: 'orgworkflowstep',
    id: 'owf1',
    keys: { remoteId: '1' },
    attributes: {
      process: 'OBT',
      name: 'Internalize',
      sequencenum: 1,
      tool: '{"tool": "resource"}',
      permissions: '{}',
      dateCreated: '2021-09-14',
      dateUpdated: '2021-09-15',
      lastModifiedBy: 1,
    },
    relationships: {
      organization: { data: { type: 'organization', id: 'o0' } },
      lastModifiedByUser: { data: { type: 'user', id: 'u0' } },
    },
  },
  {
    type: 'orgworkflowstep',
    id: 'owf2',
    keys: { remoteId: '2' },
    attributes: {
      process: 'OBT',
      name: 'Record',
      sequencenum: 2,
      tool: '{"tool": "record"}',
      permissions: '{}',
      dateCreated: '2021-09-14',
      dateUpdated: '2021-09-15',
      lastModifiedBy: 1,
    },
    relationships: {
      organization: { data: { type: 'organization', id: 'o0' } },
      lastModifiedByUser: { data: { type: 'user', id: 'u0' } },
    },
  },
  {
    type: 'orgworkflowstep',
    id: 'owf3',
    keys: { remoteId: '3' },
    attributes: {
      process: 'OBT',
      name: 'TeamCheck',
      sequencenum: 3,
      tool: '{"tool": "teamCheck"}',
      permissions: '{}',
      dateCreated: '2021-09-14',
      dateUpdated: '2021-09-15',
      lastModifiedBy: 1,
    },
    relationships: {
      organization: { data: { type: 'organization', id: 'o0' } },
      lastModifiedByUser: { data: { type: 'user', id: 'u0' } },
    },
  },
  {
    type: 'orgworkflowstep',
    id: 'owf4',
    keys: { remoteId: '4' },
    attributes: {
      process: 'OBT',
      name: 'PeerReview',
      sequencenum: 4,
      tool: '{"tool": "teamCheck"}',
      permissions: '{}',
      dateCreated: '2022-01-28T16:43:40.929',
      dateUpdated: '2022-01-28T16:43:40.929',
      lastModifiedBy: 1,
    },
    relationships: {
      organization: { data: { type: 'organization', id: 'o0' } },
      lastModifiedByUser: { data: { type: 'user', id: 'u0' } },
    },
  },
];

// Declare some default parameters
var defaultFilterState: ISTFilterState = {
  minStep: '', //orgworkflow step to show this step or after
  maxStep: '', //orgworkflow step to show this step or before
  minSection: -1,
  maxSection: 99999,
  assignedToMe: false,
  hideDone: false,
  disabled: false,
  canHideDone: false,
};
var getPublishTo = (publishTo: string): PublishDestinationEnum[] =>
  [] as PublishDestinationEnum[];
interface FindResult {
  uri?: string;
  rights?: string;
  url?: string;
  color?: string;
}
var graphicFind = (rec: InitializedRecord, ref?: string): FindResult => ({});
var readSharedResource = (passageId: string) => undefined;

var curSheet: ISheet[] | undefined = undefined;

var publishStatus = (destinations: PublishDestinationEnum[]) => '';

var getSharedResource = (passage: PassageD) => undefined;

var gsDefaults = {
  plan: '',
  sections: [] as SectionD[],
  passages: [] as PassageD[],
  flat: false,
  projectShared: false,
  memory: mockMemory,
  orgWorkflowSteps: [] as OrgWorkflowStepD[],
  wfStr,
  filterState: defaultFilterState,
  minSection: -1,
  hasPublishing: false,
  hidePublishing: false,
  doneStepId: 'done-1',
  getDiscussionCount,
  graphicFind,
  getPublishTo,
  publishStatus,
  readSharedResource,
  current: curSheet,
  getSharedResource,
};

var secResult = {
  level: SheetLevel.Section,
  kind: IwsKind.Section,
  sectionSeq: 1,
  passageSeq: 0,
  passageType: PassageTypeEnum.PASSAGE,
  deleted: false,
  filtered: false,
  published: [] as PublishDestinationEnum[],
  editor: undefined,
  graphicUri: undefined,
  graphicFullSizeUrl: undefined,
  graphicRights: undefined,
  reference: '',
  titleMediaId: undefined,
  transcriber: undefined,
} as ISheet;

var pasResult = {
  level: SheetLevel.Passage,
  kind: IwsKind.Passage,
  sectionSeq: 1,
  passageSeq: 1,
  passageType: PassageTypeEnum.PASSAGE,
  deleted: false,
  filtered: false,
  mediaShared: IMediaShare.NotPublic,
  published: [] as PublishDestinationEnum[],
  mediaId: undefined,
  publishStatus: '',
  sharedResource: undefined,
};

var flatResult = {
  level: SheetLevel.Section,
  kind: IwsKind.SectionPassage,
  sectionSeq: 1,
  passageSeq: 1,
  passageType: PassageTypeEnum.PASSAGE,
  deleted: false,
  filtered: false,
  published: [] as PublishDestinationEnum[],
  mediaShared: IMediaShare.NotPublic,
  mediaId: undefined,
  editor: undefined,
  graphicUri: undefined,
  graphicFullSizeUrl: undefined,
  graphicRights: undefined,
  reference: '',
  titleMediaId: undefined,
  transcriber: undefined,
  publishStatus: '',
  sharedResource: undefined,
};

afterEach(cleanup);

test('empty input gives empty output', () => {
  expect(getSheet({ ...gsDefaults })).toEqual([]);
});

test('empty flat input gives empty output', () => {
  expect(getSheet({ ...gsDefaults, flat: true })).toEqual([]);
});

test('empty input with plan id gives empty output', () => {
  expect(getSheet({ ...gsDefaults, plan: 'pl1' })).toEqual([]);
});

test('one section gives output', () => {
  expect(getSheet({ ...gsDefaults, plan: 'pl1', sections: [s1] })).toEqual([
    {
      ...secResult,
      title: 'Intro',
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-15',
    },
  ]);
});

test('one section and one passage gives output', () => {
  expect(
    getSheet({ ...gsDefaults, plan: 'pl1', sections: [s1], passages: [pa1] })
  ).toEqual([
    {
      ...secResult,
      title: 'Intro',
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-15',
    },
    {
      ...pasResult,
      book: 'LUK',
      reference: '1:1-4',
      comment: 'salutation',
      passageUpdated: '2021-09-15',
      passage: pa1,
    },
  ] as ISheet[]);
});

test('one section and two passages gives output', () => {
  expect(
    getSheet({
      ...gsDefaults,
      plan: 'pl1',
      sections: [s1],
      passages: [pa1, pa2],
    })
  ).toEqual([
    {
      ...secResult,
      title: 'Intro',
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-15',
    },
    {
      ...pasResult,
      level: SheetLevel.Passage,
      kind: IwsKind.Passage,
      passageSeq: 1,
      book: 'LUK',
      reference: '1:1-4',
      comment: 'salutation',
      passageUpdated: '2021-09-15',
      passage: pa1,
    },
    {
      ...pasResult,
      level: SheetLevel.Passage,
      kind: IwsKind.Passage,
      passageSeq: 2,
      book: 'LUK',
      reference: '1:5-7',
      comment: 'introducing John',
      passageUpdated: '2021-09-15',
      passage: pa2,
    },
  ]);
});

test('one section and two passages with flat output', () => {
  expect(
    getSheet({
      ...gsDefaults,
      plan: 'pl1',
      sections: [s1],
      passages: [pa1, pa2],
      flat: true,
    })
  ).toEqual([
    {
      ...flatResult,
      title: 'Intro',
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-15',
      passageSeq: 1,
      book: 'LUK',
      reference: '1:1-4',
      comment: 'salutation',
      passageUpdated: '2021-09-15',
      passage: pa1,
    },
    {
      ...pasResult,
      passageSeq: 2,
      book: 'LUK',
      reference: '1:5-7',
      comment: 'introducing John',
      passageUpdated: '2021-09-15',
      passage: pa2,
    },
  ]);
});

test('one section and three passages out of order', () => {
  expect(
    getSheet({
      ...gsDefaults,
      plan: 'pl1',
      sections: [s1],
      passages: [pa3, pa1, pa2],
    })
  ).toEqual([
    {
      ...secResult,
      title: 'Intro',
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-15',
    },
    {
      ...pasResult,
      level: SheetLevel.Passage,
      kind: IwsKind.Passage,
      passageSeq: 1,
      book: 'LUK',
      reference: '1:1-4',
      comment: 'salutation',
      passageUpdated: '2021-09-15',
      passage: pa1,
    },
    {
      ...pasResult,
      level: SheetLevel.Passage,
      kind: IwsKind.Passage,
      passageSeq: 2,
      book: 'LUK',
      reference: '1:5-7',
      comment: 'introducing John',
      passageUpdated: '2021-09-15',
      passage: pa2,
    },
    {
      ...pasResult,
      level: SheetLevel.Passage,
      kind: IwsKind.Passage,
      passageSeq: 3,
      book: 'LUK',
      reference: '1:8-10',
      comment: "John's call",
      passageUpdated: '2021-09-15',
      passage: pa3,
    },
  ]);
});

test('one flat section and with one passage gives output', () => {
  expect(
    getSheet({
      ...gsDefaults,
      plan: 'pl1',
      sections: [s1],
      passages: [pa1],
      flat: true,
    })
  ).toEqual([
    {
      ...flatResult,
      title: 'Intro',
      book: 'LUK',
      reference: '1:1-4',
      comment: 'salutation',
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-15',
      passage: pa1,
      passageUpdated: '2021-09-15',
    },
  ]);
});

test('two flat sections and one from another plan gives output', () => {
  expect(
    getSheet({
      ...gsDefaults,
      plan: 'pl1',
      sections: [s1, s2, s3],
      passages: [pa1, pa4, pa11],
      flat: true,
    })
  ).toEqual([
    {
      ...flatResult,
      title: 'Intro',
      book: 'LUK',
      reference: '1:1-4',
      comment: 'salutation',
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-15',
      passage: pa1,
      passageUpdated: '2021-09-15',
    },
    {
      ...flatResult,
      sectionSeq: 2,
      title: 'Birth of John',
      book: 'LUK',
      reference: '1:11-14',
      comment: 'Zechariah at the temple',
      sectionId: { type: 'section', id: 's2' },
      sectionUpdated: '2021-09-15',
      passage: pa4,
      passageUpdated: '2021-09-15',
    },
  ]);
});

test('two sections and passages with one from another plan', () => {
  expect(
    getSheet({
      ...gsDefaults,
      plan: 'pl1',
      sections: [s1, s2, s3],
      passages: [pa11, pa3, pa1, pa4, pa2],
    })
  ).toEqual([
    {
      ...secResult,
      title: 'Intro',
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-15',
    },
    {
      ...pasResult,
      book: 'LUK',
      reference: '1:1-4',
      comment: 'salutation',
      passageUpdated: '2021-09-15',
      passage: pa1,
    },
    {
      ...pasResult,
      passageSeq: 2,
      book: 'LUK',
      reference: '1:5-7',
      comment: 'introducing John',
      passageUpdated: '2021-09-15',
      passage: pa2,
    },
    {
      ...pasResult,
      passageSeq: 3,
      book: 'LUK',
      reference: '1:8-10',
      comment: "John's call",
      passageUpdated: '2021-09-15',
      passage: pa3,
    },
    {
      ...secResult,
      sectionSeq: 2,
      title: 'Birth of John',
      sectionId: { type: 'section', id: 's2' },
      sectionUpdated: '2021-09-15',
    },
    {
      ...pasResult,
      sectionSeq: 2,
      book: 'LUK',
      reference: '1:11-14',
      comment: 'Zechariah at the temple',
      passageUpdated: '2021-09-15',
      passage: pa4,
    },
  ]);
});

test('update one flat section to two flat section ignoring other plan', () => {
  const sheet = getSheet({
    ...gsDefaults,
    plan: 'pl1',
    sections: [s1, s3],
    passages: [pa1, pa11],
    flat: true,
  });
  expect(sheet).toEqual([
    {
      ...flatResult,
      title: 'Intro',
      book: 'LUK',
      reference: '1:1-4',
      comment: 'salutation',
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-15',
      passage: pa1,
      passageUpdated: '2021-09-15',
    },
  ]);
  const updated = getSheet({
    ...gsDefaults,
    plan: 'pl1',
    sections: [s1, s2, s3],
    passages: [pa1, pa4, pa11],
    flat: true,
    current: sheet,
  });
  expect(updated).toEqual([
    {
      ...flatResult,
      title: 'Intro',
      passageSeq: 1,
      book: 'LUK',
      reference: '1:1-4',
      comment: 'salutation',
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-15',
      passage: pa1,
      passageUpdated: '2021-09-15',
    },
    {
      ...flatResult,
      sectionSeq: 2,
      title: 'Birth of John',
      book: 'LUK',
      reference: '1:11-14',
      comment: 'Zechariah at the temple',
      sectionId: { type: 'section', id: 's2' },
      sectionUpdated: '2021-09-15',
      passage: pa4,
      passageUpdated: '2021-09-15',
    },
  ]);
});

test('one section and one passage with step gives output', () => {
  expect(
    getSheet({
      ...gsDefaults,
      plan: 'pl1',
      sections: [s1],
      passages: [pa1],
      orgWorkflowSteps: owf,
    })
  ).toEqual([
    {
      ...secResult,
      sectionSeq: 1,
      title: 'Intro',
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-15',
    },
    {
      ...pasResult,
      level: SheetLevel.Passage,
      kind: IwsKind.Passage,
      step: 'Internalize',
      passageSeq: 1,
      book: 'LUK',
      reference: '1:1-4',
      comment: 'salutation',
      passageUpdated: '2021-09-15',
      passage: pa1,
      discussionCount: 0,
      stepId: 'owf1',
    },
  ]);
});

test('two flat sections with steps gives output', () => {
  const stepStatus =
    '{"completed": [{"name": "Internalize", "stepid": "1", "complete": true}, {"name": "Record", "stepid": "2", "complete": true}, {"name": "TeamCheck", "stepid": "3", "complete": true}]}';
  const pa1b = {
    ...pa1,
    attributes: {
      ...pa1.attributes,
      stepComplete: stepStatus,
    },
  } as PassageD;
  expect(
    getSheet({
      ...gsDefaults,
      plan: 'pl1',
      sections: [s1, s2],
      passages: [pa1b, pa4, pa11],
      orgWorkflowSteps: owf,
      flat: true,
    })
  ).toEqual([
    {
      ...flatResult,
      step: 'Peer Review',
      title: 'Intro',
      book: 'LUK',
      reference: '1:1-4',
      comment: 'salutation',
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-15',
      passage: pa1b,
      passageUpdated: '2021-09-15',
      discussionCount: 0,
      stepId: 'owf4',
    },
    {
      ...flatResult,
      step: 'Internalize',
      sectionSeq: 2,
      title: 'Birth of John',
      book: 'LUK',
      reference: '1:11-14',
      comment: 'Zechariah at the temple',
      sectionId: { type: 'section', id: 's2' },
      sectionUpdated: '2021-09-15',
      passage: pa4,
      passageUpdated: '2021-09-15',
      discussionCount: 0,
      stepId: 'owf1',
    },
  ]);
});
