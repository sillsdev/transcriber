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
    if (value !== undefined) {
      var tmp = JSON.stringify(value);
      if (tmp !== json[label]) {
        json[label] = tmp;
      }
    } else if ((json[label] ?? '') !== '') {
      delete json[label];
    }
    return JSON.stringify(json);
  };
  const willSetParam = (
    label: string,
    value: any,
    params: string | undefined
  ) => {
    const json = JSON.parse(params ?? '{}');
    if (value !== undefined) {
      var tmp = JSON.stringify(value);
      if (tmp !== json[label]) {
        return true;
      }
    } else if ((json[label] ?? '') !== '') {
      return true;
    }
    return false;
  };
  return { getParam, setParam, willSetParam };
};
