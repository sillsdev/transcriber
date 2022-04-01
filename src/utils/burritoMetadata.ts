import { Project, User } from '../model';
import moment from 'moment';
const progPackage = require('../../package.json');

export interface FormatsType {
  [format: string]: {
    compression: string; // extension
    trackConfiguration: '1/0 (Mono)';
    //bitRate: 128000,
    bitRate: number;
    bitDepth: number;
    samplingRate: number;
  };
}

interface ScopeType {
  [book: string]: string[];
}

interface IngredientsType {
  [key: string]: {
    checksum?: {
      md5: string; // 32 hexidecimal digits
    };
    mimeType?: string; // mime type
    size: number;
    scope: ScopeType;
  };
}

interface IProps {
  projRec: Project;
  userRec: User;
}
export const burritoMetadata = ({ projRec, userRec }: IProps) => {
  const created = moment().locale('en').format('YYYY-MM-DDThh:mm:ss.SSSSSSZ');
  let meta = {
    meta: {
      version: '0.3.1',
      category: 'source',
      generator: {
        softwareName: progPackage.build.productName,
        softwareVersion: progPackage.version,
        userName: userRec.attributes.name,
      },
      defaultLanguage: projRec.attributes?.language,
      dateCreated: created,
      comments: [],
    },
    // idAuthorities: {
    //   dbl: {
    //     id: 'https://thedigitalbiblelibrary.org',
    //     name: {
    //       en: 'The Digital Bible Library',
    //     },
    //   },
    // },
    identification: {
      // primary: {
      //   dbl: {
      //     '6e0d81a24efbb679': {
      //       revision: '9',
      //       timestamp: created,
      //     },
      //   },
      // },
      name: {
        en: projRec.attributes?.name,
      },
      description: {
        en: projRec.attributes?.description,
      },
      // abbreviation: {
      //   en: 'DBLTD',
      // },
    },
    languages: [
      {
        tag: projRec.attributes?.language,
        name: {
          en: projRec.attributes?.languageName,
        },
      },
    ],
    type: {
      flavorType: {
        name: 'scripture',
        flavor: {
          name: 'audioTranslation',
          // performance: ['multipleVoice', 'drama', 'withMusic'],
          performance: [],
          formats: {
            // format1: {
            //   compression: 'ogg',
            //   trackConfiguration: '1/0 (Mono)',
            //   // bitRate: 128000,
            //   bitRate: 0,
            //   bitDepth: 32,
            //   samplingRate: 48000,
            // },
          } as FormatsType,
        },
        currentScope: {
          // GEN: [],
          // MAT: [],
        } as ScopeType,
      },
    },
    confidential: true,
    // agencies: [
    //   {
    //     id: 'dbl::54650cfa5117ad690fb05fb6',
    //     roles: ['rightsHolder'],
    //     url: 'http://thedigitalbiblelibrary.org',
    //     name: {
    //       en: 'Organization for DBL Testing',
    //     },
    //     abbr: {
    //       en: 'TEST',
    //     },
    //   },
    //   {
    //     id: 'dbl::54650ce75117ad68c4c49e91',
    //     roles: ['content', 'publication', 'management', 'finance', 'qa'],
    //     name: {
    //       en: 'Test Creator',
    //     },
    //   },
    //   {
    //     id: 'dbl::54650ce85117ad68c4c49e99',
    //     roles: ['content', 'publication', 'management', 'finance', 'qa'],
    //     name: {
    //       en: 'Test Publisher',
    //     },
    //   },
    // ],
    // targetAreas: [
    //   {
    //     code: 'US',
    //     name: {
    //       en: 'United States',
    //     },
    //   },
    // ],
    // names: {
    //   'book-gen': {
    //     abbr: {
    //       en: 'Gn',
    //     },
    //     short: {
    //       en: 'Genesis',
    //     },
    //     long: {
    //       en: 'Genesis',
    //     },
    //   },
    //   'book-mat': {
    //     abbr: {
    //       en: 'Mt',
    //     },
    //     short: {
    //       en: 'Matthew',
    //     },
    //     long: {
    //       en: 'The Gospel according to Matthew',
    //     },
    //   },
    // },
    ingredients: {
      // 'release/audio/GEN/GEN_001.mp3': {
      //   checksum: {
      //     md5: 'b5fd441feb7eed02c68dca3d8dbbfe80',
      //   },
      //   mimeType: 'audio/mpeg',
      //   size: 10168353,
      //   scope: {
      //     GEN: ['1'],
      //   },
      // },
      // 'release/audio/GEN/GEN_002.mp3': {
      //   checksum: {
      //     md5: 'd8737c9c4339b95ab0c876a6867415af',
      //   },
      //   mimeType: 'audio/mpeg',
      //   size: 7977633,
      //   scope: {
      //     GEN: ['2'],
      //   },
      // },
      // 'release/audio/GEN/GEN_003.mp3': {
      //   checksum: {
      //     md5: 'e5d4e332ac7070a66915ce2f898f85f6',
      //   },
      //   mimeType: 'audio/mpeg',
      //   size: 9992673,
      //   scope: {
      //     GEN: ['3'],
      //   },
      // },
      // 'release/audio/MAT/MAT_001.mp3': {
      //   checksum: {
      //     md5: '48e2d311b4de8a61b1f311ddb2be970f',
      //   },
      //   mimeType: 'audio/mpeg',
      //   size: 8399073,
      //   scope: {
      //     MAT: ['1'],
      //   },
      // },
      // 'release/audio/MAT/MAT_002.mp3': {
      //   checksum: {
      //     md5: 'f5fad0278058706de82fdcc800da83ff',
      //   },
      //   mimeType: 'audio/mpeg',
      //   size: 10095393,
      //   scope: {
      //     MAT: ['2'],
      //   },
      // },
      // 'release/audio/MAT/MAT_003.mp3': {
      //   checksum: {
      //     md5: '8019d42da92d9ad42be0e0c75ef4fddb',
      //   },
      //   mimeType: 'audio/mpeg',
      //   size: 6794913,
      //   scope: {
      //     MAT: ['3'],
      //   },
      // },
    } as IngredientsType,
    copyright: {
      shortStatements: [
        // {
        //   statement: '<p>Test Copyright. All rights reserved.</p>',
        //   mimetype: 'text/html',
        //   lang: 'en',
        // },
      ],
    },
  };
  return meta;
};
