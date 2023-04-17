import { RecordRelationship } from '@orbit/data';
import { BaseModel } from './baseModel';
export enum DigestPreference {
  noDigest = 0,
  dailyDigest = 1,
}
export interface User extends BaseModel {
  attributes: {
    name: string;
    givenName: string | null;
    familyName: string | null;
    email: string;
    phone: string | null;
    timezone: string | null;
    locale: string | null;
    isLocked: boolean;
    auth0Id: string;
    silUserid: number;
    identityToken: string | null;
    uilanguagebcp47: string | null;
    timercountUp: string | null;
    playbackSpeed: string | null;
    progressbarTypeid: string | null;
    avatarUrl: string | null;
    hotKeys: string | null;
    digestPreference: DigestPreference | null;
    newsPreference: boolean | null;
    sharedContentAdmin: boolean | null;
    sharedContentCreator: boolean | null;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    organizationMemberships: RecordRelationship;
    groupMemberships: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export interface CurrentUser extends User {
  attributes: {
    name: string;
    givenName: string | null;
    familyName: string | null;
    email: string;
    phone: string | null;
    timezone: string | null;
    locale: string | null;
    isLocked: boolean;
    auth0Id: string;
    silUserid: number;
    identityToken: string | null;
    uilanguagebcp47: string | null;
    timercountUp: string | null;
    playbackSpeed: string | null;
    progressbarTypeid: string | null;
    avatarUrl: string | null;
    hotKeys: string | null;
    digestPreference: DigestPreference | null;
    newsPreference: boolean | null;
    sharedContentAdmin: boolean | null;
    sharedContentCreator: boolean | null;
    dateCreated: string;
    dateUpdated: string;
    lastModifiedBy: number;
  };
  relationships?: {
    organizationMemberships: RecordRelationship;
    groupMemberships: RecordRelationship;
    lastModifiedByUser: RecordRelationship;
  };
}

export default User;
