import Axios from 'axios';
import { FETCH_BOOKS } from './types';

export const fetchBooks = (lang: string) => (dispatch: any) => {
  const bookFileName = 'book-' + lang + '.json';
  Axios.get('./localization/' + bookFileName).then(strings => {
    dispatch({
      payload: strings,
      type: FETCH_BOOKS,
    });
  });
};
