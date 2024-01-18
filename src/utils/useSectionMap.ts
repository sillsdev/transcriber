import useLocalStorageState from './useLocalStorageState';

export const useSectionMap = () => {
  function serialize(sectionMap: Map<number, string>) {
    return JSON.stringify([Array.from(sectionMap.entries())]);
  }
  function deserialize(serializedMap: string) {
    const [entries] = JSON.parse(serializedMap);
    return new Map(entries);
  }
  const [sectionMap, setSectionMap] = useLocalStorageState(
    'sectionMap',
    new Map<number, string>(),
    { deserialize, serialize }
  );
  return [sectionMap, setSectionMap];
};
export default useSectionMap;
