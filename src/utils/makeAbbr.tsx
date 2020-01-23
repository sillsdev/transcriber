export const makeAbbr = (name: string) => {
  if (!name || name.length === 0) return '';
  const trimed = name.trim().replace(/\s\s+/, ' ');
  if (trimed.length <= 3) return trimed.toLocaleUpperCase();
  const words = trimed.indexOf(' ') > 0 ? 1 : 2;
  return trimed
    .split(' ')
    .map((s: string) => s.slice(0, words).toLocaleUpperCase())
    .join('');
};
export default makeAbbr;
