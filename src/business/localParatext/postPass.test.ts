import Memory from '@orbit/memory';
import { postPass } from './postPass';
import { PassageInfo } from './PassageInfo';
import { DOMParser } from '@xmldom/xmldom';
import { PassageD } from '../../model';
const domParser = new DOMParser();

var mockChapDom = domParser.parseFromString('<usx/>');
var mockMemory = { update: jest.fn() } as unknown as Memory;

describe('postPass', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockChapDom = domParser.parseFromString('<usx></usx>');
  });

  it('should post one verse to the current empty chapter', () => {
    // Arrange
    const passage = {
      attributes: {
        book: 'MAT',
        reference: '1:1',
      },
    } as PassageD;
    const params = {
      doc: mockChapDom,
      chap: '1',
      currentPI: {
        passage,
        mediaId: 'm1',
        transcription: 'transcription',
      } as PassageInfo,
      exportNumbers: false,
      sectionArr: [],
      memory: mockMemory,
    };
    // Act
    postPass(params);
    // Assert
    expect(mockMemory.update).not.toHaveBeenCalled();
    expect(mockChapDom.documentElement?.toString()).toBe(
      `<usx><para style="p">\r\n<verse number="1" style="v"/>transcription</para></usx>`
    );
  });

  it('should post two verses to the current empty chapter', () => {
    // Arrange
    const passage = {
      attributes: {
        book: 'MAT',
        reference: '1:1-2',
      },
    } as PassageD;
    const params = {
      doc: mockChapDom,
      chap: '1',
      currentPI: {
        passage,
        mediaId: 'm1',
        transcription: 'transcription',
      } as PassageInfo,
      exportNumbers: false,
      sectionArr: [],
      memory: mockMemory,
    };
    // Act
    postPass(params);
    // Assert
    expect(mockMemory.update).not.toHaveBeenCalled();
    expect(mockChapDom.documentElement?.toString()).toBe(
      `<usx><para style="p">\r\n<verse number="1-2" style="v"/>transcription</para></usx>`
    );
  });

  it('should post three verses to the current empty chapter', () => {
    // Arrange
    const passage = {
      attributes: {
        book: 'MAT',
        reference: '1:1-3',
      },
    } as PassageD;
    const params = {
      doc: mockChapDom,
      chap: '1',
      currentPI: {
        passage,
        mediaId: 'm1',
        transcription: 'transcription',
      } as PassageInfo,
      exportNumbers: false,
      sectionArr: [],
      memory: mockMemory,
    };
    // Act
    postPass(params);
    // Assert
    expect(mockMemory.update).not.toHaveBeenCalled();
    expect(mockChapDom.documentElement?.toString()).toBe(
      `<usx><para style="p">\r\n<verse number="1-3" style="v"/>transcription</para></usx>`
    );
  });

  it('should put transcription in second chapter when more verses and no markup included', () => {
    // Arrange
    const passage = {
      attributes: {
        book: 'JON',
        reference: '1:17-2:10',
      },
    } as PassageD;
    const params = {
      doc: mockChapDom,
      chap: '2',
      currentPI: {
        passage,
        mediaId: 'm1',
        transcription: 'transcription',
      } as PassageInfo,
      exportNumbers: false,
      sectionArr: [],
      memory: mockMemory,
    };
    // Act
    postPass(params);
    // Assert
    expect(mockChapDom.documentElement?.toString()).toBe(
      `<usx><para style="p">\r\n<verse number="1-10" style="v"/>[1:17-2:10] transcription</para></usx>`
    );
  });

  it('should put no content in first chapter when more verses and no markup included', () => {
    // Arrange
    const passage = {
      attributes: {
        book: 'JON',
        reference: '1:17-2:10',
      },
    } as PassageD;
    const params = {
      doc: mockChapDom,
      chap: '1',
      currentPI: {
        passage,
        mediaId: 'm1',
        transcription: 'transcription',
      } as PassageInfo,
      exportNumbers: false,
      sectionArr: [],
      memory: mockMemory,
    };
    // Act
    postPass(params);
    // Assert
    expect(mockChapDom.documentElement?.toString()).toBe(`<usx/>`);
  });

  it('should put transcription in first chapter when more verses and no markup included', () => {
    // Arrange
    const passage = {
      attributes: {
        book: 'LUK',
        reference: '4:38-5:1',
      },
    } as PassageD;
    const params = {
      doc: mockChapDom,
      chap: '4',
      currentPI: {
        passage,
        mediaId: 'm1',
        transcription: 'transcription',
      } as PassageInfo,
      exportNumbers: false,
      sectionArr: [],
      memory: mockMemory,
    };
    // Act
    postPass(params);
    // Assert
    expect(mockChapDom.documentElement?.toString()).toBe(
      `<usx><para style="p">\r\n<verse number="38-44" style="v"/>[4:38-5:1] transcription</para></usx>`
    );
  });

  it('should put no content in second chapter when more verses and no markup included', () => {
    // Arrange
    const passage = {
      attributes: {
        book: 'LUK',
        reference: '4:38-5:1',
      },
    } as PassageD;
    const params = {
      doc: mockChapDom,
      chap: '5',
      currentPI: {
        passage,
        mediaId: 'm1',
        transcription: 'transcription',
      } as PassageInfo,
      exportNumbers: false,
      sectionArr: [],
      memory: mockMemory,
    };
    // Act
    postPass(params);
    // Assert
    expect(mockChapDom.documentElement?.toString()).toBe(`<usx/>`);
  });

  it('should put transcription in second chapter when more verses and no markup included and startVerse already set to one', () => {
    // Arrange
    const passage = {
      attributes: {
        book: 'JON',
        reference: '1:17-2:10',
        startChapter: 2,
        startVerse: 1,
        endChapter: 2,
        endVerse: 10,
      },
    } as PassageD;
    const params = {
      doc: mockChapDom,
      chap: '2',
      currentPI: {
        passage,
        mediaId: 'm1',
        transcription: 'transcription',
      } as PassageInfo,
      exportNumbers: false,
      sectionArr: [],
      memory: mockMemory,
    };
    // Act
    postPass(params);
    // Assert
    expect(mockChapDom.documentElement?.toString()).toBe(
      `<usx><para style="p">\r\n<verse number="1-10" style="v"/>[1:17-2:10] transcription</para></usx>`
    );
  });

  it('should put first content in first chapter if marked up', () => {
    // Arrange
    const passage = {
      attributes: {
        book: 'JON',
        reference: '1:17-2:10',
      },
    } as PassageD;
    const params = {
      doc: mockChapDom,
      chap: '1',
      currentPI: {
        passage,
        mediaId: 'm1',
        transcription:
          '\\v 17 transcription \\c 2 \\v 1-10 rest of transcription',
      } as PassageInfo,
      exportNumbers: false,
      sectionArr: [],
      memory: mockMemory,
    };
    // Act
    postPass(params);
    // Assert
    expect(mockMemory.update).not.toHaveBeenCalled();
    expect(mockChapDom.documentElement?.toString()).toBe(
      `<usx><para style="p">\r\n<verse number="17" style="v"/>transcription</para></usx>`
    );
  });

  it('should put rest of content in second chapter if marked up', () => {
    // Arrange
    const passage = {
      attributes: {
        book: 'JON',
        reference: '1:17-2:10',
      },
    } as PassageD;
    const params = {
      doc: mockChapDom,
      chap: '2',
      currentPI: {
        passage,
        mediaId: 'm1',
        transcription:
          '\\v 17 transcription \\c 2 \\v 1-10 rest of transcription',
      } as PassageInfo,
      exportNumbers: false,
      sectionArr: [],
      memory: mockMemory,
    };
    // Act
    postPass(params);
    // Assert
    expect(mockMemory.update).not.toHaveBeenCalled();
    expect(mockChapDom.documentElement?.toString()).toBe(
      `<usx><para style="p">\r\n<verse number="1-10" style="v"/>rest of transcription</para></usx>`
    );
  });
});
