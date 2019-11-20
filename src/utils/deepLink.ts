import { KeyMap } from '@orbit/data';
import { remoteId, slug } from '.';

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
  t: {
    usersAndGroups: string;
    myTasks: string;
    plans: string;
    media: string;
  };
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
    setPlan,
    setTab,
    t,
  } = props;

  if (!organization || !project || !choice) return null;
  const orgId = remoteId('organization', organization, keyMap);
  const projId = remoteId('project', project, keyMap);
  if (orgId !== undefined && projId !== undefined) {
    if (choice === slug(t.usersAndGroups)) {
      const groupId = remoteId('group', group, keyMap);
      const groupPart = groupId ? '/' + groupId : '';
      if (setPlan) setPlan('');
      return (
        '/main/' +
        orgId +
        '/' +
        slug(choice) +
        '/' +
        projId +
        '/' +
        tab.toString() +
        groupPart
      );
    } else if (choice === slug(t.myTasks)) {
      return (
        '/main/' +
        orgId +
        '/' +
        slug(content) +
        '/' +
        projId +
        '/' +
        tab.toString()
      );
    } else if (choice !== slug(t.plans) || !plan) {
      if (choice !== slug(t.media)) {
        if (setPlan) setPlan('');
      }
      if (setTab) setTab(0);
      return '/main/' + orgId + '/' + slug(choice) + '/' + projId;
    } else {
      const planId = remoteId('plan', plan, keyMap);
      return (
        '/main/' +
        orgId +
        '/' +
        slug(content) +
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
