import { Record } from '@orbit/data';
const hasRelated = (rec: any, key: string, value: string) => 
    rec &&
    rec.relationships &&
    key in rec.relationships? (
    rec.relationships[key].data &&
    !Array.isArray(rec.relationships[key].data)?
      rec.relationships[key].data.id === value:
      rec.relationships[key].data.filter((i: Record) => i.id === value)) : false;
export default hasRelated
