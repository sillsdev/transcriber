import { paratextPaths } from './paratextPaths';

var mockGetReadWriteProg: any;
jest.mock('../../utils/paratextPath', () => {
  const retValue = {
    getReadWriteProg: jest.fn(),
  };
  mockGetReadWriteProg = retValue;
  return retValue;
});

describe('ParatextPaths', () => {
  it('should return the correct path for the book and chapter', async () => {
    // Arrange
    const mockGetReadWriteProgSpy = jest
      .spyOn(mockGetReadWriteProg, 'getReadWriteProg')
      .mockImplementation(() => Promise.resolve('ptProg'));
    // Act
    const result = await paratextPaths('MAT-1');
    // Assert
    expect(mockGetReadWriteProgSpy).toHaveBeenCalledTimes(1);
    expect(mockGetReadWriteProgSpy).toHaveBeenCalledWith();
    expect(result).toEqual({
      chapterFile: '/tmp/MAT-1.usx',
      book: 'MAT',
      chapter: '1',
      program: 'ptProg',
    });
  });
});
