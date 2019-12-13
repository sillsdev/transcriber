import { Record, RecordRelationship } from '@orbit/data';
export enum DigestPreference {
  noDigest = 0,
  dailyDigest = 1,
}
export interface User extends Record {
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
    dateCreated: string | null;
    dateUpdated: string | null;
    lastModifiedBy: string | null;
  };
  relationships?: {
    organizationMemberships: RecordRelationship;
    groupMemberships: RecordRelationship;
  };
}

export interface CurrentUser extends Record {
  attributes: {
    name: string;
    givenName: string;
    familyName: string;
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
    dateCreated: string | null;
    dateUpdated: string | null;
    lastModifiedBy: string | null;
  };
  relationships?: {
    organizationMemberships: RecordRelationship;
    groupMemberships: RecordRelationship;
  };
}

export default User;
