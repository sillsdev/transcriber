export function startEnd(subject: string | undefined) {
  const startEnd = (val: string) =>
    /^([0-9]+\.[0-9])-([0-9]+\.[0-9]) /.exec(val);

  const m = startEnd(subject || '');
  if (m) {
    return { start: parseFloat(m[1]), end: parseFloat(m[2]) };
  }
  return undefined;
}
