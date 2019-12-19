export const related = (rec: any, key: string) =>
  rec && rec.relationships && key in rec.relationships
    ? rec.relationships[key].data && !Array.isArray(rec.relationships[key].data)
      ? rec.relationships[key].data.id
      : rec.relationships[key].data == undefined
      ? null
      : rec.relationships[key].data
    : null;
export default related;
