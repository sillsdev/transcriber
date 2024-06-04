import { Passage } from '../../model';
import { getLocalParatextText } from './getLocalParatextText';

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

var mockGetParatextVerses: any;
jest.mock('./usxNodeContent', () => {
  const retValue = {
    getPassageVerses: jest.fn(),
  };
  mockGetParatextVerses = retValue;
  return retValue;
});

describe('getLocalParatextText', () => {
  it('should return the text of a passage from a local Paratext project', async () => {
    // Arrange
    const pass = {
      attributes: {
        book: 'MAT',
        reference: '1:1-2',
      },
    } as Passage;
    const ptProjName = 'MyParatextProject';
    const mockReachChapterSpy = jest.spyOn(mockReadChapter, 'readChapter');
    const mockParatextPathsSpy = jest.spyOn(mockParatextPaths, 'paratextPaths');
    const mockGetPassageVersesSpy = jest
      .spyOn(mockGetParatextVerses, 'getPassageVerses')
      .mockImplementation(() => 'My transcription');
    // Act
    const result = await getLocalParatextText(pass, ptProjName);
    // Assert
    expect(mockReachChapterSpy).toHaveBeenCalledTimes(1);
    expect(mockParatextPathsSpy).toHaveBeenCalledTimes(1);
    expect(mockGetPassageVersesSpy).toHaveBeenCalledTimes(1);
    expect(result).toBe('My transcription');
  });
});
