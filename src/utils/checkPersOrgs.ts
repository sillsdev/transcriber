import { Organization } from '../model';
import { LocalKey, localUserKey } from './localUserKey';

export function checkPersOrgs(orgRecs: Organization[]) {
  const persOrgCnt = localStorage.getItem(localUserKey(LocalKey.personalOrgs));
  if (orgRecs.length !== parseInt(persOrgCnt || '0')) {
    console.error(
      `Update TT-4956 because your personal orgs changed from ${persOrgCnt} to ${orgRecs.length}`
    );
    localStorage.setItem(
      localUserKey(LocalKey.personalOrgs),
      orgRecs.length.toString()
    );
  }
}
