import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';

export interface SharedResource extends BaseModel {
  attributes: {
    title: string;
    description: string;
    languagebcp47: string;
    termsOfUse: string;
    keywords: string;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships: {
    passage: RecordRelationship;
    cluster: RecordRelationship; //organization
    artifactCategory: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}
