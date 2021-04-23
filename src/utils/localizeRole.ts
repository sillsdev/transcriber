import { ISharedStrings } from '../model';

export const localizeRole = (role: string, ts: ISharedStrings) => {
  try {
    return ts.getString(role.toLowerCase());
  } catch {
    return role;
  }
};
