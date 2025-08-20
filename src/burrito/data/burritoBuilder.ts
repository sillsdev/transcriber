interface BurritoMeta {
  version: string;
  category: string;
  generator: {
    softwareName: string;
    softwareVersion: string;
    userName: string;
  };
  defaultLocale: string;
  dateCreated: string;
  comments: string[];
}

interface BurritoIdentification {
  primary?: {
    [key: string]: {
      [key: string]: {
        revision: string;
        timestamp: string;
      };
    };
  };
  name?: {
    [key: string]: string;
  };
  description?: {
    [key: string]: string;
  };
  abbreviation?: {
    [key: string]: string;
  };
}

interface BurritoLanguage {
  tag: string;
  name: {
    [key: string]: string;
  };
}

interface BurritoFormat {
  compression: string;
  trackConfiguration?: string;
  bitRate?: number;
  bitDepth?: number;
  samplingRate?: number;
}

export interface BurritoFormats {
  [key: string]: BurritoFormat;
}

interface BurritoFlavor {
  name: string;
  performance: string[];
  formats: BurritoFormats;
}

export interface BurritoScopes {
  [book: string]: string[];
}

interface BurritoType {
  flavorType: {
    name: string;
    flavor: BurritoFlavor;
    currentScope: BurritoScopes;
  };
}

interface BurritoAgency {
  id: string;
  roles: string[];
  url?: string;
  name: {
    [key: string]: string;
  };
  abbr?: {
    [key: string]: string;
  };
}

interface BurritoTargetArea {
  code: string;
  name: {
    [key: string]: string;
  };
}

interface BurritoLocalizedName {
  abbr: {
    [key: string]: string;
  };
  short: {
    [key: string]: string;
  };
  long: {
    [key: string]: string;
  };
}

export interface BurritoLocalizedNames {
  [key: string]: BurritoLocalizedName;
}

interface BurritoIngredient {
  checksum: {
    md5: string;
  };
  mimeType: string;
  size?: number;
  scope?: {
    [key: string]: string[];
  };
}

export interface BurritoIngredients {
  [key: string]: BurritoIngredient;
}

interface BurritoCopyright {
  shortStatements: {
    statement: string;
    mimetype: string;
    lang: string;
  }[];
}

export interface Burrito {
  format: string;
  meta: BurritoMeta;
  idAuthorities?: {
    [key: string]: {
      id: string;
      name: { [key: string]: string };
    };
  };
  identification?: BurritoIdentification;
  languages?: BurritoLanguage[];
  type?: BurritoType;
  confidential?: boolean;
  agencies?: BurritoAgency[];
  targetAreas?: BurritoTargetArea[];
  localizedNames?: BurritoLocalizedNames;
  ingredients: BurritoIngredients;
  copyright?: BurritoCopyright;
}

export class BurritoBuilder {
  private burrito: Burrito = {
    format: 'scripture burrito',
    meta: {
      version: '1.0.0',
      category: 'source',
      generator: {
        softwareName: '',
        softwareVersion: '',
        userName: '',
      },
      defaultLocale: 'en',
      dateCreated: new Date().toISOString(),
      comments: [],
    },
    idAuthorities: {},
    identification: {
      primary: {
        dbl: {},
      },
      name: {},
      description: {},
      abbreviation: {},
    },
    languages: [],
    type: {
      flavorType: {
        name: 'scripture',
        flavor: {
          name: 'audioTranslation',
          performance: [],
          formats: {},
        },
        currentScope: {},
      },
    },
    confidential: true,
    agencies: [],
    targetAreas: [],
    localizedNames: {},
    ingredients: {},
    copyright: {
      shortStatements: [],
    },
  };

  withMeta(meta: Partial<BurritoMeta>): BurritoBuilder {
    this.burrito.meta = { ...this.burrito.meta, ...meta };
    return this;
  }

  withIdAuthority(id: string, name: string): BurritoBuilder {
    if (!this.burrito.idAuthorities) {
      this.burrito.idAuthorities = {};
    }
    this.burrito.idAuthorities[id] = {
      id,
      name: { en: name },
    };
    return this;
  }

