import { ISharedStrings } from '../model';

export const localizeRole = (
  role: string,
  ts: ISharedStrings,
  proj?: boolean
) => {
  const lcRole = role.toLowerCase();
  const myRole = proj && lcRole === 'admin' ? 'owner' : lcRole;
  try {
    return ts.getString(myRole);
  } catch {
    return role;
  }
};
