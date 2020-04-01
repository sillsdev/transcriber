import { KeyMap } from '@orbit/data';
import { remoteId } from '.';
import { NavChoice } from '../routes/drawer';

export interface IDeepLinkProps {
  organization: string;
  project: string;
  plan: string;
  group: string;
  tab: number;
  choice: string;
  content: string;
  keyMap: KeyMap;
  setPlan?: (val: string) => void;
  setTab?: (val: number) => void;
}

export const deepLink = (props: IDeepLinkProps): string | null => {
  const {
    organization,
    project,
    plan,
    group,
    tab,
    choice,
    content,
    keyMap,
  } = props;

  if (!organization || !project || !choice) return null;
  const orgId = remoteId('organization', organization, keyMap);
  const projId = remoteId('project', project, keyMap);
  if (orgId !== undefined && projId !== undefined) {
    if (choice === NavChoice.UsersAndGroups) {
      const groupId = remoteId('group', group, keyMap);
      const groupPart = groupId ? '/' + groupId : '';
      return (
        '/main/' +
        orgId +
        '/' +
        choice +
        '/' +
        projId +
        '/' +
        tab.toString() +
        groupPart
      );
    } else if (choice === NavChoice.Tasks) {
      return (
        '/main/' + orgId + '/' + content + '/' + projId + '/' + tab.toString()
      );
    } else if (choice !== 'plans' || !plan) {
      return '/main/' + orgId + '/' + choice + '/' + projId;
    } else {
      const planId = remoteId('plan', plan, keyMap);
      return (
        '/main/' +
        orgId +
        '/' +
        content +
        '/' +
        projId +
        '/' +
        planId +
        '/' +
        tab.toString()
      );
    }
  }
  return null;
};
export default deepLink;
