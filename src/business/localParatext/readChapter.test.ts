import { DOMParser } from '@xmldom/xmldom';
const domParser = new DOMParser();

describe('readChapter', () => {
  // see: https://stackoverflow.com/questions/41885841/how-can-i-mock-the-javascript-window-object-using-jest
  var windowSpy: any;

  beforeEach(() => {
    windowSpy = jest.spyOn(global, 'window', 'get');
  });

  afterEach(() => {
    windowSpy.mockRestore();
  });

  it('should read a chapter', async () => {
    // Arrange
    const paths = {
      chapterFile: 'path/to/chapterFile',
      book: 'book',
      chapter: 'chapter',
      program: jest.fn().mockResolvedValue({ stdout: '' }),
    };
    const ptProjName = 'ptProjName';

    const mockElectron = {
      temp: jest.fn().mockResolvedValue('temp'),
      read: jest.fn().mockResolvedValue('usx'),
    };

    windowSpy.mockImplementation(() => ({ electron: mockElectron }));

    const { readChapter } = await import('./readChapter');

    // Act
    const result = await readChapter(paths, ptProjName);

    // Assert
    expect(result).toEqual(domParser.parseFromString('usx'));
    expect(mockElectron.temp).toHaveBeenCalled();
    expect(paths.program).toHaveBeenCalledWith([
      '-r',
      ptProjName,
      paths.book,
      paths.chapter,
      paths.chapterFile,
      '-x',
    ]);
    expect(mockElectron.read).toHaveBeenCalledWith(paths.chapterFile, 'utf-8');
  });
});
