const related = (rec: any, key: string) =>
  rec && rec.relationships && key in rec.relationships
    ? rec.relationships[key].data && !Array.isArray(rec.relationships[key].data)
      ? rec.relationships[key].data.id
      : null
    : null;
export default related;
