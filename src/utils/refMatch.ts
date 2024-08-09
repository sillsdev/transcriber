export const refMatch = (ref: string) => {
  const m =
    /^([0-9]+)[:.]([0-9]+[a-c]?)-?([0-9]*[a-c]?)[:.]?([0-9]*[a-c]?)$/g.exec(
      ref
    );
  if (!m) return m;
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, chapter, verseStart, arg3, verseEnd] = m;
  if (verseEnd) {
    if (parseInt(arg3) !== parseInt(chapter) + 1) return null;
    return m;
  } else if (arg3) {
    const vBeg = parseInt(verseStart);
    const vEnd = parseInt(arg3);
    if (Number.isNaN(vBeg) || Number.isNaN(vEnd)) return null;
    if (vEnd < vBeg) return null;
    else if (vBeg === vEnd && arg3 <= verseStart) return null;
    return m;
  }
  return m;
};
