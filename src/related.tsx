const related = (rec:any, key: string) => 
    rec &&
    rec.relationships &&
    rec.relationships[key] &&
    rec.relationships[key].data &&
    !Array.isArray(rec.relationships[key].data)?
      rec.relationships[key].data.id: null;
export default related
