export const useJsonParams = () => {
  const safeParse = (json: string) => {
    try {
      return JSON.parse(json);
    } catch (e) {
      return json;
    }
  };
  const getParam = (label: string, params: string | undefined) => {
    const json = JSON.parse(params ?? '{}');
    if (json[label] !== undefined) {
      if (typeof json[label] === 'string') {
        var tmp = safeParse(json[label]);
        //because of a bug in setParam that went out with the beta...handle this
        if (typeof tmp === 'string') {
          return safeParse(tmp);
        } else return tmp;
      } else return json[label];
    }
    return undefined;
  };

  const setParam = (label: string, value: any, params: string | undefined) => {
    const json = JSON.parse(params ?? '{}');
    if (value !== undefined) {
      var tmp = JSON.stringify(value);
      if (tmp !== json[label]) {
        json[label] = value;
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
