import { Record, RecordRelationship } from '@orbit/data';

export enum RoleNames {
  Transcriber = 'Transcriber',
  Reviewer = 'Reviewer',
  Admin = 'Admin',
  Member = 'Member',
  SuperAdmin = 'SuperAdmin',
}

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

export const getRoleId = function(roles: Role[], role: RoleNames): string {
  var findit = roles.filter(
    r => r.attributes && r.attributes.roleName === role
  );
  if (findit.length > 0) return findit[0].id;
  return '';
};

export const IsAdmin = function(roles: Role[], id: string): boolean {
  var findit = roles.filter(r => r.id === id);
  if (findit.length > 0)
    return (
      findit[0].attributes.roleName === RoleNames.Admin ||
      findit[0].attributes.roleName === RoleNames.SuperAdmin
    );
  return false;
};
