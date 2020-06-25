import Axios from 'axios';
import { FETCH_BOOKS } from './types';
import { appPath } from '../../utils/appPath';

export const fetchBooks = (lang: string) => (dispatch: any) => {
  if (process.env.NODE_ENV === 'test') return;
  const bookFileName = 'book-' + lang + '.json';
  Axios.get(appPath() + '/localization/' + bookFileName).then((strings) => {
    dispatch({
      payload: strings,
      type: FETCH_BOOKS,
    });
  });
};
