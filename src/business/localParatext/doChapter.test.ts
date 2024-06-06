import { doChapter } from './doChapter';
import Memory from '@orbit/memory';
import { PassageD } from '../../model';
import { DOMParser } from '@xmldom/xmldom';
const domParser = new DOMParser();

var mockChapDom = domParser.parseFromString('<usx></usx>');
var mockMemory = { update: jest.fn() } as unknown as Memory;

var mockParatextPaths: any;
jest.mock('./paratextPaths', () => {
  const retValue = {
    paratextPaths: jest.fn(),
  };
  mockParatextPaths = retValue;
  return retValue;
});

var mockReadChapter: any;
jest.mock('./readChapter', () => {
  const retValue = {
    readChapter: jest.fn(),
  };
  mockReadChapter = retValue;
  return retValue;
});

var mockPostPass: any;
jest.mock('./postPass', () => {
  const retValue = {
    postPass: jest.fn(),
  };
  mockPostPass = retValue;
  return retValue;
});

var mockWriteChapger: any;
jest.mock('./writeChapter', () => {
  const retValue = {
    writeChapter: jest.fn(),
  };
  mockWriteChapger = retValue;
  return retValue;
});

jest.mock('@orbit/memory', () => ({
  __esModule: true,
  default: mockMemory,
  RecordTransformBuilder: jest.fn(),
}));

jest.mock('../../crud/updatePassageState', () => {
  return {
    UpdateMediaStateOps: jest.fn(),
  };
});

describe('doChapter', () => {
  it('should post the passage for each chapter referenced', async () => {
    const params = {
      chap: 'MAT-1',
      passInfo: [
        {
          passage: {
            attributes: {
              lastComment: 'My transcription',
              startChapter: 1,
              startVerse: 1,
              endChapter: 1,
              endVerse: 1,
            },
            id: 'p1',
          } as PassageD,
          mediaId: 'm1',
          transcription: 'My transcription',
        },
      ],
      ptProjName: 'ptProjName',
      memory: mockMemory,
      userId: 'u1',
      exportNumbers: true,
      sectionArr: undefined,
    };

    const mockParatextPathsSpy = jest
      .spyOn(mockParatextPaths, 'paratextPaths')
      .mockImplementation(() => ({
        chapterFile: 'chapterFile',
        book: 'MAT',
        chapter: '1',
        program: 'ptProg',
      }));
    const readChapterSpy = jest
      .spyOn(mockReadChapter, 'readChapter')
      .mockImplementation(() => mockChapDom);
    const postPassSpy = jest.spyOn(mockPostPass, 'postPass');
    const writeChapterSpy = jest
      .spyOn(mockWriteChapger, 'writeChapter')
      .mockImplementation(() => ({ stdout: '' }));

    await doChapter(params);

    expect(mockParatextPathsSpy).toHaveBeenCalledTimes(1);
    expect(readChapterSpy).toHaveBeenCalledTimes(1);

    expect(postPassSpy).toHaveBeenCalledTimes(1);
    const postPassParams = postPassSpy.mock.calls[0][0] as any;
    expect(postPassParams.doc).toEqual(mockChapDom);
    expect(postPassParams.chap).toEqual('1');
    expect(postPassParams.currentPI).toEqual(params.passInfo[0]);
    expect(postPassParams.exportNumbers).toEqual(true);
    expect(postPassParams.sectionArr).toBeUndefined();
    expect(postPassParams.memory).toEqual(mockMemory);

    expect(writeChapterSpy).toHaveBeenCalledTimes(1);
    expect(mockMemory.update).toHaveBeenCalledTimes(1);
  });
});
