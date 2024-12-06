import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom/extend-expect';
import { ISheet, IwsKind, IMediaShare, SheetLevel, PassageD } from '../model';
import { workSheet } from '../components/Sheet/workSheet';
import { PassageTypeEnum } from '../model/passageType';
import { PublishDestinationEnum } from '../crud';

afterEach(cleanup);

const flatCols = ['sectionSeq', 'title', 'book', 'reference', 'comment'];
const levCols = [
  'sectionSeq',
  'title',
  'passageSeq',
  'book',
  'reference',
  'comment',
];

test('empty input gives empty output', async () => {
  const sheet = Array<ISheet>();
  expect(workSheet(sheet, flatCols, [])).toEqual([]);
});

test('section only', () => {
  const sheet = [
    {
      level: SheetLevel.Section,
      kind: IwsKind.Section,
      sectionSeq: 1,
      title: 'Intro',
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-15',
      transcriber: undefined,
      editor: undefined,
      passageSeq: 1,
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    } as ISheet,
  ];
  expect(workSheet(sheet, flatCols, [])).toEqual([[1, 'Intro', '', '', '']]);
});

test('section with passage', () => {
  const sheet: ISheet[] = [
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
      passageType: PassageTypeEnum.PASSAGE,
      filtered: false,
      discussionCount: 0,
      published: [] as PublishDestinationEnum[],
    },
  ];
  expect(workSheet(sheet, flatCols, [])).toEqual([
    [1, 'Intro', 'LUK', '1:1-4', 'salutation'],
  ]);
});

test('two sections with passages', () => {
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
      passageId: { type: 'passage', id: 'pa1' },
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
      passageUpdated: '2021-09-15',
      passageId: { type: 'passage', id: 'pa2' },
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
      passageId: { type: 'passage', id: 'pa3' },
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
      passageId: { type: 'passage', id: 'pa4' },
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
  ] as ISheet[];
  expect(workSheet(sheet, levCols, [])).toEqual([
    [1, 'Intro', '', '', '', ''],
    ['', '', 1, 'LUK', '1:1-4', 'salutation'],
    ['', '', 2, 'LUK', '1:5-7', 'introducing John'],
    ['', '', 3, 'LUK', '1:8-10', "John's call"],
    [2, 'Birth of John', '', '', '', ''],
    ['', '', 1, 'LUK', '1:11-14', 'Zechariah at the temple'],
  ]);
});

// Deleted passages are removed before calling worksheet
// test('two sections with deleted passage', () => {
//   const sheet = [
//     {
//       level: SheetLevel.Section,
//       kind: IwsKind.Section,
//       sectionSeq: 1,
//       title: 'Intro',
//       passageSeq: 0,
//       sectionId: { type: 'section', id: 's1' },
//       sectionUpdated: '2021-09-15',
//       transcriber: undefined,
//       editor: undefined,
//       deleted: false,
//       mediaShared: IMediaShare.NotPublic,
//     },
//     {
//       level: SheetLevel.Passage,
//       kind: IwsKind.Passage,
//       sectionSeq: 1,
//       passageSeq: 1,
//       book: 'LUK',
//       reference: '1:1-4',
//       comment: 'salutation',
//       passageUpdated: '2021-09-15',
//       passageId: { type: 'passage', id: 'pa1' },
//       deleted: false,
//       mediaShared: IMediaShare.NotPublic,
//     },
//     {
//       level: SheetLevel.Passage,
//       kind: IwsKind.Passage,
//       sectionSeq: 1,
//       passageSeq: 2,
//       book: 'LUK',
//       reference: '1:5-7',
//       comment: 'introducing John',
//       passageUpdated: '2021-09-15',
//       passageId: { type: 'passage', id: 'pa2' },
//       deleted: true,
//       mediaShared: IMediaShare.NotPublic,
//     },
//     {
//       level: SheetLevel.Passage,
//       kind: IwsKind.Passage,
//       sectionSeq: 1,
//       passageSeq: 2,
//       book: 'LUK',
//       reference: '1:8-10',
//       comment: "John's call",
//       passageUpdated: '2021-09-15',
//       passageId: { type: 'passage', id: 'pa3' },
//       deleted: false,
//       mediaShared: IMediaShare.NotPublic,
//     },
//     {
//       level: SheetLevel.Section,
//       kind: IwsKind.Section,
//       sectionSeq: 2,
//       passageSeq: 0,
//       title: 'Birth of John',
//       sectionId: { type: 'section', id: 's2' },
//       sectionUpdated: '2021-09-15',
//       transcriber: undefined,
//       editor: undefined,
//       deleted: false,
//       mediaShared: IMediaShare.NotPublic,
//     },
//     {
//       level: SheetLevel.Passage,
//       kind: IwsKind.Passage,
//       sectionSeq: 2,
//       passageSeq: 1,
//       book: 'LUK',
//       reference: '1:11-14',
//       comment: 'Zechariah at the temple',
//       passageUpdated: '2021-09-15',
//       passageId: { type: 'passage', id: 'pa4' },
//       deleted: false,
//       mediaShared: IMediaShare.NotPublic,
//     },
//   ] as ISheet[];
//   expect(workSheet(sheet, levCols, [])).toEqual([
//     [1, 'Intro', '', '', '', ''],
//     ['', '', 1, 'LUK', '1:1-4', 'salutation'],
//     ['', '', 2, 'LUK', '1:8-10', "John's call"],
//     [2, 'Birth of John', '', '', '', ''],
//     ['', '', 1, 'LUK', '1:11-14', 'Zechariah at the temple'],
//   ]);
// });
