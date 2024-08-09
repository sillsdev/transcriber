import { PassageD } from '../../model';
import { parseTranscription } from './parseTranscription';

describe('parseTranscription', () => {
  it('should return an array of passages with the last comment if there are no internal verses', () => {
    // Arrange
    const currentPassage = {
      attributes: {
        lastComment: '',
      },
    } as PassageD;
    const transcription = 'This is a transcription.';
    // Act
    const result = parseTranscription(currentPassage, transcription);
    // Assert
    expect(result).toHaveLength(1);
    expect(result[0].attributes.lastComment).toBe(transcription);
  });

  it('should return an array of passages with the internal verses', () => {
    // Arrange
    const currentPassage = {
      attributes: {
        book: 'MAT',
        reference: '1:1',
        startChapter: 1,
        startVerse: 1,
        endChapter: 1,
        endVerse: 1,
      },
      relationships: {},
    } as PassageD;
    const transcription =
      '\\v 1 This is a transcription. \\v 2 This is another transcription.';
    // Act
    const result = parseTranscription(currentPassage, transcription);
    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].attributes.reference).toBe('1:1');
    expect(result[0].attributes.lastComment).toBe('This is a transcription.');
    expect(result[1].attributes.reference).toBe('1:2');
    expect(result[1].attributes.lastComment).toBe(
      'This is another transcription.'
    );
  });

  it('should return an array of passages with verses from multiple chapters', () => {
    // Arrange
    const currentPassage = {
      attributes: {
        book: 'JON',
        reference: '1:17-2:10',
        startChapter: 1,
        startVerse: 17,
        endChapter: 2,
        endVerse: 10,
      },
      relationships: {},
    } as PassageD;
    const transcription =
      '\\v 17 This is a transcription. \\c 2 \\v 1-10 This is another transcription. This is the last comment.';
    // Act
    const result = parseTranscription(currentPassage, transcription);
    // Assert
    expect(result).toHaveLength(2);
    expect(result[0].attributes.reference).toBe('1:17');
    expect(result[0].attributes.lastComment).toBe('This is a transcription.');
    expect(result[1].attributes.reference).toBe('2:1-10');
    expect(result[1].attributes.lastComment).toBe(
      'This is another transcription. This is the last comment.'
    );
  });
});