  withIdentification(
    identification: Partial<BurritoIdentification>
  ): BurritoBuilder {
    this.burrito.identification = {
      ...this.burrito.identification,
      ...identification,
    };
    return this;
  }

  withLanguage(tag: string, name: string): BurritoBuilder {
    if (!this.burrito.languages) {
      this.burrito.languages = [];
    }
    this.burrito.languages.push({
      tag,
      name: { en: name },
    });
    return this;
  }

  withFlavor(flavor: Partial<BurritoFlavor>): BurritoBuilder {
    if (!this.burrito.type?.flavorType?.flavor) {
      if (!this.burrito.type?.flavorType) {
        if (!this.burrito.type) {
          this.burrito.type = {
            flavorType: {
              name: '',
              flavor: {
                name: '',
                performance: [],
                formats: {},
              },
              currentScope: {},
            },
          };
        }
        this.burrito.type.flavorType = {
          name: '',
          flavor: {
            name: '',
            performance: [],
            formats: {},
          },
          currentScope: {},
        };
      }
    }
    this.burrito.type.flavorType.flavor = {
      ...this.burrito.type.flavorType.flavor,
      ...flavor,
    };
    return this;
  }

  withAgency(agency: BurritoAgency): BurritoBuilder {
    if (!this.burrito.agencies) {
      this.burrito.agencies = [];
    }
    this.burrito.agencies.push(agency);
    return this;
  }

  withTargetArea(code: string, name: string): BurritoBuilder {
    if (!this.burrito.targetAreas) {
      this.burrito.targetAreas = [];
    }
    this.burrito.targetAreas.push({
      code,
      name: { en: name },
    });
    return this;
  }

  withLocalizedName(
    key: string,
    localizedName: BurritoLocalizedName
  ): BurritoBuilder {
    if (!this.burrito.localizedNames) {
      this.burrito.localizedNames = {};
    }
    this.burrito.localizedNames[key] = localizedName;
    return this;
  }

  withLocalizedNames(localizedNames: BurritoLocalizedNames): BurritoBuilder {
    if (!this.burrito.localizedNames) {
      this.burrito.localizedNames = {};
    }
    this.burrito.localizedNames = {
      ...this.burrito.localizedNames,
      ...localizedNames,
    };
    return this;
  }

  withIngredient(path: string, ingredient: BurritoIngredient): BurritoBuilder {
    this.burrito.ingredients[path] = ingredient;
    return this;
  }

  withCopyright(copyright: BurritoCopyright): BurritoBuilder {
    this.burrito.copyright = copyright;
    return this;
  }

  checkIdAuthority(result: Burrito) {
    if (
      result.idAuthorities &&
      Object.keys(result.idAuthorities).length === 0
    ) {
      delete result.idAuthorities;
    }
  }

  checkIdentification(result: Burrito) {
    if (result.identification) {
      const hasContent =
        (result.identification.primary?.dbl &&
          Object.keys(result.identification.primary.dbl).length > 0) ||
        (result.identification.name &&
          Object.keys(result.identification.name).length > 0) ||
        (result.identification.description &&
          Object.keys(result.identification.description).length > 0) ||
        (result.identification.abbreviation &&
          Object.keys(result.identification.abbreviation).length > 0);

      if (!hasContent) {
        delete result.identification;
      }
    }
  }

  checkLanguages(result: Burrito) {
    if (result.languages && result.languages.length === 0) {
      delete result.languages;
    }
  }

  // checkType(result: Burrito) {
  //   if (result.type?.flavorType?.flavor) {
  //     const hasContent =
  //       (result.type.flavorType.flavor.formats &&
  //         Object.keys(result.type.flavorType.flavor.formats).length > 0) ||
  //       (result.type.flavorType.flavor.performance &&
  //         result.type.flavorType.flavor.performance.length > 0) ||
  //       (result.type.flavorType.currentScope &&
  //         Object.keys(result.type.flavorType.currentScope).length > 0);

  //     if (!hasContent) {
  //       delete result.type;
  //     }
  //   }
  // }

