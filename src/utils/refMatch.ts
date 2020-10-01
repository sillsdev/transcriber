export const refMatch = (ref: string) =>
  /^([0-9]+)[^0-9]+([0-9]+[a-c]?)[^0-9]*([0-9]*[a-c]?)$/g.exec(ref);
