import { renderHook } from '@testing-library/react-hooks';
import { IScriptureTableStrings, IwsKind, ISheet } from '../model';
import { useWfPaste } from '../components/Sheet';

// see https://jestjs.io/docs/mock-functions#mocking-modules
jest.mock('../crud/useOrganizedBy', () => {
  const originalModule = jest.requireActual('../crud/useOrganizedBy');

  return {
    __esModule: true,
    ...originalModule,
    useOrganizedBy: () => ({
      ...originalModule.memory,
      getOrganizedBy: () => 'Section',
    }),
  };
});

test('paste hieararchical', () => {
  const pasted = [
    [
      'Set #',
      "Title in Translator's Notes",
      'Passage',
      'Book',
      'Breaks',
      'Description',
    ],
    ['', '', '', '', '', ''],
    [
      '1',
      'Luke wrote this book about Jesus for Theophilus',
      '',
      'Luk',
      'Section 1:1–4',
      '',
    ],
    ['', '', '1', 'Luk', '1:1-4', ''],
    ['', '', '', '', '', ''],
    [
      '2',
      'An angel said that John the Baptizer would be born',
      '',
      'Luk',
      'Section 1:5–25',
      '',
    ],
    ['', '', '1', 'Luk', '1:5-7', ''],
    ['', '', '2', 'Luk', '1:8-10', ''],
    ['', '', '3', 'Luk', '1:11-17', ''],
    ['', '', '4', 'Luk', '1:18-20', ''],
    ['', '', '5', 'Luk', '1:21-25', ''],
    ['', '', '', '', '', '', ''],
    [
      '3',
      'An angel told Mary that Jesus would be born',
      '',
      'Luk',
      'Section 1:26–38',
      '',
    ],
    ['', '', '1', 'Luk', '1:26-28', ''],
    ['', '', '2', 'Luk', '1:29-34', ''],
    ['', '', '3', 'Luk', '1:35-38', ''],
    ['', '', '', '', '', ''],
    ['4', 'Mary visited Elizabeth', '', 'Luk', 'Section 1:39–45', ''],
    ['', '', '1', 'Luk', '1:39-45', ''],
    ['', '', '', '', '', ''],
    ['5', 'Mary praised God', '', 'Luk', 'Section 1:46–56', ''],
    ['', '', '1', 'Luk', '1:46-56', ''],
    ['', '', '', '', '', ''],
    [
      '6',
      'John the Baptizer was born and received his name',
      '',
      'Luk',
      'Section 1:57–66',
      '',
    ],
    ['', '', '1', 'Luk', '1:57-58', ''],
    ['', '', '2', 'Luk', '1:59-64', ''],
    ['', '', '3', 'Luk', '1:65-66', ''],
    ['', '', '', '', '', ''],
    [
      '7',
      'Zechariah prophesied and praised God',
      '',
      'Luk',
      'Section 1:67–80',
      '',
    ],
    ['', '', '1', 'Luk', '1:67-80', ''],
  ];
  const colNames = [
    'sectionSeq',
    'title',
    'passageSeq',
    'book',
    'reference',
    'comment',
  ];
  const findBook = (val: string) => (/LUK/i.test(val) ? 'LUK' : val);
  const t = {
    book: 'Book',
    description: 'Description',
    extras: 'Extras',
    installAudacity: 'installAudacity',
    loadingTable: 'Loading data',
    passage: 'Passage',
    pasteInvalidColumns:
      'Invalid number of columns ({0}). Expecting {1}} columns.',
    pasteInvalidSections: 'Invalid {0} number(s):',
    pasteNoRows: 'No Rows in clipboard.',
    reference: 'Reference',
    saveFirst: 'You must save changes first!',
    saving: 'Saving...',
    title: 'Title',
  } as IScriptureTableStrings;
  const { result } = renderHook(() =>
    useWfPaste({
      secNumCol: colNames.indexOf('sectionSeq'),
      passNumCol: colNames.indexOf('passageSeq'),
      scripture: true,
      flat: false,
      colNames,
      findBook,
      t,
      shared: false,
    })
  );
  const { valid, addedWorkflow } = result.current(pasted);
  expect(valid).toBeTruthy();
  expect(addedWorkflow[0].passageUpdated).toMatch(
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/
  );
  const passageUpdated = addedWorkflow[0].passageUpdated;
  const sectionUpdated = passageUpdated;
  const testVal = (
    [
      {
        level: 0,
        kind: IwsKind.Section,
        sectionSeq: 1,
        title: 'Luke wrote this book about Jesus for Theophilus',
        passageSeq: 0,
        book: 'LUK',
        reference: 'Section 1:1–4',
        comment: '',
        deleted: false,
      },
      {
        level: 1,
        kind: IwsKind.Passage,
        sectionSeq: 1,
        title: '',
        passageSeq: 1,
        book: 'LUK',
        reference: '1:1-4',
        comment: '',
        deleted: false,
      },
      {
        level: 0,
        kind: IwsKind.Section,
        sectionSeq: 2,
        title: 'An angel said that John the Baptizer would be born',
        passageSeq: 0,
        book: 'LUK',
        reference: 'Section 1:5–25',
        comment: '',
        deleted: false,
      },
      {
        level: 1,
        kind: IwsKind.Passage,
        sectionSeq: 2,
        title: '',
        passageSeq: 1,
        book: 'LUK',
        reference: '1:5-7',
        comment: '',
        deleted: false,
      },
      {
        level: 1,
        kind: IwsKind.Passage,
        sectionSeq: 2,
        title: '',
        passageSeq: 2,
        book: 'LUK',
        reference: '1:8-10',
        comment: '',
        deleted: false,
      },
      {
        level: 1,
        kind: IwsKind.Passage,
        sectionSeq: 2,
        title: '',
        passageSeq: 3,
        book: 'LUK',
        reference: '1:11-17',
        comment: '',
        deleted: false,
      },
      {
        level: 1,
        kind: IwsKind.Passage,
        sectionSeq: 2,
        title: '',
        passageSeq: 4,
        book: 'LUK',
        reference: '1:18-20',
        comment: '',
        deleted: false,
      },
      {
        level: 1,
        kind: IwsKind.Passage,
        sectionSeq: 2,
        title: '',
        passageSeq: 5,
        book: 'LUK',
        reference: '1:21-25',
        comment: '',
        deleted: false,
      },
      {
        level: 0,
        kind: IwsKind.Section,
        sectionSeq: 3,
        title: 'An angel told Mary that Jesus would be born',
        passageSeq: 0,
        book: 'LUK',
        reference: 'Section 1:26–38',
        comment: '',
        deleted: false,
      },
      {
        level: 1,
        kind: IwsKind.Passage,
        sectionSeq: 3,
        title: '',
        passageSeq: 1,
        book: 'LUK',
        reference: '1:26-28',
        comment: '',
        deleted: false,
      },
      {
        level: 1,
        kind: IwsKind.Passage,
        sectionSeq: 3,
        title: '',
        passageSeq: 2,
        book: 'LUK',
        reference: '1:29-34',
        comment: '',
        deleted: false,
      },
      {
        level: 1,
        kind: IwsKind.Passage,
        sectionSeq: 3,
        title: '',
        passageSeq: 3,
        book: 'LUK',
        reference: '1:35-38',
        comment: '',
        deleted: false,
      },
      {
        level: 0,
        kind: IwsKind.Section,
        sectionSeq: 4,
        title: 'Mary visited Elizabeth',
        passageSeq: 0,
        book: 'LUK',
        reference: 'Section 1:39–45',
        comment: '',
        deleted: false,
      },
      {
        level: 1,
        kind: IwsKind.Passage,
        sectionSeq: 4,
        title: '',
        passageSeq: 1,
        book: 'LUK',
        reference: '1:39-45',
        comment: '',
        deleted: false,
      },
      {
        level: 0,
        kind: IwsKind.Section,
        sectionSeq: 5,
        title: 'Mary praised God',
        passageSeq: 0,
        book: 'LUK',
        reference: 'Section 1:46–56',
        comment: '',
        deleted: false,
      },
      {
        level: 1,
        kind: IwsKind.Passage,
        sectionSeq: 5,
        title: '',
        passageSeq: 1,
        book: 'LUK',
        reference: '1:46-56',
        comment: '',
        deleted: false,
      },
      {
        level: 0,
        kind: IwsKind.Section,
        sectionSeq: 6,
        title: 'John the Baptizer was born and received his name',
        passageSeq: 0,
        book: 'LUK',
        reference: 'Section 1:57–66',
        comment: '',
        deleted: false,
      },
      {
        level: 1,
        kind: IwsKind.Passage,
        sectionSeq: 6,
        title: '',
        passageSeq: 1,
        book: 'LUK',
        reference: '1:57-58',
        comment: '',
        deleted: false,
      },
      {
        level: 1,
        kind: IwsKind.Passage,
        sectionSeq: 6,
        title: '',
        passageSeq: 2,
        book: 'LUK',
        reference: '1:59-64',
        comment: '',
        deleted: false,
      },
      {
        level: 1,
        kind: IwsKind.Passage,
        sectionSeq: 6,
        title: '',
        passageSeq: 3,
        book: 'LUK',
        reference: '1:65-66',
        comment: '',
        deleted: false,
      },
      {
        level: 0,
        kind: IwsKind.Section,
        sectionSeq: 7,
        title: 'Zechariah prophesied and praised God',
        passageSeq: 0,
        book: 'LUK',
        reference: 'Section 1:67–80',
        comment: '',
        deleted: false,
      },
      {
        level: 1,
        kind: IwsKind.Passage,
        sectionSeq: 7,
        title: '',
        passageSeq: 1,
        book: 'LUK',
        reference: '1:67-80',
        comment: '',
        deleted: false,
      },
    ] as ISheet[]
  ).map((i) => ({
    ...i,
    passageUpdated,
    sectionUpdated,
  }));
  expect(addedWorkflow).toEqual(testVal);
});

