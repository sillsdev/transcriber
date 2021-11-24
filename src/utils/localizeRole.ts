import { ISharedStrings } from '../model';

export const localizeRole = (
  role: string,
  ts: ISharedStrings,
  proj?: boolean
) => {
  const lcRole = role.toLowerCase();
  const myRole = proj && lcRole === 'admin' ? 'owner' : lcRole;
  return ts.hasOwnProperty(myRole) ? ts.getString(myRole) : myRole;
};
