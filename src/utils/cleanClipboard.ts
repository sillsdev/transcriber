const removeBlanks = (clipBoard: string) => {
  const blankLines = /\r?\n\t*\r?\n/;
  const chunks = clipBoard.split(blankLines);
  return chunks
    .join('\n')
    .replace(/\r?\n$/, '')
    .split('\n');
};
const splitAndTrim = (clipBoard: string): string[] =>
  clipBoard.split('\t').map((v) => (typeof v === 'string' ? v.trim() : v));

export const cleanClipboard = (clipText: string) => {
  return removeBlanks(clipText).map((line: string) => splitAndTrim(line));
};
