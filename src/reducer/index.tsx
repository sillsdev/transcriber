import {combineReducers} from 'redux';
import localizationReducer from './localizationReducer';
import orbitReducer from './orbitReducer';

export default combineReducers({
    strings: localizationReducer,
    orbit: orbitReducer,
})