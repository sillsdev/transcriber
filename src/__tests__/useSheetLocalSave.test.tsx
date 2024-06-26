import { render } from '@testing-library/react';
import { setGlobal } from 'reactn';
import {
  ISheet,
  IwsKind,
  IMediaShare,
  SheetLevel,
  SectionD,
  PassageD,
} from '../model';
import { useWfLocalSave } from '../components/Sheet';
import { memory } from '../schema';
import { PassageTypeEnum } from '../model/passageType';
import DataProvider from '../hoc/DataProvider';

const defaultSheet: ISheet = {
  level: SheetLevel.Section,
  kind: IwsKind.SectionPassage,
  sectionSeq: 1,
  title: 'Jesus on trial before Pilate',
  passageSeq: 1,
  book: 'LUK',
  reference: '10:20-100',
  comment: '',
  deleted: false,
  mediaShared: IMediaShare.NotPublic,
  passageType: PassageTypeEnum.PASSAGE,
  filtered: false,
  discussionCount: 0,
  published: false,
};

// see https://jestjs.io/docs/mock-functions#mocking-modules
jest.mock('../schema', () => {
  const originalModule = jest.requireActual('../schema');

  return {
    __esModule: true,
    ...originalModule,
    memory: {
      ...originalModule.memory,
      query: originalModule.memory.query,
      on: originalModule.memory.on,
      cache: originalModule.memory.cache,
      schema: originalModule.memory.schema,
      update: jest.fn(),
    },
  };
});

// see: https://kentcdodds.com/blog/how-to-test-custom-react-hooks
interface HookProps {
  setComplete: (val: number) => void;
}
function setup(props: HookProps) {
  let returnVal: (
    ws: ISheet[],
    sections: SectionD[],
    passages: PassageD[],
    lastSaved?: string
  ) => Promise<void> = async () => {};
  const TestComponent = () => {
    const localSave = useWfLocalSave(props);
    returnVal = localSave;
    return null;
  };
  render(
    <DataProvider dataStore={memory}>
      <TestComponent />
    </DataProvider>
  );
  return returnVal;
}

