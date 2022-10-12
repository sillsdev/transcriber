export const onlyUnique = (
  value: string | number,
  index: number,
  self: Array<number | string>
) => self.indexOf(value) === index;
