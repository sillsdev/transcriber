import {
  RecordOperation,
  UninitializedRecord,
  RecordTransformBuilder,
  RecordRelationship,
  RecordIdentity,
  StandardRecordNormalizer,
  InitializedRecord,
} from '@orbit/records';
import { Dict } from '@orbit/utils';
import Memory from '@orbit/memory';
import { related } from '../crud/related';
import { currentDateTime } from '../utils/currentDateTime';

export interface BaseModel extends UninitializedRecord {
  attributes: {
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    lastModifiedByUser: RecordRelationship;
  };
}

export type BaseModelD = BaseModel & InitializedRecord;

export const UpdateRecord = (
  t: RecordTransformBuilder,
  rec: BaseModel & InitializedRecord,
  user: string
): RecordOperation[] => {
  rec.attributes.dateUpdated = currentDateTime();
  return [
    t.updateRecord(rec).toOperation(),
    ...UpdateLastModifiedBy(t, rec, user),
  ];
};

export const AddRecord = (
  t: RecordTransformBuilder,
  rec: UninitializedRecord,
  user: string,
  memory: Memory
): RecordOperation[] => {
  const rn = new StandardRecordNormalizer({ schema: memory?.schema });
  rec = rn.normalizeRecord(rec);
  if (!rec.attributes) rec.attributes = {} as Dict<unknown>;
  (rec.attributes as Dict<unknown>).dateCreated = currentDateTime();
  return [
    t.addRecord(rec).toOperation(),
    ...UpdateLastModifiedBy(t, rec as InitializedRecord, user),
  ];
};
export const UpdateLastModifiedBy = (
  t: RecordTransformBuilder,
  rec: RecordIdentity,
  user: string
): RecordOperation[] => {
  return [
    t.replaceAttribute(rec, 'dateUpdated', currentDateTime()).toOperation(),
    ...ReplaceRelatedRecord(t, rec, 'lastModifiedByUser', 'user', user),
  ];
};
export const ReplaceRelatedRecord = (
  t: RecordTransformBuilder,
  rec: (BaseModel & InitializedRecord) | RecordIdentity,
  relationship: string,
  relatedType: string,
  newId: string | undefined | null
): RecordOperation[] => {
  if (related(rec, relationship) !== undefined)
    return [
      t
        .replaceRelatedRecord(
          rec,
          relationship,
          newId
            ? {
                type: relatedType,
                id: newId,
              }
            : null
        )
        .toOperation(),
    ];
  else if (newId)
    return [
      t
        .addToRelatedRecords(rec, relationship, {
          type: relatedType,
          id: newId,
        })
        .toOperation(),
    ];
  return [];
};

export const UpdateRelatedRecord = (
  t: RecordTransformBuilder,
  rec: BaseModel & InitializedRecord,
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
