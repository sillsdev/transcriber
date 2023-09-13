export const whole = (n: number | undefined) =>
  n && Math.floor(n) === n && n > 0 ? `${n}` : '';
