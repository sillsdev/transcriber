import { expect, describe, it } from '@jest/globals';
import { wrapperBuilder } from './wrapperBuilder';

describe('wrapperBuilder', () => {
  it('should create a wrapper with required parameters', () => {
    const result = wrapperBuilder({
      genName: 'TestBuilder',
      genVersion: '1.0.0',
      name: 'Test Wrapper',
      abbreviation: 'TEST',
      description: 'Test description',
    });

    expect(result).toEqual({
      format: 'scripture burrito wrapper',
      meta: {
        version: '0.0.1',
        name: {
          en: 'Test Wrapper',
        },
        abbreviation: {
          en: 'TEST',
        },
        description: {
          en: 'Test description',
        },
        generator: {
          name: 'TestBuilder',
          version: '1.0.0',
        },
        dateCreated: expect.any(String),
      },
      contents: {},
    });

    // Verify dateCreated is in YYYY-MM-DD format
    expect(result.meta.dateCreated).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('should create a wrapper with all parameters', () => {
    const result = wrapperBuilder({
      genName: 'TestBuilder',
      genVersion: '1.0.0',
      name: 'Test Wrapper',
      abbreviation: 'TEST',
      description: 'Test description',
      dateCreated: '2024-03-21',
      comments: 'Test comments',
      burritos: [
        {
          id: 'test-burrito',
          path: 'test/',
          role: 'testRole',
        },
      ],
      alignments: [
        {
          source: 'source',
          target: 'target',
          path: 'alignments/test.align.json',
          description: {
            en: 'Test alignment',
          },
        },
      ],
    });

    expect(result).toEqual({
      format: 'scripture burrito wrapper',
      meta: {
        version: '0.0.1',
        name: {
          en: 'Test Wrapper',
        },
        abbreviation: {
          en: 'TEST',
        },
        description: {
          en: 'Test description',
        },
        generator: {
          name: 'TestBuilder',
          version: '1.0.0',
        },
        dateCreated: '2024-03-21',
        comments: 'Test comments',
      },
      contents: {
        burritos: [
          {
            id: 'test-burrito',
            path: 'test/',
            role: 'testRole',
          },
        ],
        alignments: [
          {
            source: 'source',
            target: 'target',
            path: 'alignments/test.align.json',
            description: {
              en: 'Test alignment',
            },
          },
        ],
      },
    });
  });

  it('should create the example in the documentation', () => {
    const result = wrapperBuilder({
      name: 'Text Translation Bundle with Back Translation and Commentary',
      description:
        'Includes a source text, derived translations, alignment between source and target, and a Bible background commentary.',
      dateCreated: '2024-03-21',
      burritos: [
        {
          id: 'source-text-greek',
          path: 'source-text-greek/',
          role: 'source',
        },
        {
          id: 'target-translation-swahili',
          path: 'target-translation-swahili/',
          role: 'derived',
        },
        {
          id: 'back-translation-english',
          path: 'back-translation-english/',
          role: 'derived',
        },
        {
          id: 'bible-background-commentary',
          path: 'bible-background-commentary/',
          role: 'supplemental',
        },
      ],
      alignments: [
        {
          source: 'source-text-greek',
          target: 'target-translation-swahili',
          path: 'alignments/gr-text_swahili-translation.align.json',
          description: {
            en: 'Verse-level alignment between Swahili translation and English back translation',
          },
        },
        {
          source: 'target-translation-swahili',
          target: 'back-translation-english',
          path: 'alignments/sw-text_bt-text.align.json',
          description: {
            en: 'Verse-level alignment between Swahili translation and English back translation',
          },
        },
      ],
    });
    expect(result).toEqual({
      format: 'scripture burrito wrapper',
      meta: {
        version: '0.0.1',
        name: {
          en: 'Text Translation Bundle with Back Translation and Commentary',
        },
        description: {
          en: 'Includes a source text, derived translations, alignment between source and target, and a Bible background commentary.',
        },
        dateCreated: '2024-03-21',
      },
      contents: {
        burritos: [
          {
            id: 'source-text-greek',
            path: 'source-text-greek/',
            role: 'source',
          },
          {
            id: 'target-translation-swahili',
            path: 'target-translation-swahili/',
            role: 'derived',
          },
          {
            id: 'back-translation-english',
            path: 'back-translation-english/',
            role: 'derived',
          },
          {
            id: 'bible-background-commentary',
            path: 'bible-background-commentary/',
            role: 'supplemental',
          },
        ],
        alignments: [
          {
            source: 'source-text-greek',
            target: 'target-translation-swahili',
            path: 'alignments/gr-text_swahili-translation.align.json',
            description: {
              en: 'Verse-level alignment between Swahili translation and English back translation',
            },
          },
          {
            source: 'target-translation-swahili',
            target: 'back-translation-english',
            path: 'alignments/sw-text_bt-text.align.json',
            description: {
              en: 'Verse-level alignment between Swahili translation and English back translation',
            },
          },
        ],
      },
    });
  });
});
