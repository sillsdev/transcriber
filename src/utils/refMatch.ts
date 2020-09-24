export const refMatch = (ref: string) =>
  /^([0-9]+)[^0-9]+([0-9]+)[^0-9]*([0-9]*)$/g.exec(ref);
