import { IWorkflow, IwfKind } from '../model';
import { isSectionRow, isPassageRow } from '../components/Workflow';

test('return true for section row if valid hierarchy section', () => {
  const workflowItem: IWorkflow = {
    level: 0,
    kind: IwfKind.Section,
    sectionSeq: 1,
    title: 'Intro',
    sectionId: { type: 'section', id: 's1' },
    sectionUpdated: '2021-09-15',
    transcriber: undefined,
    editor: undefined,
    passageSeq: 1,
    deleted: false,
  };
  expect(isSectionRow(workflowItem)).toBeTruthy();
});

test('return true for section row if valid flat section', () => {
  const workflowItem: IWorkflow = {
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
  };
  expect(isSectionRow(workflowItem)).toBeTruthy();
});

test('return false for section row if hierarchy passage', () => {
  const workflowItem: IWorkflow = {
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
  };
  expect(isSectionRow(workflowItem)).toBeFalsy();
});

test('return false for passage row if valid hierarchy section', () => {
  const workflowItem: IWorkflow = {
    level: 0,
    kind: IwfKind.Section,
    sectionSeq: 1,
    title: 'Intro',
    sectionId: { type: 'section', id: 's1' },
    sectionUpdated: '2021-09-15',
    transcriber: undefined,
    editor: undefined,
    passageSeq: 1,
    deleted: false,
  };
  expect(isPassageRow(workflowItem)).toBeFalsy();
});

test('return true for passage row if valid flat passage', () => {
  const workflowItem: IWorkflow = {
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
  };
  expect(isPassageRow(workflowItem)).toBeTruthy();
});

test('return true for passage row if hierarchy passage', () => {
  const workflowItem: IWorkflow = {
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
  };
  expect(isPassageRow(workflowItem)).toBeTruthy();
});
