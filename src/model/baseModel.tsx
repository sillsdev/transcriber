import {
  Record,
  TransformBuilder,
  UpdateRecordOperation,
  AddRecordOperation,
} from '@orbit/data';
import { schema } from '../schema';
import { currentDateTime } from '../utils/currentDateTime';

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
  user: number
): AddRecordOperation => {
  schema.initializeRecord(rec);
  rec.attributes.dateCreated = currentDateTime();
  rec.attributes.dateUpdated = rec.attributes.dateCreated;
  rec.attributes.lastModifiedBy = user;
  return t.addRecord(rec);
};
