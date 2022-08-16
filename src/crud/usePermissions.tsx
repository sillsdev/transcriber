import { useEffect, useState } from 'react';
import { useSelector, shallowEqual } from 'react-redux';
import { useGlobal } from 'reactn';
import { usePeerGroups } from '../components/Peers/usePeerGroups';
import { Group, GroupMembership, IPermissionStrings, User } from '../model';
import { permissionsSelector } from '../selector';
import remoteId, { remoteIdGuid } from './remoteId';

export enum PermissionName {
  //Admin = 'admin',
  //MTTranscriber = 'mtTranscriber',
  //LWCTranscriber = 'lwcTranscriber',
  //Editor = 'transcriptionEditor',
  //Consultant = 'consultant',
  Mentor = 'mentor',
  CIT = 'consultantInTraining',
}
interface IProps {
  users: User[];
  groups: Group[];
  memberships: GroupMembership[];
}

export const usePermissions = ({ users, groups, memberships }: IProps) => {
  const [user] = useGlobal('user');
  const [memory] = useGlobal('memory');
  const [permissions, setPermissions] = useState('');
  const t = useSelector(
    permissionsSelector,
    shallowEqual
  ) as IPermissionStrings;
  const { myGroups } = usePeerGroups({ users, groups, memberships });

  useEffect(() => {
    var perms: string[] = [];

    myGroups.forEach((g) => {
      if (g.attributes?.permissions) {
        var p = JSON.parse(g.attributes.permissions);
        perms.push(p.permissions.split());
      }
    });
    setPermissions(perms.filter(onlyUnique).join());
  }, [myGroups]);

  const getPermissionFromJson = (jsonstr: string) => {
    if (jsonstr.trimLeft().charAt(0) === '{') {
      var json = JSON.parse(jsonstr);
      return json.permissions || '';
    }
    return jsonstr;
  };
  const localizePermission = (p: PermissionName | string) => {
    if (typeof p === 'string') {
      p = getPermissionFromJson(p);
    }
    return t.hasOwnProperty(p)
      ? t.getString(p)
      : Object.keys(PermissionName)
          .filter((pk) => (PermissionName as any)[pk] === p)
          .pop() ?? p;
  };
  const permissionTip = (p: PermissionName | string) => {
    return t.hasOwnProperty(p + 'Tip') ? t.getString(p + 'Tip') : '';
  };
  const allPermissions = () => Object.values(PermissionName);

  const localizedPermissions = () => {
    return allPermissions().map((p) => localizePermission(p));
  };

  //given a string of json {mentor:true, consultantInTraining:true}
  const canAccess = (perms: string) => {
    if (!perms) return true;
    var json = JSON.parse(perms);
    //nothing here so everyone can see it
    if (Object.keys(json).length === 0) return true;
    //just author left so everyone can see it
    if (Object.keys(json).length === 1 && json.hasOwnProperty('author'))
      return true;

    var canI = false;
    permissions.split(',').forEach((p) => {
      if (json.hasOwnProperty(p)) canI = canI || json[p];
    });
    return canI;
  };

  const addAccess = (json: any, perm: PermissionName) => {
    json[perm] = true;
    return { ...json };
  };
  const addNeedsApproval = (json: any) => {
    return {
      ...json,
      needsApproval: true,
      author: remoteId('user', user, memory.keyMap) ?? user,
    };
  };

  const needsApproval = (perms: string) => {
    if (!perms) return false;
    var json = JSON.parse(perms);
    if (Object.keys(json).length === 0) return false;
    return json.hasOwnProperty('needsApproval');
  };
  const approve = (perms?: string) => {
    //save the author...get rid of the rest
    if (!perms) return {};
    var json = JSON.parse(perms);
    if (json.hasOwnProperty('author')) return { author: json['author'] };
    //eh...this is bad but shouldn't ever be here!
    return {};
  };
  const getAuthor = (perms: string) => {
    if (!perms) return undefined;
    var json = JSON.parse(perms);
    if (Object.keys(json).length === 0) return undefined;
    return (
      remoteIdGuid('user', json['author'], memory.keyMap) ?? json['author']
    );
  };
  //given one permission "mentor"
  const hasPermission = (perm: PermissionName) => permissions.includes(perm);

  function onlyUnique(value: any, index: number, self: any[]) {
    return self.indexOf(value) === index;
  }

  return {
    permissions,
    addAccess,
    canAccess,
    addNeedsApproval,
    needsApproval,
    approve,
    hasPermission,
    allPermissions,
    localizePermission,
    localizedPermissions,
    permissionTip,
    getAuthor,
    getPermissionFromJson,
  };
};
