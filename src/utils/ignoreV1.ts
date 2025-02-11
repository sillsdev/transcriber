export const ignoreV1 = (s: string | undefined | null) =>
  s?.replace(/^\\v ([0-9]+)(-[0-9]+)?\s/, '');
