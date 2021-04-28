import { IGroupSettingsStrings } from '../model';
import { camel2Title } from './camel2Title';

export const localizeRoleDetail = (
  role: string,
  gs: IGroupSettingsStrings,
  proj?: boolean
) => {
  const lcRole = role.toLowerCase();
  const myRole = proj && lcRole === 'admin' ? 'owner' : lcRole;
  try {
    return gs.getString(`${myRole}sDetail`);
  } catch {
    return `${camel2Title(myRole)} Detail`;
  }
};
