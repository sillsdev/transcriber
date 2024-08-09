import { getLastVerse } from './getLastVerse';

describe('getLastVerse', () => {
  it('should return the last verse of the MAT 1 chapter', () => {
    const book = 'MAT';
    const chap = 1;
    expect(getLastVerse(book, chap)).toBe(25);
  });

  it('should return the last verse of the MAT 28 chapter', () => {
    const book = 'MAT';
    const chap = 28;
    expect(getLastVerse(book, chap)).toBe(20);
  });

  it('should return the last verse of the REV 22 chapter', () => {
    const book = 'REV';
    const chap = 22;
    expect(getLastVerse(book, chap)).toBe(21);
  });

  it('should return the last verse of the GEN 50 chapter', () => {
    const book = 'GEN';
    const chap = 50;
    expect(getLastVerse(book, chap)).toBe(26);
  });

  it('should return the last verse of the PSA 150 chapter', () => {
    const book = 'PSA';
    const chap = 150;
    expect(getLastVerse(book, chap)).toBe(6);
  });

  it('should return undefined as the last verse of the MAT 29 chapter', () => {
    const book = 'MAT';
    const chap = 29;
    expect(getLastVerse(book, chap)).toBe(undefined);
  });
});
