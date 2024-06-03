import { Passage } from '../../model';
import { crossChapterRefs } from './crossChapterRefs';

describe('crossChapterRefs', () => {
  it('should return the start chapter if there is no end chapter', () => {
    // Arrange
    const pass = {
      attributes: {
        book: 'MAT',
        startChapter: 1,
        startVerse: 1,
      },
    };
    // Act
    const result = crossChapterRefs(pass as Passage);
    // Assert
    expect(result).toBe(1);
  });

  it('should return the start chapter if more verses are in the start chapter', () => {
    // Arrange
    const pass = {
      attributes: {
        book: 'MAT',
        startChapter: 1,
        startVerse: 1,
        endChapter: 2,
        endVerse: 1,
      },
    };
    // Act
    const result = crossChapterRefs(pass as Passage);
    // Assert
    expect(result).toBe(1);
  });

  it('should return the end chapter if more verses are in the end chapter', () => {
    // Arrange
    const pass = {
      attributes: {
        book: 'MAT',
        startChapter: 1,
        startVerse: 24,
        endChapter: 2,
        endVerse: 3,
      },
    };
    // Act
    const result = crossChapterRefs(pass as Passage);
    // Assert
    expect(result).toBe(2);
  });

  it('should return the start chapter if the verses are equal in the both chapters', () => {
    // Arrange
    const pass = {
      attributes: {
        book: 'MAT',
        startChapter: 1,
        startVerse: 24,
        endChapter: 2,
        endVerse: 2,
      },
    };
    // Act
    const result = crossChapterRefs(pass as Passage);
    // Assert
    expect(result).toBe(1);
  });

  it('should complain if the end chapter is nost the next chapter', () => {
    // Arrange
    const pass = {
      attributes: {
        book: 'MAT',
        startChapter: 1,
        startVerse: 24,
        endChapter: 3,
        endVerse: 3,
      },
    };
    // Act
    const result = crossChapterRefs(pass as Passage);
    // Assert
    expect(result).toBe('Chapter range (1-3) too large');
  });
});