test('paste flat', () => {
  const pasted = [
    [
      'Set #',
      "Title in Translator's Notes",
      'Passage',
      'Book',
      'Breaks',
      'Description',
    ],
    ['1', 'The Temptation of Jesus', '1', 'Luk', '4:1-13', ''],
    ['2', 'Jesus Casts Out a Demon', '1', 'Luk', '4:31-37', ''],
    ['3', 'Jesus Heals and Preaches', '1', 'Luk', '4:38-44', ''],
    ['4', 'The First Disciples', '1', 'Luk', '5:1-11', ''],
    ['5', 'Jesus Heals a Man with Leprosy', '1', 'Luk', '5:12-16', ''],
    ['6', 'Jesus Heals a Paralyzed Man', '1', 'Luk', '5:17-26', ''],
  ];
  const colNames = [
    'sectionSeq',
    'title',
    'passageSeq',
    'book',
    'reference',
    'comment',
  ];
  const findBook = (val: string) => (/LUK/i.test(val) ? 'LUK' : val);
  const t = {
    book: 'Book',
    description: 'Description',
    extras: 'Extras',
    installAudacity: 'installAudacity',
    loadingTable: 'Loading data',
    passage: 'Passage',
    pasteInvalidColumns:
      'Invalid number of columns ({0}). Expecting {1}} columns.',
    pasteInvalidSections: 'Invalid {0} number(s):',
    pasteNoRows: 'No Rows in clipboard.',
    reference: 'Reference',
    saveFirst: 'You must save changes first!',
    saving: 'Saving...',
    title: 'Title',
  } as IScriptureTableStrings;
  const { result } = renderHook(() =>
    useWfPaste({
      secNumCol: colNames.indexOf('sectionSeq'),
      passNumCol: colNames.indexOf('passageSeq'),
      scripture: true,
      flat: true,
      colNames,
      findBook,
      t,
      shared: false,
    })
  );
  const { valid, addedWorkflow } = result.current(pasted);
  expect(valid).toBeTruthy();
  expect(addedWorkflow[0].passageUpdated).toMatch(
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/
  );
  const passageUpdated = addedWorkflow[0].passageUpdated;
  const sectionUpdated = passageUpdated;
  const testValue = (
    [
      {
        level: 0,
        kind: IwsKind.SectionPassage,
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
        kind: IwsKind.SectionPassage,
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
        kind: IwsKind.SectionPassage,
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
        kind: IwsKind.SectionPassage,
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
        kind: IwsKind.SectionPassage,
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
        kind: IwsKind.SectionPassage,
        sectionSeq: 6,
        title: 'Jesus Heals a Paralyzed Man',
        passageSeq: 1,
        book: 'LUK',
        reference: '5:17-26',
        comment: '',
        deleted: false,
      },
    ] as ISheet[]
  ).map((i) => ({ ...i, passageUpdated, sectionUpdated }));
  expect(addedWorkflow).toEqual(testValue);
});

