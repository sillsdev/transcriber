import {combineReducers} from 'redux';
import localizationReducer from './localizationReducer';

export default combineReducers({
    strings: localizationReducer,
})