test('save one section and one passage', async () => {
  const globals = {
    plan: 'p1',
    user: 'u1',
    offlineOnly: false,
    memory,
  };

  setGlobal(globals);

  const setComplete = jest.fn((val: number) => {});
  const worksheet: ISheet[] = [
    {
      ...defaultSheet,
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
  ];

  const localSave = setup({ setComplete });

  await localSave(worksheet, [], [], '2021-09-21');

  expect(setComplete).toHaveBeenCalled();
  const updateCalls = (memory.update as jest.Mock).mock.calls;
  expect(updateCalls.length).toBe(2);
  expect(updateCalls[0][0].length).toBe(4);
  expect(updateCalls[1][0].length).toBe(13);
  // console.log(JSON.stringify(updateCalls[1][0], null, 2));
});

test('delete one section and one passage', async () => {
  const globals = {
    plan: 'p1',
    user: 'u1',
    offlineOnly: false,
    memory,
  };

  setGlobal(globals);

  const setComplete = jest.fn((val: number) => {});
  const worksheet: ISheet[] = [
    {
      ...defaultSheet,
      kind: IwsKind.SectionPassage,
      sectionSeq: 1,
      title: 'The Temptation of Jesus',
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-22',
      passageSeq: 1,
      book: 'LUK',
      reference: '4:1-13',
      comment: '',
      passage: { type: 'passage', id: 'pa1' } as PassageD,
      passageUpdated: '2021-09-22',
      deleted: true,
      mediaShared: IMediaShare.NotPublic,
    },
  ];

  const localSave = setup({ setComplete });

  await localSave(worksheet, [], [], '2021-09-21');

  expect(setComplete).toHaveBeenCalled();
  const updateCalls = (memory.update as jest.Mock).mock.calls;
  expect(updateCalls.length).toBe(2);
  expect(updateCalls[0][0].op).toBe('removeRecord');
  expect(updateCalls[0][0].record.id).toBe('s1');
  expect(updateCalls[1][0].record.id).toBe('pa1');
  // console.log(JSON.stringify(updateCalls, null, 2));
});

test('update section and passage', async () => {
  const globals = {
    plan: 'p1',
    user: 'u1',
    offlineOnly: false,
    memory,
  };

  setGlobal(globals);

  const setComplete = jest.fn((val: number) => {});
  const worksheet: ISheet[] = [
    {
      ...defaultSheet,
      kind: IwsKind.SectionPassage,
      sectionSeq: 1,
      title: 'The Temptation of Jesus',
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-22',
      passageSeq: 1,
      book: 'LUK',
      reference: '4:1-13',
      comment: '',
      passage: { type: 'passage', id: 'pa1' } as PassageD,
      passageUpdated: '2021-09-22',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
  ];

  const sections: SectionD[] = [
    {
      type: 'section',
      id: 's1',
      attributes: {
        sequencenum: 2,
        name: 'old title',
        graphics: '{}',
        published: false,
        level: 1,
        dateCreated: '2021-09-21',
        dateUpdated: '2021-09-21',
        lastModifiedBy: 1,
      },
    },
  ];

  const passages: PassageD[] = [
    {
      type: 'passage',
      id: 'pa1',
      attributes: {
        sequencenum: 3,
        book: 'HAB',
        reference: '1:10-20',
        title: 'old one',
        state: 'old passage stat',
        lastComment: 'no comment',
        hold: false,
        dateCreated: '2021-09-21',
        dateUpdated: '2021-09-21',
        lastModifiedBy: 2,
      },
    } as PassageD,
  ];

  const localSave = setup({ setComplete });

  await localSave(worksheet, sections, passages, '2021-09-21');

  expect(setComplete).toHaveBeenCalled();
  const updateCalls = (memory.update as jest.Mock).mock.calls;
  // console.log(JSON.stringify(updateCalls, null, 2));
  expect(updateCalls.length).toBe(2);
  expect(updateCalls[0][0].length).toBe(3);
  expect(updateCalls[1][0].length).toBe(5);
});

test('no update if same date', async () => {
  const globals = {
    plan: 'p1',
    user: 'u1',
    offlineOnly: false,
    memory,
  };

  setGlobal(globals);

  const setComplete = jest.fn((val: number) => {});
  const worksheet: ISheet[] = [
    {
      ...defaultSheet,
      kind: IwsKind.SectionPassage,
      sectionSeq: 1,
      title: 'The Temptation of Jesus',
      sectionId: { type: 'section', id: 's1' },
      sectionUpdated: '2021-09-22',
      passageSeq: 1,
      book: 'LUK',
      reference: '4:1-13',
      comment: '',
      passage: { type: 'passage', id: 'pa1' } as PassageD,
      passageUpdated: '2021-09-22',
      deleted: false,
      mediaShared: IMediaShare.NotPublic,
    },
  ];

  const sections: SectionD[] = [
    {
      type: 'section',
      id: 's1',
      attributes: {
        sequencenum: 2,
        name: 'old title',
        graphics: '{}',
        published: false,
        level: 1,
        dateCreated: '2021-09-21',
        dateUpdated: '2021-09-21',
        lastModifiedBy: 1,
      },
    },
  ];

  const passages: PassageD[] = [
    {
      type: 'passage',
      id: 'pa1',
      attributes: {
        sequencenum: 3,
        book: 'HAB',
        reference: '1:10-20',
        title: 'old one',
        state: 'old passage stat',
        lastComment: 'no comment',
        hold: false,
        dateCreated: '2021-09-21',
        dateUpdated: '2021-09-21',
        lastModifiedBy: 2,
      },
    } as PassageD,
  ];

  const localSave = setup({ setComplete });

  await localSave(worksheet, sections, passages, '2021-09-22');

  expect(setComplete).toHaveBeenCalled();
  const updateCalls = (memory.update as jest.Mock).mock.calls;
  // console.log(JSON.stringify(updateCalls, null, 2));
  expect(updateCalls.length).toBe(0);
});
