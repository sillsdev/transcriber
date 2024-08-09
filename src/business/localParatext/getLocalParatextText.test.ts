import { Passage } from '../../model';
import { getLocalParatextText } from './getLocalParatextText';
import { DOMParser } from '@xmldom/xmldom';
const parser = new DOMParser();

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

  it('should return verse content for each chapter for 1:67-2:5', async () => {
    // Arrange
    const pass = {
      attributes: {
        book: 'LUK',
        reference: '1:67-2:5',
      },
    } as Passage;
    const ptProjName = 'MyParatextProject';
    const mockParatextPathsSpy = jest
      .spyOn(mockParatextPaths, 'paratextPaths')
      .mockImplementation((arg) => {
        if (arg === 'LUK-1') {
          return { chapterFile: 'LUK-1.usx' };
        } else {
          return { chapterFile: 'LUK-2.usx' };
        }
      });
    const mockReachChapterSpy = jest
      .spyOn(mockReadChapter, 'readChapter')
      .mockImplementation((paths) => {
        if ((paths as any).chapterFile === 'LUK-1.usx') {
          return parser.parseFromString(
            `<usx><verse number="67-80" style="v"/>V67-80</usx>`
          ) as Document;
        } else {
          return parser.parseFromString(
            `<usx><verse number="1-5" style="v"/>V1-5</usx>`
          ) as Document;
        }
      });
    const mockGetPassageVersesSpy = jest
      .spyOn(mockGetParatextVerses, 'getPassageVerses')
      .mockImplementation((doc, pass) => {
        const verses = (doc as any).getElementsByTagName('verse') as Element[];
        const verseTexts = Array.from(verses).map(
          (v) => v.nextSibling?.textContent
        );
        return verseTexts.join(' ');
      });
    // Act
    const result = await getLocalParatextText(pass, ptProjName);
    // Assert
    expect(mockReachChapterSpy).toHaveBeenCalledTimes(2);
    expect(mockParatextPathsSpy).toHaveBeenCalledTimes(2);
    expect(mockGetPassageVersesSpy).toHaveBeenCalledTimes(2);
    expect(result).toBe('V67-80\\c 2 V1-5');
  });
});
