export const useJsonParams = () => {
  const getParam = (label: string, params: string | undefined) => {
    const json = JSON.parse(params ?? '{}');
    if (json[label])
      if (typeof json[label] === 'string') return JSON.parse(json[label]);
      else return json[label];
    return undefined;
  };

  const setParam = (label: string, value: any, params: string | undefined) => {
    const json = JSON.parse(params ?? '{}');
    json[label] = JSON.stringify(value);
    return JSON.stringify(json);
  };
  return { getParam, setParam };
};
