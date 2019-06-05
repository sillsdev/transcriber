import Axios from 'axios';
import { FETCH_LOCALIZATION, SET_LANGUAGE, FETCH_BOOKS } from './types';


export const fetchLocalization = () => (dispatch: any) => {
    Axios.get('/localization/strings.json')
        .then(strings => {
            dispatch({
                payload: strings,
                type: FETCH_LOCALIZATION
            });
        })
}

export const setLanguage = (lang: string) => {
    return {
        payload: lang,
        type: SET_LANGUAGE,
    }
}

export const fetchBooks = (lang: string) => (dispatch: any) => {
    const bookFileName = 'book-' + lang + '.json';
    Axios.get('/localization/' + bookFileName)
        .then(strings => {
            dispatch({
                payload: strings,
                type: FETCH_BOOKS
            });
        })
}
