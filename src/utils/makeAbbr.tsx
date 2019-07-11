export const makeAbbr = (name: string) =>
  name
    .trim()
    .split(' ')
    .map((s: string) => s.slice(0, 1).toLocaleUpperCase())
    .join('');
export default makeAbbr;
