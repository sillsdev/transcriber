import {
  Record,
  TransformBuilder,
  RecordRelationship,
  RecordIdentity,
} from '@orbit/data';
import Memory from '@orbit/memory';
import { related } from '../crud';
import { currentDateTime } from '../utils';

export interface BaseModel extends Record {
  attributes: {
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    lastModifiedByUser: RecordRelationship;
  };
}

export const UpdateRecord = (
  t: TransformBuilder,
  rec: BaseModel,
  user: string
): any => {
  rec.attributes.dateUpdated = currentDateTime();
  return [t.updateRecord(rec), ...UpdateLastModifedBy(t, rec, user)];
};

export const AddRecord = (
  t: TransformBuilder,
  rec: BaseModel,
  user: string,
  memory: Memory
): any => {
  memory.schema.initializeRecord(rec);
  console.log(rec);
  rec.attributes.dateCreated = currentDateTime();
  rec.attributes.dateUpdated = rec.attributes.dateCreated;
  return [t.addRecord(rec), ...UpdateLastModifedBy(t, rec, user)];
};
export const UpdateLastModifedBy = (
  t: TransformBuilder,
  rec: RecordIdentity,
  user: string
): any => {
  var updDate = t.replaceAttribute(rec, 'dateUpdated', currentDateTime());
  if (related(rec, 'lastModifiedByUser') !== undefined)
    return [
      updDate,
      t.replaceRelatedRecord(rec, 'lastModifiedByUser', {
        type: 'user',
        id: user,
      }),
    ];
  else
    return [
      updDate,
      t.addToRelatedRecords(rec, 'lastModifiedByUser', {
        type: 'user',
        id: user,
      }),
    ];
};
export const UpdateRelatedRecord = (
  t: TransformBuilder,
  rec: BaseModel,
  relationship: string,
  relatedType: string,
  newId: string,
  user: string
): any => {
  rec.attributes.dateUpdated = currentDateTime();
  if (related(rec, relationship) !== undefined)
    return [
      ...UpdateLastModifedBy(t, rec, user),
      t.replaceRelatedRecord(rec, relationship, {
        type: relatedType,
        id: newId,
      }),
    ];
  else
    return [
      ...UpdateLastModifedBy(t, rec, user),
      t.addToRelatedRecords(rec, relationship, {
        type: relatedType,
        id: newId,
      }),
    ];
};
