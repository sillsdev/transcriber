import { combineReducers } from 'redux';
import localizationReducer from './localizationReducer';
import orbitReducer from './orbitReducer';
import uploadReducer from './uploadReducer';
import bookReducer from './bookReducer';

export default combineReducers({
  strings: localizationReducer,
  books: bookReducer,
  orbit: orbitReducer,
  upload: uploadReducer
});
