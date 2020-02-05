import Axios from 'axios';
import { FETCH_LOCALIZATION, SET_LANGUAGE } from './types';
import { appPath } from '../../utils';

export const fetchLocalization = () => (dispatch: any) => {
  Axios.get(appPath() + '/localization/strings.json').then(strings => {
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
