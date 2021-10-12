import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { Section, Passage, IWorkflow } from '../model';
import { getWorkflow } from '../components/Workflow';
import { memory } from '../schema';

const s1: Section = {
  type: 'section',
  id: 's1',
  attributes: {
    sequencenum: 1,
    name: 'Intro',
    state: 'transcribeReady',
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
};

const pa1: Passage = {
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
  },
  relationships: {
    section: { data: { type: 'section', id: 's1' } },
    users: { data: [{ type: 'user', id: 'u1' }] },
    media: {},
    lastModifiedByUser: { data: { type: 'user', id: 'u0' } },
  },
} as Passage;

const pa2: Passage = {
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
  },
  relationships: {
    section: { data: { type: 'section', id: 's1' } },
    users: { data: [{ type: 'user', id: 'u1' }] },
    media: {},
    lastModifiedByUser: { data: { type: 'user', id: 'u0' } },
  },
} as Passage;

const pa3: Passage = {
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
  },
  relationships: {
    section: { data: { type: 'section', id: 's1' } },
    users: { data: [{ type: 'user', id: 'u1' }] },
    media: {},
    lastModifiedByUser: { data: { type: 'user', id: 'u0' } },
  },
} as Passage;

const s2: Section = {
  type: 'section',
  id: 's2',
  attributes: {
    sequencenum: 2,
    name: 'Birth of John',
    state: 'transcribeReady',
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
};

const pa4: Passage = {
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
  },
  relationships: {
    section: { data: { type: 'section', id: 's2' } },
    users: { data: [{ type: 'user', id: 'u1' }] },
    media: {},
    lastModifiedByUser: { data: { type: 'user', id: 'u0' } },
  },
} as Passage;

const s3: Section = {
  type: 'section',
  id: 's3',
  attributes: {
    sequencenum: 3,
    name: 'Birth of Jesus',
    state: 'transcribeReady',
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
};

const pa11: Passage = {
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
  },
  relationships: {
    section: { data: { type: 'section', id: 's3' } },
    users: { data: [{ type: 'user', id: 'u1' }] },
    media: {},
    lastModifiedByUser: { data: { type: 'user', id: 'u0' } },
  },
} as Passage;

afterEach(cleanup);

test('empty input gives empty output', async () => {
  expect(getWorkflow('', [], [], false, memory)).toEqual([]);
});

test('empty flat input gives empty output', async () => {
  expect(getWorkflow('', [], [], true, memory)).toEqual([]);
});

test('empty input with plan id gives empty output', async () => {
  expect(getWorkflow('pl1', [], [], false, memory)).toEqual([]);
});

test('one section gives output', async () => {
  expect(getWorkflow('pl1', [s1], [], false, memory)).toEqual([
    {
      level: 0,
      kind: 0,
      sectionSeq: 1,
      title: 'Intro',
      passageSeq: 0,
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-15',
      transcriber: undefined,
      editor: undefined,
      deleted: false,
    },
  ] as IWorkflow[]);
});

test('one section and one passage gives output', async () => {
  expect(getWorkflow('pl1', [s1], [pa1], false, memory)).toEqual([
    {
      level: 0,
      kind: 0,
      sectionSeq: 1,
      title: 'Intro',
      passageSeq: 0,
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-15',
      transcriber: undefined,
      editor: undefined,
      deleted: false,
    },
    {
      level: 1,
      kind: 1,
      sectionSeq: 1,
      passageSeq: 1,
      book: 'LUK',
      reference: '1:1-4',
      comment: 'salutation',
      passageUpdated: '2021-09-15',
      passageId: { type: 'passage', id: 'pa1' },
      deleted: false,
    },
  ] as IWorkflow[]);
});