  checkAgencies(result: Burrito) {
    if (result.agencies && result.agencies.length === 0) {
      delete result.agencies;
    }
  }

  checkTargetAreas(result: Burrito) {
    if (result.targetAreas && result.targetAreas.length === 0) {
      delete result.targetAreas;
    }
  }

  checkLocalizedNames(result: Burrito) {
    if (
      result.localizedNames &&
      Object.keys(result.localizedNames).length === 0
    ) {
      delete result.localizedNames;
    }
  }

  checkCopyright(result: Burrito) {
    if (
      result.copyright?.shortStatements &&
      result.copyright.shortStatements.length === 0
    ) {
      delete result.copyright;
    }
  }

  init(burrito?: Partial<Burrito>): BurritoBuilder {
    if (burrito) {
      this.burrito = {
        ...this.burrito,
        ...burrito,
        meta: { ...this.burrito.meta, ...burrito.meta },
        idAuthorities: {
          ...this.burrito.idAuthorities,
          ...burrito.idAuthorities,
        },
        identification: {
          ...this.burrito.identification,
          ...burrito.identification,
        },
        languages: [
          ...(this.burrito.languages || []),
          ...(burrito.languages || []),
        ],
        //type: { ...this.burrito.type, ...burrito.type },
        agencies: [
          ...(this.burrito.agencies || []),
          ...(burrito.agencies || []),
        ],
        targetAreas: [
          ...(this.burrito.targetAreas || []),
          ...(burrito.targetAreas || []),
        ],
        localizedNames: {
          ...this.burrito.localizedNames,
          ...burrito.localizedNames,
        },
        ingredients: { ...this.burrito.ingredients, ...burrito.ingredients },
      };
    }
    return this;
  }

  build(): Burrito {
    const result = { ...this.burrito };

    // Remove empty optional fields
    this.checkIdAuthority(result);
    this.checkIdentification(result);
    this.checkLanguages(result);
    // this.checkType(result);
    this.checkAgencies(result);
    this.checkTargetAreas(result);
    this.checkLocalizedNames(result);
    this.checkCopyright(result);
    return result;
  }
}

// Example usage:
export const createAudioBurrito = () => {
  return new BurritoBuilder()
    .withMeta({
      generator: {
        softwareName: 'DBLImport',
        softwareVersion: '0.0.0',
        userName: 'Eric Pyle',
      },
      comments: ['Updated with working audio files for GEN 1-3 and MAT 1-3'],
    })
    .withIdAuthority('dbl', 'The Digital Bible Library')
    .withIdentification({
      primary: {
        dbl: {
          '6e0d81a24efbb679': {
            revision: '9',
            timestamp: new Date().toISOString(),
          },
        },
      },
      name: { en: 'TEST Audio Bible - Local' },
      description: { en: 'TEST Audio Bible - Description' },
      abbreviation: { en: 'DBLTD' },
    })
    .withLanguage('en', 'English')
    .withFlavor({
      performance: ['multipleVoice', 'drama', 'withMusic'],
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
    .withAgency({
      id: 'dbl::54650cfa5117ad690fb05fb6',
      roles: ['rightsHolder'],
      url: 'http://thedigitalbiblelibrary.org',
      name: { en: 'Organization for DBL Testing' },
      abbr: { en: 'TEST' },
    })
    .withTargetArea('US', 'United States')
    .withLocalizedName('book-gen', {
      abbr: { en: 'Gn' },
      short: { en: 'Genesis' },
      long: { en: 'Genesis' },
    })
    .withIngredient('release/audio/GEN/GEN_001.mp3', {
      checksum: { md5: 'b5fd441feb7eed02c68dca3d8dbbfe80' },
      mimeType: 'audio/mpeg',
      size: 10168353,
      scope: { GEN: ['1'] },
    })
    .withCopyright({
      shortStatements: [
        {
          statement: '<p>Test Copyright. All rights reserved.</p>',
          mimetype: 'text/html',
          lang: 'en',
        },
      ],
    })
    .build();
};
