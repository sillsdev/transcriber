import { Record, RecordRelationship } from '@orbit/data';

export enum RoleNames {
  Transcriber = 'Transcriber',
  Editor = 'Editor',
  Admin = 'Admin',
  Member = 'Member',
  SuperAdmin = 'SuperAdmin',
  PeerReviewer = 'PeerReviewer',
  BackTranslator = 'BackTranslator',
  Observer = 'Observer',
  Consultant = 'Consultant',
  Translator = 'Translator',
}
export const canTranscribe = [
  RoleNames.Transcriber,
  RoleNames.BackTranslator,
  RoleNames.Editor,
  RoleNames.Admin,
];
export const canBeEditor = [
  RoleNames.Editor,
  RoleNames.PeerReviewer,
  RoleNames.Admin,
];

export interface Role extends Record {
  attributes: {
    orgRole: boolean;
    groupRole: boolean;
    roleName: string;
  };
  relationships?: {
    organization: RecordRelationship;
    users: RecordRelationship;
  };
}
export default Role;
