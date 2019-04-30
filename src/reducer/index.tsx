import {combineReducers} from 'redux';
import localizationReducer from './localizationReducer';
import orbitReducer from './orbitReducer';
import userReducer from './userReducer';

export default combineReducers({
    strings: localizationReducer,
    orbit: orbitReducer,
    who: userReducer,
})