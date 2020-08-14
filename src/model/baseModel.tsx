import {
  Record,
  TransformBuilder,
  UpdateRecordOperation,
  AddRecordOperation,
} from '@orbit/data';
import Memory from '@orbit/memory';
import { currentDateTime } from '../utils/currentDateTime';
import { related } from '../utils';

export interface BaseModel extends Record {
  attributes: {
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {};
}

export const UpdateRecord = (
  t: TransformBuilder,
  rec: BaseModel,
  user: number
): UpdateRecordOperation => {
  rec.attributes.dateUpdated = currentDateTime();
  rec.attributes.lastModifiedBy = user;
  return t.updateRecord(rec);
};

export const AddRecord = (
  t: TransformBuilder,
  rec: BaseModel,
  user: number,
  memory: Memory
): AddRecordOperation => {
  memory.schema.initializeRecord(rec);
  rec.attributes.dateCreated = currentDateTime();
  rec.attributes.dateUpdated = rec.attributes.dateCreated;
  rec.attributes.lastModifiedBy = user;
  return t.addRecord(rec);
};

export const UpdateRelatedRecord = (
  t: TransformBuilder,
  rec: BaseModel,
  relationship: string,
  relatedType: string,
  newId: string,
  user: number
): any => {
  rec.attributes.dateUpdated = currentDateTime();
  rec.attributes.lastModifiedBy = user;
  if (related(rec, relationship) !== undefined)
    return t.replaceRelatedRecord(rec, relationship, {
      type: relatedType,
      id: newId,
    });
  else
    return t.addToRelatedRecords(rec, relationship, {
      type: relatedType,
      id: newId,
    });
};
