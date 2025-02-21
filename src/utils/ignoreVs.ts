export const ignoreVs = (s: string | undefined | null) =>
  s?.replace(/\\v\s*([0-9]+)(-[0-9]+)?\s*/g, '');
