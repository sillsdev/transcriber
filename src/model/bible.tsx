import { RecordRelationship } from '@orbit/records';
import { BaseModel } from './baseModel';
import { InitializedRecord } from '@orbit/records';

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

export type BibleD = Bible & InitializedRecord;

export default Bible;
