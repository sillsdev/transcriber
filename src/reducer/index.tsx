import {combineReducers} from 'redux';
import userReducer from './userReducer';
import schemeReducer from './schemeReducer';
import taskReducer from './taskReducer';

export default combineReducers({
    scheme: schemeReducer,
    task: taskReducer,
    user: userReducer,
})