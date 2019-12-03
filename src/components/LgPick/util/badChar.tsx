const badChar = " (),.:/!?_'`0123456789";
export const hasBadChar = (s: string) => {
  for (let i = 0; i < s.length; i += 1) {
    if (badChar.indexOf(s[i]) !== -1) return true;
  }
  return false;
};
export const woBadChar = (s: string | undefined) => {
  if (!s) return '';
  let result = '';
  for (let i = 0; i < s.length; i += 1) {
    if (badChar.indexOf(s[i]) === -1) result += s[i];
  }
  return result;
};
