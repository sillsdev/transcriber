import Memory from '@orbit/memory';
import { MediaFileD, Passage, PassageD } from '../../model';
import { localSync } from './localSync';

var mockDoChapter: any;
jest.mock('./doChapter', () => {
  const retValue = {
    doChapter: jest.fn(),
  };
  mockDoChapter = retValue;
  return retValue;
});

describe('localSync', () => {
  it('return successful (empty string) even if no data', async () => {
    // Arrange
    const params = {
      plan: 'plan',
      ptProjName: 'ptProjName',
      mediafiles: [],
      passages: [],
      memory: {} as Memory,
      userId: 'userId',
      passage: {} as Passage,
      exportNumbers: false,
      sectionArr: [],
      artifactId: 'artifactId',
      getTranscription: jest.fn(),
    };
    const mockDoChapterSpy = jest.spyOn(mockDoChapter, 'doChapter');
    // Act
    const result = await localSync(params);
    // Assert
    expect(mockDoChapterSpy).toHaveBeenCalledTimes(0);
    expect(result).toBe('');
  });

  it('call doChapter if there is a chapter to sync', async () => {
    // Arrange
    const passage = {
      id: 'p1',
      attributes: {
        book: 'MAT',
        reference: '1:1-2',
      },
    } as PassageD;
    const params = {
      plan: 'plan',
      ptProjName: 'ptProjName',
      mediafiles: [
        {
          attributes: {
            transcriptionstate: 'approved',
            versionNumber: 1,
            transcription: 'My transcription',
          },
          relationships: {
            plan: { data: { id: 'plan' } },
            passage: { data: { id: 'p1' } },
            artifactType: { data: { id: 'artifactId' } },
          },
          id: 'm1',
          type: 'mediafile',
        } as MediaFileD,
      ],
      passages: [passage],
      memory: {} as Memory,
      userId: 'u1',
      passage,
      exportNumbers: false,
      sectionArr: [],
      artifactId: 'artifactId',
      getTranscription: jest.fn(),
    };
    const mockDoChapterSpy = jest.spyOn(mockDoChapter, 'doChapter');
    const mockGetTranscriptionSpy = jest
      .spyOn(params, 'getTranscription')
      .mockImplementation(() => 'My transcription');
    // Act
    const result = await localSync(params);
    // Assert
    expect(mockGetTranscriptionSpy).toHaveBeenCalledTimes(1);
    expect(params.getTranscription).toHaveBeenCalledWith('p1', 'artifactId');
    expect(mockDoChapterSpy).toHaveBeenCalledTimes(1);
    expect(mockDoChapterSpy).toHaveBeenCalledWith({
      chap: 'MAT-1',
      passInfo: [
        {
          mediaId: 'm1',
          passage: params.passages[0],
          transcription: 'My transcription',
        },
      ],
      ptProjName: 'ptProjName',
      memory: params.memory,
      userId: 'u1',
      exportNumbers: false,
      sectionArr: [],
    });
    expect(result).toBe('');
  });

  it('call doChapter properly with a cross chapter reference', async () => {
    // Arrange
    const passage = {
      id: 'p1',
      attributes: {
        book: 'MAT',
        reference: '1:20-2:4',
      },
    } as PassageD;
    const params = {
      plan: 'plan',
      ptProjName: 'ptProjName',
      mediafiles: [
        {
          attributes: {
            transcriptionstate: 'approved',
            versionNumber: 1,
            transcription: 'My transcription',
          },
          relationships: {
            plan: { data: { id: 'plan' } },
            passage: { data: { id: 'p1' } },
            artifactType: { data: { id: 'artifactId' } },
          },
          id: 'm1',
          type: 'mediafile',
        } as MediaFileD,
      ],
      passages: [passage],
      memory: {} as Memory,
      userId: 'u1',
      passage,
      exportNumbers: false,
      sectionArr: [],
      artifactId: 'artifactId',
      getTranscription: jest.fn(),
    };
    const mockDoChapterSpy = jest.spyOn(mockDoChapter, 'doChapter');
    const mockGetTranscriptionSpy = jest
      .spyOn(params, 'getTranscription')
      .mockImplementation(() => 'My transcription');
    // Act
    const result = await localSync(params);
    // Assert
    expect(mockGetTranscriptionSpy).toHaveBeenCalledTimes(1);
    expect(params.getTranscription).toHaveBeenCalledWith('p1', 'artifactId');
    expect(mockDoChapterSpy).toHaveBeenCalledTimes(1);
    expect(mockDoChapterSpy).toHaveBeenCalledWith({
      chap: 'MAT-1',
      passInfo: [
        {
          mediaId: 'm1',
          passage: params.passages[0],
          transcription: 'My transcription',
        },
      ],
      ptProjName: 'ptProjName',
      memory: params.memory,
      userId: 'u1',
      exportNumbers: false,
      sectionArr: [],
    });
    expect(result).toBe('');
  });

  it('call doChapter with Jonah 2 with a cross chapter reference JON 1:17-2:10', async () => {
    // Arrange
    const passage = {
      id: 'p1',
      attributes: {
        book: 'JON',
        reference: '1:17-2:10',
      },
    } as PassageD;
    const params = {
      plan: 'plan',
      ptProjName: 'ptProjName',
      mediafiles: [
        {
          attributes: {
            transcriptionstate: 'approved',
            versionNumber: 1,
            transcription: 'My transcription',
          },
          relationships: {
            plan: { data: { id: 'plan' } },
            passage: { data: { id: 'p1' } },
            artifactType: { data: { id: 'artifactId' } },
          },
          id: 'm1',
          type: 'mediafile',
        } as MediaFileD,
      ],
      passages: [passage],
      memory: {} as Memory,
      userId: 'u1',
      passage,
      exportNumbers: false,
      sectionArr: [],
      artifactId: 'artifactId',
      getTranscription: jest.fn(),
    };
    const mockDoChapterSpy = jest.spyOn(mockDoChapter, 'doChapter');
    const mockGetTranscriptionSpy = jest
      .spyOn(params, 'getTranscription')
      .mockImplementation(() => 'My transcription');
    // Act
    const result = await localSync(params);
    // Assert
    expect(mockGetTranscriptionSpy).toHaveBeenCalledTimes(1);
    expect(params.getTranscription).toHaveBeenCalledWith('p1', 'artifactId');
    expect(mockDoChapterSpy).toHaveBeenCalledTimes(1);
    expect(mockDoChapterSpy).toHaveBeenCalledWith({
      chap: 'JON-2',
      passInfo: [
        {
          mediaId: 'm1',
          passage: params.passages[0],
          transcription: 'My transcription',
        },
      ],
      ptProjName: 'ptProjName',
      memory: params.memory,
      userId: 'u1',
      exportNumbers: false,
      sectionArr: [],
    });
    expect(result).toBe('');
  });
});
