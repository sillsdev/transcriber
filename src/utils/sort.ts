import moment from 'moment';

export function numCompare(a: number, b: number) {
  return a - b;
}
export function dateCompare(a: string, b: string) {
  const aDate = moment(a).isValid() ? moment(a) : moment(a, 'LT');
  const bDate = moment(b).isValid() ? moment(b) : moment(b, 'LT');
  const aIso = aDate.toISOString();
  const bIso = bDate.toISOString();
  return aIso > bIso ? 1 : aIso < bIso ? -1 : 0;
}
