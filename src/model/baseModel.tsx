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
  return [t.updateRecord(rec), ...UpdateLastModifiedBy(t, rec, user)];
};

export const AddRecord = (
  t: TransformBuilder,
  rec: BaseModel,
  user: string,
  memory: Memory
): any => {
  memory.schema.initializeRecord(rec);
  if (!rec.attributes) rec.attributes = {} as any;
  rec.attributes.dateCreated = currentDateTime();
  return [t.addRecord(rec), ...UpdateLastModifiedBy(t, rec, user)];
};
export const UpdateLastModifiedBy = (
  t: TransformBuilder,
  rec: RecordIdentity,
  user: string
): any => {
  return [
    t.replaceAttribute(rec, 'dateUpdated', currentDateTime()),
    ...ReplaceRelatedRecord(t, rec, 'lastModifiedByUser', 'user', user),
  ];
};
export const ReplaceRelatedRecord = (
  t: TransformBuilder,
  rec: BaseModel | RecordIdentity,
  relationship: string,
  relatedType: string,
  newId: string | undefined | null
): any => {
  if (related(rec, relationship) !== undefined)
    return [
      t.replaceRelatedRecord(
        rec,
        relationship,
        newId
          ? {
              type: relatedType,
              id: newId,
            }
          : null
      ),
    ];
  else if (newId)
    return [
      t.addToRelatedRecords(rec, relationship, {
        type: relatedType,
        id: newId,
      }),
    ];
};

export const UpdateRelatedRecord = (
  t: TransformBuilder,
  rec: BaseModel,
  relationship: string,
  relatedType: string,
  newId: string | undefined,
  user: string
): any => {
  return [
    ...UpdateLastModifiedBy(t, rec, user),
    ...ReplaceRelatedRecord(t, rec, relationship, relatedType, newId),
  ];
};
