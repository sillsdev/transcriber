import { IWorkflow, IwfKind, levScrColNames } from '../model';
import { wfColumnHeads } from '../utils';

interface StrMap {
  [key: string]: string;
}

interface NumMap {
  [key: string]: number;
}

const workflow = [
  {
    level: 0,
    kind: IwfKind.SectionPassage,
    sectionSeq: 1,
    title: 'The Temptation of Jesus',
    passageSeq: 1,
    book: 'LUK',
    reference: '4:1-13',
    comment: '',
    deleted: false,
  },
  {
    level: 0,
    kind: IwfKind.SectionPassage,
    sectionSeq: 2,
    title: 'Jesus Casts Out a Demon',
    passageSeq: 1,
    book: 'LUK',
    reference: '4:31-37',
    comment: '',
    deleted: false,
  },
  {
    level: 0,
    kind: IwfKind.SectionPassage,
    sectionSeq: 3,
    title: 'Jesus Heals and Preaches',
    passageSeq: 1,
    book: 'LUK',
    reference: '4:38-44',
    comment: '',
    deleted: false,
  },
  {
    level: 0,
    kind: IwfKind.SectionPassage,
    sectionSeq: 4,
    title: 'The First Disciples',
    passageSeq: 1,
    book: 'LUK',
    reference: '5:1-11',
    comment: '',
    deleted: false,
  },
  {
    level: 0,
    kind: IwfKind.SectionPassage,
    sectionSeq: 5,
    title: 'Jesus Heals a Man with Leprosy',
    passageSeq: 1,
    book: 'LUK',
    reference: '5:12-16',
    comment: '',
    deleted: false,
  },
  {
    level: 0,
    kind: IwfKind.SectionPassage,
    sectionSeq: 6,
    title: 'Jesus Heals a Paralyzed Man',
    passageSeq: 1,
    book: 'LUK',
    reference: '5:17-26',
    comment: '',
    deleted: false,
  },
] as IWorkflow[];

const minWidth: NumMap = {
  sectionSeq: 60,
  title: 100,
  passageSeq: 60,
  book: 170,
  reference: 120,
  comment: 100,
  action: 50,
};

test('no data gives minimum widths', () => {
  const colNames = levScrColNames;
  const localName: StrMap = {};
  levScrColNames.forEach((c) => (localName[c] = c));
  const { colHead, colAdd } = wfColumnHeads(
    [],
    1,
    colNames,
    localName,
    minWidth
  );
  const heads = colNames.map((c) => ({
    readOnly: true,
    value: c,
    width: minWidth[c],
  }));
  expect(colAdd).toEqual(new Array(colNames.length).fill(0));
  expect(colHead).toEqual(heads);
});

test('no data with wide screen gives minimum widths', () => {
  const colNames = levScrColNames;
  const localName: StrMap = {};
  levScrColNames.forEach((c) => (localName[c] = c));
  const { colHead, colAdd } = wfColumnHeads(
    [],
    2400,
    colNames,
    localName,
    minWidth
  );
  const heads = colNames.map((c) => ({
    readOnly: true,
    value: c,
    width: minWidth[c],
  }));
  expect(colAdd).toEqual(new Array(colNames.length).fill(0));
  expect(colHead).toEqual(heads);
});

test('data gives minimum widths', () => {
  const colNames = levScrColNames;
  const localName: StrMap = {};
  levScrColNames.forEach((c) => (localName[c] = c));
  const { colHead, colAdd } = wfColumnHeads(
    workflow,
    1,
    colNames,
    localName,
    minWidth
  );
  const heads = colNames.map((c) => ({
    readOnly: true,
    value: c,
    width: minWidth[c],
  }));
  expect(colAdd).toEqual(new Array(colNames.length).fill(0));
  expect(colHead).toEqual(heads);
});

test('data with wide screen assigns extra widths', () => {
  const colNames = levScrColNames;
  const localName: StrMap = {};
  levScrColNames.forEach((c) => (localName[c] = c));
  const { colHead, colAdd } = wfColumnHeads(
    workflow,
    2400,
    colNames,
    localName,
    minWidth
  );
  const extra = [32, 962, 32, 96, 224, 32];
  const heads = colNames.map((c, i) => ({
    readOnly: true,
    value: c,
    width: minWidth[c] + extra[i],
  }));
  expect(colAdd).toEqual(extra);
  expect(colHead).toEqual(heads);
});
