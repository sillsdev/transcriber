import { ISharedStrings } from '../model';

export const localizeRole = (role: string, ts: ISharedStrings) => {
  const lcRole = role.toLowerCase();
  return ts.hasOwnProperty(lcRole) ? ts.getString(lcRole) : lcRole;
};
