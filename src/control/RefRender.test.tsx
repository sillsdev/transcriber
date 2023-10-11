// Generated by CodiumAI

import { PassageTypeEnum } from '../model/passageType';
import {
  MovementIcon,
  // ChapterNumberIcon,
  BookIcon,
  AltBookIcon,
  // NoteIcon,
} from './PlanIcons';
import { passageTypeFromRef, isPublishingTitle, RefRender } from './RefRender';

describe('passageTypeFromRef', () => {
  // Returns the correct passage type when a valid reference value is provided.
  it('should return the correct passage type when a valid reference value is provided', () => {
    // Test case 1: ref starts with 'BOOK'
    expect(passageTypeFromRef('BOOK')).toBe(PassageTypeEnum.BOOK);

    // Test case 2: ref starts with 'CHNUM'
    expect(passageTypeFromRef('CHNUM 12')).toBe(PassageTypeEnum.CHAPTERNUMBER);

    // Test case 4: ref starts with 'ALTBK'
    expect(passageTypeFromRef('ALTBK')).toBe(PassageTypeEnum.ALTBOOK);

    // Test case 5: ref starts with 'NOTE'
    expect(passageTypeFromRef('NOTE Devotional')).toBe(PassageTypeEnum.NOTE);

    // Test case 6: ref starts with 'MOVE'
    expect(passageTypeFromRef('MOVE')).toBe(PassageTypeEnum.MOVEMENT);
  });
  // Returns the default passage type 'PASSAGE' for a reference value that does not match any passage type.
  it('should return the default passage type `PASSAGE` when the reference value does not match any passage type', () => {
    // Test case 1: ref is undefined
    expect(passageTypeFromRef()).toBe(PassageTypeEnum.PASSAGE);

    // Test case 2: ref is an empty string
    expect(passageTypeFromRef('')).toBe(PassageTypeEnum.PASSAGE);

    // Test case 3: ref does not match any passage type
    expect(passageTypeFromRef('ABC')).toBe(PassageTypeEnum.PASSAGE);
  });
});

describe('isPublishingTitle', () => {
  // Returns true for a valid book reference.
  it('should return true when the reference is a valid book reference', () => {
    expect(isPublishingTitle('BOOK')).toBe(true);
  });
  // Returns true for a valid chapter number reference.
  it('should return true when the reference is a valid chapter number', () => {
    expect(isPublishingTitle('CHNUM')).toBe(true);
  });

  // Returns true for a valid title reference.
  it('should return true when the reference is a valid title reference', () => {
    expect(isPublishingTitle('TITLE')).toBe(true);
  });

  // Returns true for a valid alternate book reference.
  it('should return true when the reference is a valid alternate book reference', () => {
    expect(isPublishingTitle('ALTBK')).toBe(true);
  });

  // Returns false for a valid note reference.
  it('should return false when given a valid note reference', () => {
    expect(isPublishingTitle('NOTE Devotional')).toBe(false);
  });

  // Returns false for a valid passage reference.
  it('should return false when given a valid passage reference', () => {
    expect(isPublishingTitle('1:1-4')).toBe(false);
  });
});

describe('RefRender', () => {
  // Returns the corresponding icon component based on the passage type.
  it('should return the corresponding icon component based on the passage type', () => {
    expect(<RefRender value={PassageTypeEnum.MOVEMENT} flat={false} />).toBe(
      MovementIcon
    );
    // expect(RefRender(PassageTypeEnum.CHAPTERNUMBER)).toBe(ChapterNumberIcon);
    expect(<RefRender value={PassageTypeEnum.BOOK} flat={false} />).toBe(
      BookIcon
    );
    expect(<RefRender value={PassageTypeEnum.ALTBOOK} flat={false} />).toBe(
      AltBookIcon
    );
    // expect(RefRender(PassageTypeEnum.NOTE)).toEqual(NoteIcon);
    expect(<RefRender value={'1:1-4'} flat={false} />).toBe(<>{'1:1-4'}</>);
  });
});
