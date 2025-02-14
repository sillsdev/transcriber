export const ignoreVs = (s: string | undefined | null) =>
  s?.replace(/^\\v ([0-9]+)(-[0-9]+)?\s/g, '');