test('one section and two passages gives output', async () => {
  expect(getWorkflow('pl1', [s1], [pa1, pa2], false, memory)).toEqual([
    {
      level: 0,
      kind: 0,
      sectionSeq: 1,
      title: 'Intro',
      passageSeq: 0,
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-15',
      transcriber: undefined,
      editor: undefined,
      deleted: false,
    },
    {
      level: 1,
      kind: 1,
      sectionSeq: 1,
      passageSeq: 1,
      book: 'LUK',
      reference: '1:1-4',
      comment: 'salutation',
      passageUpdated: '2021-09-15',
      passageId: { type: 'passage', id: 'pa1' },
      deleted: false,
    },
    {
      level: 1,
      kind: 1,
      sectionSeq: 1,
      passageSeq: 2,
      book: 'LUK',
      reference: '1:5-7',
      comment: 'introducing John',
      passageUpdated: '2021-09-15',
      passageId: { type: 'passage', id: 'pa2' },
      deleted: false,
    },
  ] as IWorkflow[]);
});

test('one section and two passages with flat output', async () => {
  expect(getWorkflow('pl1', [s1], [pa1, pa2], true, memory)).toEqual([
    {
      level: 0,
      kind: 2,
      sectionSeq: 1,
      title: 'Intro',
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-15',
      transcriber: undefined,
      editor: undefined,
      passageSeq: 1,
      book: 'LUK',
      reference: '1:1-4',
      comment: 'salutation',
      passageUpdated: '2021-09-15',
      passageId: { type: 'passage', id: 'pa1' },
      mediaId: undefined,
      deleted: false,
    },
    {
      level: 1,
      kind: 1,
      sectionSeq: 1,
      passageSeq: 2,
      book: 'LUK',
      reference: '1:5-7',
      comment: 'introducing John',
      passageUpdated: '2021-09-15',
      passageId: { type: 'passage', id: 'pa2' },
      mediaId: undefined,
      deleted: false,
    },
  ] as IWorkflow[]);
});

test('one section and three passages out of order', async () => {
  expect(getWorkflow('pl1', [s1], [pa3, pa1, pa2], false, memory)).toEqual([
    {
      level: 0,
      kind: 0,
      sectionSeq: 1,
      title: 'Intro',
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-15',
      transcriber: undefined,
      editor: undefined,
      passageSeq: 0,
      deleted: false,
    },
    {
      level: 1,
      kind: 1,
      sectionSeq: 1,
      passageSeq: 1,
      book: 'LUK',
      reference: '1:1-4',
      comment: 'salutation',
      passageUpdated: '2021-09-15',
      passageId: { type: 'passage', id: 'pa1' },
      deleted: false,
    },
    {
      level: 1,
      kind: 1,
      sectionSeq: 1,
      passageSeq: 2,
      book: 'LUK',
      reference: '1:5-7',
      comment: 'introducing John',
      passageUpdated: '2021-09-15',
      passageId: { type: 'passage', id: 'pa2' },
      deleted: false,
    },
    {
      level: 1,
      kind: 1,
      sectionSeq: 1,
      passageSeq: 3,
      book: 'LUK',
      reference: '1:8-10',
      comment: "John's call",
      passageUpdated: '2021-09-15',
      passageId: { type: 'passage', id: 'pa3' },
      deleted: false,
    },
  ] as IWorkflow[]);
});

test('one flat section and with one passage gives output', async () => {
  expect(getWorkflow('pl1', [s1], [pa1], true, memory)).toEqual([
    {
      level: 0,
      kind: 2,
      sectionSeq: 1,
      title: 'Intro',
      passageSeq: 1,
      book: 'LUK',
      reference: '1:1-4',
      comment: 'salutation',
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-15',
      passageId: { type: 'passage', id: 'pa1' },
      passageUpdated: '2021-09-15',
      transcriber: undefined,
      editor: undefined,
      deleted: false,
    },
  ] as IWorkflow[]);
});

test('two flat sections and one from another plan gives output', async () => {
  expect(
    getWorkflow('pl1', [s1, s2, s3], [pa1, pa4, pa11], true, memory)
  ).toEqual([
    {
      level: 0,
      kind: 2,
      sectionSeq: 1,
      title: 'Intro',
      passageSeq: 1,
      book: 'LUK',
      reference: '1:1-4',
      comment: 'salutation',
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-15',
      passageId: { type: 'passage', id: 'pa1' },
      passageUpdated: '2021-09-15',
      transcriber: undefined,
      editor: undefined,
      deleted: false,
    },
    {
      level: 0,
      kind: 2,
      sectionSeq: 2,
      title: 'Birth of John',
      passageSeq: 1,
      book: 'LUK',
      reference: '1:11-14',
      comment: 'Zechariah at the temple',
      sectionId: { type: 'section', id: 's2' },
      sectionUpdated: '2021-09-15',
      passageId: { type: 'passage', id: 'pa4' },
      passageUpdated: '2021-09-15',
      transcriber: undefined,
      editor: undefined,
      deleted: false,
    },
  ] as IWorkflow[]);
});

