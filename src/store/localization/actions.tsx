import Axios from 'axios';
import { FETCH_LOCALIZATION, SET_LANGUAGE } from './types';
import { appPath } from '../../utils';
import exportStrings from './exported-strings-name.json';
const { stringsName } = exportStrings;

export const fetchLocalization = () => (dispatch: any) => {
  Axios.get(appPath() + '/localization/' + stringsName).then((strings) => {
    dispatch({
      payload: strings,
      type: FETCH_LOCALIZATION,
    });
  });
};

export const setLanguage = (lang: string) => {
  return {
    payload: lang,
    type: SET_LANGUAGE,
  };
};
