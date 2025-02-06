import { Paratext } from '../assets/brands';

export const addPt = (s: string, ms?: string) =>
  s.replace(ms ?? '{0}', Paratext);
