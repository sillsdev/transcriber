export const positiveWholeOnly = (n: number | undefined) =>
  n && Math.floor(n) === n && n > 0 ? `${n}` : '';
