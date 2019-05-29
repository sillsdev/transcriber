import {combineReducers} from 'redux';
import localizationReducer from './localizationReducer';
import orbitReducer from './orbitReducer';
import uploadReducer from './uploadReducer';

export default combineReducers({
    strings: localizationReducer,
    orbit: orbitReducer,
    upload: uploadReducer,
})