const numSort = (i: number, j: number) => i - j;

export function rangeAdd(
  current: string | undefined,
  start: string,
  end: string | undefined
) {
  const verses = new Set<number>(
    current ? current?.split(',').map((v) => parseInt(v)) : undefined
  );
  if (end) {
    const endInt = parseInt(end);
    for (let verse = parseInt(start); verse <= endInt; verse++) {
      verses.add(verse);
    }
  } else {
    verses.add(parseInt(start));
  }
  return Array.from(verses).sort(numSort).join(',');
}
