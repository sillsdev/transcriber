import { mapWrapperToTreeData } from './treeData';
import { wrapperBuilder } from './wrapperBuilder';

describe('mapWrapperToTreeData', () => {
  it('should map a simple wrapper to tree data', () => {
    const wrapper = wrapperBuilder({
      genName: 'TestBuilder',
      genVersion: '1.0.0',
      name: 'Test Wrapper',
      abbreviation: 'TEST',
      description: 'Test description',
    });

    const result = mapWrapperToTreeData(wrapper);

    expect(result.data).toEqual([
      {
        id: 'meta',
        label: 'meta',
        children: [
          {
            id: 'meta|schema',
            label:
              'schema: https://burrito.bible/schema/burrito-wrapper.schema.json',
          },
          {
            id: 'meta|version',
            label: 'version: 0.1',
          },
          {
            id: 'meta|generator',
            label: 'generator',
            children: [
              {
                id: 'meta|generator|name',
                label: 'name: TestBuilder',
              },
              {
                id: 'meta|generator|version',
                label: 'version: 1.0.0',
              },
            ],
          },
          {
            id: 'meta|dateCreated',
            label: 'dateCreated: ' + wrapper.meta.dateCreated,
          },
          {
            id: 'meta|comments',
            label: 'comments: ',
          },
        ],
      },
      {
        id: 'identification',
        label: 'identification',
        children: [
          {
            id: 'identification|name',
            label: 'name',
            children: [
              {
                id: 'identification|name|en',
                label: 'en: Test Wrapper',
              },
            ],
          },
          {
            id: 'identification|abbreviation',
            label: 'abbreviation',
            children: [
              {
                id: 'identification|abbreviation|en',
                label: 'en: TEST',
              },
            ],
          },
          {
            id: 'identification|description',
            label: 'description',
            children: [
              {
                id: 'identification|description|en',
                label: 'en: Test description',
              },
            ],
          },
        ],
      },
      {
        id: 'type',
        label: 'type',
        children: [
          {
            id: 'type|flavor',
            label: 'flavor: wrapper',
          },
          {
            id: 'type|role',
            label: 'role: container',
          },
        ],
      },
      {
        id: 'contents',
        label: 'contents',
        children: [
          {
            id: 'contents|burritos',
            label: 'burritos',
            children: [],
          },
          {
            id: 'contents|alignments',
            label: 'alignments',
            children: [],
          },
        ],
      },
    ]);
  });

  it('should map a wrapper with burritos and alignments to tree data', () => {
    const wrapper = wrapperBuilder({
      genName: 'TestBuilder',
      genVersion: '1.0.0',
      name: 'Test Wrapper',
      abbreviation: 'TEST',
      description: 'Test description',
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

    const result = mapWrapperToTreeData(wrapper);

    expect(result.data).toEqual([
      {
        id: 'meta',
        label: 'meta',
        children: [
          {
            id: 'meta|schema',
            label:
              'schema: https://burrito.bible/schema/burrito-wrapper.schema.json',
          },
          {
            id: 'meta|version',
            label: 'version: 0.1',
          },
          {
            id: 'meta|generator',
            label: 'generator',
            children: [
              {
                id: 'meta|generator|name',
                label: 'name: TestBuilder',
              },
              {
                id: 'meta|generator|version',
                label: 'version: 1.0.0',
              },
            ],
          },
          {
            id: 'meta|dateCreated',
            label: 'dateCreated: ' + wrapper.meta.dateCreated,
          },
          {
            id: 'meta|comments',
            label: 'comments: ',
          },
        ],
      },
      {
        id: 'identification',
        label: 'identification',
        children: [
          {
            id: 'identification|name',
            label: 'name',
            children: [
              {
                id: 'identification|name|en',
                label: 'en: Test Wrapper',
              },
            ],
          },
          {
            id: 'identification|abbreviation',
            label: 'abbreviation',
            children: [
              {
                id: 'identification|abbreviation|en',
                label: 'en: TEST',
              },
            ],
          },
          {
            id: 'identification|description',
            label: 'description',
            children: [
              {
                id: 'identification|description|en',
                label: 'en: Test description',
              },
            ],
          },
        ],
      },
      {
        id: 'type',
        label: 'type',
        children: [
          {
            id: 'type|flavor',
            label: 'flavor: wrapper',
          },
          {
            id: 'type|role',
            label: 'role: container',
          },
        ],
      },
      {
        id: 'contents',
        label: 'contents',
        children: [
          {
            id: 'contents|burritos',
            label: 'burritos',
            children: [
              {
                id: 'contents|burritos|0',
                label: '0',
                children: [
                  {
                    id: 'contents|burritos|0|id',
                    label: 'id: test-burrito',
                  },
                  {
                    id: 'contents|burritos|0|path',
                    label: 'path: test/',
                  },
                  {
                    id: 'contents|burritos|0|role',
                    label: 'role: testRole',
                  },
                ],
              },
            ],
          },
          {
            id: 'contents|alignments',
            label: 'alignments',
            children: [
              {
                id: 'contents|alignments|0',
                label: '0',
                children: [
                  {
                    id: 'contents|alignments|0|source',
                    label: 'source: source',
                  },
                  {
                    id: 'contents|alignments|0|target',
                    label: 'target: target',
                  },
                  {
                    id: 'contents|alignments|0|path',
                    label: 'path: alignments/test.align.json',
                  },
                  {
                    id: 'contents|alignments|0|description',
                    label: 'description',
                    children: [
                      {
                        id: 'contents|alignments|0|description|en',
                        label: 'en: Test alignment',
                      },
                    ],
                  },
                ],
              },
            ],
          },
        ],
      },
    ]);
  });
});
