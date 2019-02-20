import {combineReducers} from 'redux';
import userReducer from './userReducer';
import schemeReducer from './schemeReducer';

export default combineReducers({
    scheme: schemeReducer,
    user: userReducer,
})