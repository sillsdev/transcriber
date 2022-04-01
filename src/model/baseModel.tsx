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
  newId: string | undefined,
  user: string
): any => {
  rec.attributes.dateUpdated = currentDateTime();
  if (related(rec, relationship) !== undefined)
    return [
      ...UpdateLastModifiedBy(t, rec, user),
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
      ...UpdateLastModifiedBy(t, rec, user),
      t.addToRelatedRecords(rec, relationship, {
        type: relatedType,
        id: newId,
      }),
    ];
};
