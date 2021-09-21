import { IWorkflow, IwfKind } from '../model';
import { wfNumChanges } from '../utils';

const workflow: IWorkflow[] = [
  {
    level: 0,
    kind: IwfKind.Section,
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
    kind: IwfKind.Passage,
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
    kind: IwfKind.Passage,
    sectionSeq: 1,
    passageSeq: 2,
    book: 'LUK',
    reference: '1:5-7',
    comment: 'introducing John',
    passageUpdated: '2021-09-16',
    passageId: { type: 'passage', id: 'pa2' },
    deleted: false,
  },
  {
    level: 1,
    kind: IwfKind.Passage,
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
    kind: IwfKind.Section,
    sectionSeq: 2,
    passageSeq: 0,
    title: 'Birth of John',
    sectionId: { type: 'section', id: 's2' },
    sectionUpdated: '2021-09-15',
    transcriber: undefined,
    editor: undefined,
    deleted: false,
  },
  {
    level: 1,
    kind: IwfKind.Passage,
    sectionSeq: 2,
    passageSeq: 1,
    book: 'LUK',
    reference: '1:11-14',
    comment: 'Zechariah at the temple',
    passageUpdated: '2021-09-15',
    passageId: { type: 'passage', id: 'pa4' },
    deleted: false,
  },
];

test('empty workflow has no changes', () => {
  expect(wfNumChanges([], undefined)).toBe(0);
});

test('all changed if no last saved', () => {
  expect(wfNumChanges(workflow, undefined)).toBe(workflow.length);
});

test('count of sections and passages with newer date', () => {
  expect(wfNumChanges(workflow, '2021-09-15')).toBe(1);
});

test('section and passages count separately in flat', () => {
  const workflow: IWorkflow[] = [
    {
      level: 0,
      kind: IwfKind.SectionPassage,
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
  ];

  expect(wfNumChanges(workflow, '2021-09-14')).toBe(2);
});
