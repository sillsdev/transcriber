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
      meta: {
        schema: 'https://burrito.bible/schema/burrito-wrapper.schema.json',
        version: '0.1',
        generator: {
          name: 'TestBuilder',
          version: '1.0.0',
        },
        dateCreated: expect.any(String),
        comments: '',
      },
      identification: {
        name: {
          en: 'Test Wrapper',
        },
        abbreviation: {
          en: 'TEST',
        },
        description: {
          en: 'Test description',
        },
      },
      type: {
        flavor: 'wrapper',
        role: 'container',
      },
      contents: {
        burritos: [],
        alignments: [],
      },
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
      meta: {
        schema: 'https://burrito.bible/schema/burrito-wrapper.schema.json',
        version: '0.1',
        generator: {
          name: 'TestBuilder',
          version: '1.0.0',
        },
        dateCreated: '2024-03-21',
        comments: 'Test comments',
      },
      identification: {
        name: {
          en: 'Test Wrapper',
        },
        abbreviation: {
          en: 'TEST',
        },
        description: {
          en: 'Test description',
        },
      },
      type: {
        flavor: 'wrapper',
        role: 'container',
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
});
