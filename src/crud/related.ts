import { RecordIdentity, UninitializedRecord } from '@orbit/records';

export const related = (
  rec: UninitializedRecord,
  key: string
): string | RecordIdentity[] | null => {
  const value = rec?.relationships?.[key]?.data;
  return !Array.isArray(value) ? (value as RecordIdentity)?.id ?? null : value;
};
export default related;
