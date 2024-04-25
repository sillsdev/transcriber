import { JSONParse } from './jsonParse';

export const useJsonParams = () => {
  const getParam = (label: string, params: string | undefined) => {
    const json = JSONParse(params);
    if (json[label] !== undefined) {
      if (typeof json[label] === 'string' && json[label] !== '') {
        var tmp = JSONParse(json[label]);
        //because of a bug in setParam that went out with the beta...handle this
        if (typeof tmp === 'string' && json[label] !== '') {
          return JSONParse(tmp);
        } else return tmp;
      } else return json[label];
    }
    return undefined;
  };

  const setParam = (label: string, value: any, params: string | undefined) => {
    const json = JSONParse(params);

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
    if (value !== undefined) {
      var tmp = JSON.stringify(value);
      const curVal = JSON.stringify(getParam(label, params));
      if (tmp !== curVal) {
        return true;
      }
    } else {
      const json = JSONParse(params);
      if ((json[label] ?? '') !== '') {
        return true;
      }
    }
    return false;
  };
  return { getParam, setParam, willSetParam };
};
