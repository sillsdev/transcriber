import { BurritoBuilder, createAudioBurrito } from './burritoBuilder';

describe('BurritoBuilder', () => {
  it('should create a basic burrito with default values', () => {
    const burrito = new BurritoBuilder().build();

    expect(burrito.format).toBe('scripture burrito');
    expect(burrito.meta.version).toBe('1.0.0');
    expect(burrito.meta.category).toBe('source');
    expect(burrito.meta.defaultLocale).toBe('en');
    expect(burrito.confidential).toBe(true);
  });

  it('should set meta information', () => {
    const burrito = new BurritoBuilder()
      .withMeta({
        generator: {
          softwareName: 'TestApp',
          softwareVersion: '1.0.0',
          userName: 'TestUser',
        },
        comments: ['Test comment'],
      })
      .build();

    expect(burrito.meta.generator.softwareName).toBe('TestApp');
    expect(burrito.meta.generator.softwareVersion).toBe('1.0.0');
    expect(burrito.meta.generator.userName).toBe('TestUser');
    expect(burrito.meta.comments).toContain('Test comment');
  });

  it('should add id authority', () => {
    const burrito = new BurritoBuilder()
      .withIdAuthority('dbl', 'The Digital Bible Library')
      .build();

    expect(burrito?.idAuthorities?.dbl?.id).toBe('dbl');
    expect(burrito?.idAuthorities?.dbl?.name.en).toBe(
      'The Digital Bible Library'
    );
  });

  it('should add language', () => {
    const burrito = new BurritoBuilder().withLanguage('en', 'English').build();

    expect(burrito?.languages?.[0]?.tag).toBe('en');
    expect(burrito?.languages?.[0]?.name.en).toBe('English');
  });

  it('should add flavor configuration', () => {
    const burrito = new BurritoBuilder()
      .withFlavor({
        performance: ['multipleVoice'],
        formats: {
          format1: {
            compression: 'mp3',
            trackConfiguration: '2/0 (Stereo)',
            bitRate: 128000,
            bitDepth: 16,
            samplingRate: 44100,
          },
        },
      })
      .build();

    expect(burrito?.type?.flavorType?.flavor?.performance).toContain(
      'multipleVoice'
    );
    expect(
      burrito?.type?.flavorType?.flavor?.formats?.format1?.compression
    ).toBe('mp3');
  });

  it('should add agency', () => {
    const burrito = new BurritoBuilder()
      .withAgency({
        id: 'test::123',
        roles: ['rightsHolder'],
        name: { en: 'Test Agency' },
      })
      .build();

    expect(burrito?.agencies?.[0]?.id).toBe('test::123');
    expect(burrito?.agencies?.[0]?.roles).toContain('rightsHolder');
    expect(burrito?.agencies?.[0]?.name.en).toBe('Test Agency');
  });

  it('should add target area', () => {
    const burrito = new BurritoBuilder()
      .withTargetArea('US', 'United States')
      .build();

    expect(burrito?.targetAreas?.[0]?.code).toBe('US');
    expect(burrito?.targetAreas?.[0]?.name.en).toBe('United States');
  });

  it('should add localized name', () => {
    const burrito = new BurritoBuilder()
      .withLocalizedName('book-gen', {
        abbr: { en: 'Gn' },
        short: { en: 'Genesis' },
        long: { en: 'Genesis' },
      })
      .build();

    expect(burrito?.localizedNames?.['book-gen']?.abbr.en).toBe('Gn');
    expect(burrito?.localizedNames?.['book-gen']?.short.en).toBe('Genesis');
  });

  it('should add ingredient', () => {
    const burrito = new BurritoBuilder()
      .withIngredient('test.mp3', {
        checksum: { md5: 'test123' },
        mimeType: 'audio/mpeg',
        size: 1000,
        scope: { GEN: ['1'] },
      })
      .build();

    expect(burrito.ingredients['test.mp3']?.checksum.md5).toBe('test123');
    expect(burrito.ingredients['test.mp3']?.mimeType).toBe('audio/mpeg');
    expect(burrito.ingredients['test.mp3']?.scope?.GEN).toContain('1');
  });

  it('should add copyright', () => {
    const burrito = new BurritoBuilder()
      .withCopyright({
        shortStatements: [
          {
            statement: '<p>Test Copyright</p>',
            mimetype: 'text/html',
            lang: 'en',
          },
        ],
      })
      .build();

    expect(burrito?.copyright?.shortStatements?.[0]?.statement).toBe(
      '<p>Test Copyright</p>'
    );
    expect(burrito?.copyright?.shortStatements?.[0]?.mimetype).toBe(
      'text/html'
    );
  });

  it('should create a complete audio burrito', () => {
    const burrito = createAudioBurrito();

    expect(burrito.format).toBe('scripture burrito');
    expect(burrito.meta.generator.softwareName).toBe('DBLImport');
    expect(burrito?.idAuthorities?.dbl?.name.en).toBe(
      'The Digital Bible Library'
    );
    expect(burrito?.languages?.[0]?.tag).toBe('en');
    expect(burrito?.type?.flavorType?.flavor?.performance).toContain(
      'multipleVoice'
    );
    expect(burrito?.agencies?.[0]?.roles).toContain('rightsHolder');
    expect(burrito?.targetAreas?.[0]?.code).toBe('US');
    expect(burrito?.localizedNames?.['book-gen']?.abbr.en).toBe('Gn');
    expect(
      burrito?.ingredients?.['release/audio/GEN/GEN_001.mp3']
    ).toBeDefined();
    expect(burrito?.copyright?.shortStatements?.[0]?.statement).toContain(
      'Test Copyright'
    );
  });
});