test('paste flat data into hierarchy', () => {
  const pasted = [
    [
      'Set #',
      "Title in Translator's Notes",
      'Passage',
      'Book',
      'Breaks',
      'Description',
    ],
    ['1', 'The Temptation of Jesus', '1', 'Luk', '4:1-13', ''],
    ['2', 'Jesus Casts Out a Demon', '1', 'Luk', '4:31-37', ''],
  ];
  const colNames = [
    'sectionSeq',
    'title',
    'passageSeq',
    'book',
    'reference',
    'comment',
  ];
  const findBook = (val: string) => (/LUK/i.test(val) ? 'LUK' : val);
  const t = {
    book: 'Book',
    description: 'Description',
    extras: 'Extras',
    installAudacity: 'installAudacity',
    loadingTable: 'Loading data',
    passage: 'Passage',
    pasteInvalidColumns:
      'Invalid number of columns ({0}). Expecting {1}} columns.',
    pasteInvalidSections: 'Invalid {0} number(s):',
    pasteNoRows: 'No Rows in clipboard.',
    reference: 'Reference',
    saveFirst: 'You must save changes first!',
    saving: 'Saving...',
    title: 'Title',
  } as IScriptureTableStrings;
  const { result } = renderHook(() =>
    useWfPaste({
      secNumCol: colNames.indexOf('sectionSeq'),
      passNumCol: colNames.indexOf('passageSeq'),
      scripture: true,
      flat: false,
      colNames,
      findBook,
      t,
      shared: false,
    })
  );
  const { valid, addedWorkflow } = result.current(pasted);
  expect(valid).toBeTruthy();
  expect(addedWorkflow[0].passageUpdated).toMatch(
    /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}.\d{3}Z/
  );
  const passageUpdated = addedWorkflow[0].passageUpdated;
  const sectionUpdated = passageUpdated;
  const testValue = (
    [
      {
        level: 0,
        kind: IwsKind.Section,
        sectionSeq: 1,
        title: 'The Temptation of Jesus',
        passageSeq: 0,
        book: 'LUK',
        reference: '4:1-13',
        comment: '',
        deleted: false,
      },
      {
        level: 1,
        kind: IwsKind.Passage,
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
        kind: IwsKind.Section,
        sectionSeq: 2,
        title: 'Jesus Casts Out a Demon',
        passageSeq: 0,
        book: 'LUK',
        reference: '4:31-37',
        comment: '',
        deleted: false,
      },
      {
        level: 1,
        kind: IwsKind.Passage,
        sectionSeq: 2,
        title: 'Jesus Casts Out a Demon',
        passageSeq: 1,
        book: 'LUK',
        reference: '4:31-37',
        comment: '',
        deleted: false,
      },
    ] as ISheet[]
  ).map((i) => ({ ...i, passageUpdated, sectionUpdated }));
  expect(addedWorkflow).toEqual(testValue);
});
