import { Record, RecordRelationship } from '@orbit/data';

export interface Organization extends Record {
    attributes: {
      name: string;
      "website-url": string;
      "logo-url": string;
      "public-by-default": string;
    };
    relationships?: {
      owner: RecordRelationship;
    };
  }

  export default Organization;