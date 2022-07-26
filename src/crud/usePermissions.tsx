import { useSelector, shallowEqual } from 'react-redux';
import { useGlobal } from 'reactn';
import { useGroups } from '.';
import { IPermissionStrings, WorkflowStep } from '../model';
import { permissionsSelector } from '../selector';

export enum PermissionName {
  Admin = 'admin',
  //MTTranscriber = 'mtTranscriber',
  //LWCTranscriber = 'lwcTranscriber',
  //Editor = 'transcriptionEditor',
  Consultant = 'consultant',
  Mentor = 'mentor',
  CIT = 'consultantInTraining',
  Observer = 'observer',
}

export const usePermissions = () => {
  const [, setPermissions] = useGlobal('permissions');
  const t = useSelector(
    permissionsSelector,
    shallowEqual
  ) as IPermissionStrings;
  const { getMyGroups } = useGroups();

  const localizePermission = (p: PermissionName | string) => {
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
  const canPerformStep = (step: WorkflowStep) => true;
  function onlyUnique(value: any, index: number, self: any[]) {
    return self.indexOf(value) === index;
  }
  const getMyPermissions = (orgId: string) => {
    var perms: string[] = [];

    const groups = getMyGroups(orgId);

    groups.forEach((g) => {
      if (g.attributes?.permissions) perms.push(g.attributes?.permissions);
    });
    return perms.filter(onlyUnique);
  };

  const setMyPermissions = (orgId: string) => {
    setPermissions(getMyPermissions(orgId));
  };
  return {
    setMyPermissions,
    canPerformStep,
    allPermissions,
    localizePermission,
    localizedPermissions,
    permissionTip,
  };
};
