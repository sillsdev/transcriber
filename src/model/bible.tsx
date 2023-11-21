import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';

export interface Bible extends BaseModel {
  attributes: {
    bibleId: string;
    bibleName: string;
    iso: string;
    publishingData: string;
    anyPublished: boolean;
    //abbr: string;
    description: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    isoMediafile: RecordRelationship;
    bibleMediafile: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export default Bible;