test('two sections and passages with one from another plan', async () => {
  expect(
    getWorkflow('pl1', [s1, s2, s3], [pa11, pa3, pa1, pa4, pa2], false, memory)
  ).toEqual([
    {
      level: 0,
      kind: 0,
      sectionSeq: 1,
      title: 'Intro',
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-15',
      transcriber: undefined,
      editor: undefined,
      passageSeq: 0,
      deleted: false,
    },
    {
      level: 1,
      kind: 1,
      sectionSeq: 1,
      passageSeq: 1,
      book: 'LUK',
      reference: '1:1-4',
      comment: 'salutation',
      passageUpdated: '2021-09-15',
      passageId: { type: 'passage', id: 'pa1' },
      deleted: false,
    },
    {
      level: 1,
      kind: 1,
      sectionSeq: 1,
      passageSeq: 2,
      book: 'LUK',
      reference: '1:5-7',
      comment: 'introducing John',
      passageUpdated: '2021-09-15',
      passageId: { type: 'passage', id: 'pa2' },
      deleted: false,
    },
    {
      level: 1,
      kind: 1,
      sectionSeq: 1,
      passageSeq: 3,
      book: 'LUK',
      reference: '1:8-10',
      comment: "John's call",
      passageUpdated: '2021-09-15',
      passageId: { type: 'passage', id: 'pa3' },
      deleted: false,
    },
    {
      level: 0,
      kind: 0,
      sectionSeq: 2,
      title: 'Birth of John',
      sectionId: { type: 'section', id: 's2' },
      sectionUpdated: '2021-09-15',
      transcriber: undefined,
      editor: undefined,
      passageSeq: 0,
      deleted: false,
    },
    {
      level: 1,
      kind: 1,
      sectionSeq: 2,
      passageSeq: 1,
      book: 'LUK',
      reference: '1:11-14',
      comment: 'Zechariah at the temple',
      passageUpdated: '2021-09-15',
      passageId: { type: 'passage', id: 'pa4' },
      deleted: false,
    },
  ] as IWorkflow[]);
});

test('update one flat section to two flat section ignoring other plan', async () => {
  const workflow = getWorkflow('pl1', [s1, s3], [pa1, pa11], true, memory);
  expect(workflow).toEqual([
    {
      level: 0,
      kind: 2,
      sectionSeq: 1,
      title: 'Intro',
      passageSeq: 1,
      book: 'LUK',
      reference: '1:1-4',
      comment: 'salutation',
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-15',
      passageId: { type: 'passage', id: 'pa1' },
      passageUpdated: '2021-09-15',
      transcriber: undefined,
      editor: undefined,
      deleted: false,
    },
  ] as IWorkflow[]);
  const updated = getWorkflow(
    'pl1',
    [s1, s2, s3],
    [pa1, pa4, pa11],
    true,
    memory,
    workflow
  );
  expect(updated).toEqual([
    {
      level: 0,
      kind: 2,
      sectionSeq: 1,
      title: 'Intro',
      passageSeq: 1,
      book: 'LUK',
      reference: '1:1-4',
      comment: 'salutation',
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-15',
      passageId: { type: 'passage', id: 'pa1' },
      passageUpdated: '2021-09-15',
      transcriber: undefined,
      editor: undefined,
      deleted: false,
    },
    {
      level: 0,
      kind: 2,
      sectionSeq: 2,
      title: 'Birth of John',
      passageSeq: 1,
      book: 'LUK',
      reference: '1:11-14',
      comment: 'Zechariah at the temple',
      sectionId: { type: 'section', id: 's2' },
      sectionUpdated: '2021-09-15',
      passageId: { type: 'passage', id: 'pa4' },
      passageUpdated: '2021-09-15',
      transcriber: undefined,
      editor: undefined,
      deleted: false,
    },
  ] as IWorkflow[]);
});
