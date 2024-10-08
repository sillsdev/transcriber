import { ISheet, IwsKind, IMediaShare, SheetLevel } from '../model';
import { shtResequence } from '../components/Sheet/shtResequence';

test('resequence empty give empty', () => {
  expect(shtResequence([])).toEqual([]);
});

test('resequence empty give empty with section num', () => {
  expect(shtResequence([], 1)).toEqual([]);
});

test('resequence 3 sections', () => {
  const sheet = [
    {
      level: SheetLevel.Section,
      kind: IwsKind.Section,
      sectionSeq: 3,
      title: 'Luke wrote this book about Jesus for Theophilus',
      passageSeq: 0,
      book: 'LUK',
      reference: 'Section 1:1–4',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Passage,
      kind: IwsKind.Passage,
      sectionSeq: 3,
      title: '',
      passageSeq: 1,
      book: 'LUK',
      reference: '1:1-4',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Section,
      kind: IwsKind.Section,
      sectionSeq: 2,
      title: 'An angel said that John the Baptizer would be born',
      passageSeq: 0,
      book: 'LUK',
      reference: 'Section 1:5–25',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Passage,
      kind: IwsKind.Passage,
      sectionSeq: 2,
      title: '',
      passageSeq: 1,
      book: 'LUK',
      reference: '1:5-7',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Passage,
      kind: IwsKind.Passage,
      sectionSeq: 2,
      title: '',
      passageSeq: 2,
      book: 'LUK',
      reference: '1:8-10',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Passage,
      kind: IwsKind.Passage,
      sectionSeq: 2,
      title: '',
      passageSeq: 3,
      book: 'LUK',
      reference: '1:11-17',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Passage,
      kind: IwsKind.Passage,
      sectionSeq: 2,
      title: '',
      passageSeq: 4,
      book: 'LUK',
      reference: '1:18-20',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Passage,
      kind: IwsKind.Passage,
      sectionSeq: 2,
      title: '',
      passageSeq: 5,
      book: 'LUK',
      reference: '1:21-25',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Section,
      kind: IwsKind.Section,
      sectionSeq: 1,
      title: 'An angel told Mary that Jesus would be born',
      passageSeq: 0,
      book: 'LUK',
      reference: 'Section 1:26–38',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Passage,
      kind: IwsKind.Passage,
      sectionSeq: 1,
      title: '',
      passageSeq: 1,
      book: 'LUK',
      reference: '1:26-28',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Passage,
      kind: IwsKind.Passage,
      sectionSeq: 1,
      title: '',
      passageSeq: 2,
      book: 'LUK',
      reference: '1:29-34',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Passage,
      kind: IwsKind.Passage,
      sectionSeq: 1,
      title: '',
      passageSeq: 3,
      book: 'LUK',
      reference: '1:35-38',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
  ] as ISheet[];

  const reseq = shtResequence(sheet);
  expect(reseq.length).toBe(sheet.length);
  expect(reseq[0].sectionSeq).toBe(1);
  expect(reseq.map((i) => `${i.sectionSeq}.${i.passageSeq}`)).toEqual([
    '1.0',
    '1.1',
    '2.0',
    '2.1',
    '2.2',
    '2.3',
    '2.4',
    '2.5',
    '3.0',
    '3.1',
    '3.2',
    '3.3',
  ]);
});

test('correct sequence is unchanged', () => {
  const sheet = [
    {
      level: SheetLevel.Section,
      kind: IwsKind.Section,
      sectionSeq: 1,
      title: 'Luke wrote this book about Jesus for Theophilus',
      passageSeq: 0,
      book: 'LUK',
      reference: 'Section 1:1–4',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Passage,
      kind: IwsKind.Passage,
      sectionSeq: 1,
      title: '',
      passageSeq: 1,
      book: 'LUK',
      reference: '1:1-4',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Section,
      kind: IwsKind.Section,
      sectionSeq: 2,
      title: 'An angel said that John the Baptizer would be born',
      passageSeq: 0,
      book: 'LUK',
      reference: 'Section 1:5–25',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Passage,
      kind: IwsKind.Passage,
      sectionSeq: 2,
      title: '',
      passageSeq: 1,
      book: 'LUK',
      reference: '1:5-7',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Passage,
      kind: IwsKind.Passage,
      sectionSeq: 2,
      title: '',
      passageSeq: 2,
      book: 'LUK',
      reference: '1:8-10',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Passage,
      kind: IwsKind.Passage,
      sectionSeq: 2,
      title: '',
      passageSeq: 3,
      book: 'LUK',
      reference: '1:11-17',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Passage,
      kind: IwsKind.Passage,
      sectionSeq: 2,
      title: '',
      passageSeq: 4,
      book: 'LUK',
      reference: '1:18-20',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Passage,
      kind: IwsKind.Passage,
      sectionSeq: 2,
      title: '',
      passageSeq: 5,
      book: 'LUK',
      reference: '1:21-25',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Section,
      kind: IwsKind.Section,
      sectionSeq: 3,
      title: 'An angel told Mary that Jesus would be born',
      passageSeq: 0,
      book: 'LUK',
      reference: 'Section 1:26–38',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Passage,
      kind: IwsKind.Passage,
      sectionSeq: 3,
      title: '',
      passageSeq: 1,
      book: 'LUK',
      reference: '1:26-28',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Passage,
      kind: IwsKind.Passage,
      sectionSeq: 3,
      title: '',
      passageSeq: 2,
      book: 'LUK',
      reference: '1:29-34',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Passage,
      kind: IwsKind.Passage,
      sectionSeq: 3,
      title: '',
      passageSeq: 3,
      book: 'LUK',
      reference: '1:35-38',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
  ] as ISheet[];

  const reseq = shtResequence(sheet);
  expect(reseq.length).toBe(sheet.length);
  expect(reseq[0].sectionSeq).toBe(1);
  expect(reseq.map((i) => `${i.sectionSeq}.${i.passageSeq}`)).toEqual([
    '1.0',
    '1.1',
    '2.0',
    '2.1',
    '2.2',
    '2.3',
    '2.4',
    '2.5',
    '3.0',
    '3.1',
    '3.2',
    '3.3',
  ]);
});

test('flat set sections in order, passage is 1', () => {
  const sheet = [
    {
      level: SheetLevel.Section,
      kind: IwsKind.SectionPassage,
      sectionSeq: 1,
      title: 'The Temptation of Jesus',
      passageSeq: 1,
      book: 'LUK',
      reference: '4:1-13',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Section,
      kind: IwsKind.SectionPassage,
      sectionSeq: 2,
      title: 'Jesus Casts Out a Demon',
      passageSeq: 1,
      book: 'LUK',
      reference: '4:31-37',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Section,
      kind: IwsKind.SectionPassage,
      sectionSeq: 3,
      title: 'Jesus Heals and Preaches',
      passageSeq: 1,
      book: 'LUK',
      reference: '4:38-44',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Section,
      kind: IwsKind.SectionPassage,
      sectionSeq: 4,
      title: 'The First Disciples',
      passageSeq: 1,
      book: 'LUK',
      reference: '5:1-11',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Section,
      kind: IwsKind.SectionPassage,
      sectionSeq: 5,
      title: 'Jesus Heals a Man with Leprosy',
      passageSeq: 1,
      book: 'LUK',
      reference: '5:12-16',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
    {
      level: SheetLevel.Section,
      kind: IwsKind.SectionPassage,
      sectionSeq: 6,
      title: 'Jesus Heals a Paralyzed Man',
      passageSeq: 1,
      book: 'LUK',
      reference: '5:17-26',
      comment: '',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
  ] as ISheet[];

  const reseq = shtResequence(sheet);
  expect(reseq.length).toBe(sheet.length);
  expect(reseq[0].sectionSeq).toBe(1);
  expect(reseq.map((i) => `${i.sectionSeq}.${i.passageSeq}`)).toEqual([
    '1.2',
    '2.2',
    '3.2',
    '4.2',
    '5.2',
    '6.2',
  ]);
});
