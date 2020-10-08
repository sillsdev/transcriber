//https://stackoverflow.com/questions/6323417/regex-to-extract-all-matches-from-string-using-regexp-exec
export const camel2Title = (val: string) => {
  let parts: string[] = [];
  const re = /([A-Z][a-z]*)/g;
  let m: RegExpExecArray | null = null;
  do {
    m = re.exec(val);
    if (m) {
      if (parts.length === 0) {
        parts = [val[0].toUpperCase() + val.slice(1, m.index)];
      }
      parts.push(m[1]);
    }
  } while (m);
  if (parts.length > 0) return parts.join(' ');
  return val.length > 1 ? val[0].toUpperCase() + val.slice(1) : val;
};
