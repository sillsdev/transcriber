export function eqSet(as: Set<string | number>, bs: Set<string | number>) {
  if (as.size !== bs.size) return false;
  for (let a of Array.from(as)) if (!bs.has(a)) return false;
  return true;
}
