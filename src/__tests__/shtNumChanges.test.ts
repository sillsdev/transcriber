import { ISheet, IwsKind, IMediaShare, SheetLevel, PassageD } from '../model';
import { shtNumChanges } from '../components/Sheet/shtNumChanges';

const sheet = [
  {
    level: SheetLevel.Section,
    kind: IwsKind.Section,
    sectionSeq: 1,
    title: 'Intro',
    passageSeq: 0,
    sectionId: { type: 'section', id: 's1' },
    sectionUpdated: '2021-09-15',
    transcriber: undefined,
    editor: undefined,
    deleted: false,
    mediaShared: IMediaShare.NotPublic,
  },
  {
    level: SheetLevel.Passage,
    kind: IwsKind.Passage,
    sectionSeq: 1,
    passageSeq: 1,
    book: 'LUK',
    reference: '1:1-4',
    comment: 'salutation',
    passageUpdated: '2021-09-15',
    passage: { type: 'passage', id: 'pa1' } as PassageD,
    deleted: false,
    mediaShared: IMediaShare.NotPublic,
  },
  {
    level: SheetLevel.Passage,
    kind: IwsKind.Passage,
    sectionSeq: 1,
    passageSeq: 2,
    book: 'LUK',
    reference: '1:5-7',
    comment: 'introducing John',
    passageUpdated: '2021-09-16',
    passage: { type: 'passage', id: 'pa2' } as PassageD,
    deleted: false,
    mediaShared: IMediaShare.NotPublic,
  },
  {
    level: SheetLevel.Passage,
    kind: IwsKind.Passage,
    sectionSeq: 1,
    passageSeq: 3,
    book: 'LUK',
    reference: '1:8-10',
    comment: "John's call",
    passageUpdated: '2021-09-15',
    passage: { type: 'passage', id: 'pa3' } as PassageD,
    deleted: false,
    mediaShared: IMediaShare.NotPublic,
  },
  {
    level: SheetLevel.Section,
    kind: IwsKind.Section,
    sectionSeq: 2,
    passageSeq: 0,
    title: 'Birth of John',
    sectionId: { type: 'section', id: 's2' },
    sectionUpdated: '2021-09-15',
    transcriber: undefined,
    editor: undefined,
    deleted: false,
    mediaShared: IMediaShare.NotPublic,
  },
  {
    level: SheetLevel.Passage,
    kind: IwsKind.Passage,
    sectionSeq: 2,
    passageSeq: 1,
    book: 'LUK',
    reference: '1:11-14',
    comment: 'Zechariah at the temple',
    passageUpdated: '2021-09-15',
    passage: { type: 'passage', id: 'pa4' } as PassageD,
    deleted: false,
    mediaShared: IMediaShare.NotPublic,
  },
] as ISheet[];

test('empty sheet has no changes', () => {
  expect(shtNumChanges([], undefined)).toBe(0);
});

test('all changed if no last saved', () => {
  expect(shtNumChanges(sheet, undefined)).toBe(sheet.length);
});

test('count of sections and passages with newer date', () => {
  expect(shtNumChanges(sheet, '2021-09-15')).toBe(1);
});

test('section and passages count separately in flat', () => {
  const sheet = [
    {
      level: SheetLevel.Section,
      kind: IwsKind.SectionPassage,
      sectionSeq: 1,
      title: 'Intro',
      passageSeq: 1,
      book: 'LUK',
      reference: '1:1-4',
      comment: 'salutation',
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-15',
      passage: { type: 'passage', id: 'pa1' } as PassageD,
      passageUpdated: '2021-09-15',
      transcriber: undefined,
      editor: undefined,
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
  ] as ISheet[];

  expect(shtNumChanges(sheet, '2021-09-14')).toBe(2);
});
