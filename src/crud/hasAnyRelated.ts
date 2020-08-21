export const hasAnyRelated = (rec: any, key: string) =>
  rec &&
  rec.relationships &&
  key in rec.relationships &&
  rec.relationships[key].data
    ? !Array.isArray(rec.relationships[key].data)
      ? true
      : rec.relationships[key].data.length !== 0
    : false;
