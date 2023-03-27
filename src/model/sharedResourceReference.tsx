import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';

export interface SharedResourceReference extends BaseModel {
  attributes: {
    book: string;
    chapter: number;
    verse: number; //or maybe this isn't here at all?
    verses: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships: {
    sharedResource: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}
