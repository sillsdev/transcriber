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

export const canBeEditor = [
  RoleNames.Editor,
  RoleNames.PeerReviewer,
  RoleNames.Admin,
];
export const canTranscribe = [
  ...canBeEditor,
  RoleNames.Transcriber,
  RoleNames.BackTranslator,
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
