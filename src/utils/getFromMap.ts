export const getFromArrMap = (key: any, arrMap: [any, string][]) => {
    const map = new Map(arrMap);
    return map.get(key);
}