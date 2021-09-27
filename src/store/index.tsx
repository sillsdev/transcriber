import { applyMiddleware, combineReducers, createStore } from 'redux';
import bookReducer from './book/reducers';
import localizationReducer from './localization/reducers';
import orbitReducer from './orbit/reducers';
import uploadReducer from './upload/reducers';
import paratextReducer from './paratext/reducers';
import exportReducer from './importexport/reducers';
import authReducer from './auth/reducers';

import { composeWithDevTools } from 'redux-devtools-extension';
// import { systemReducer } from "./system/reducers";
import thunkMiddleware from 'redux-thunk';

const appReducer = combineReducers({
  strings: localizationReducer,
  books: bookReducer,
  orbit: orbitReducer,
  upload: uploadReducer,
  paratext: paratextReducer,
  importexport: exportReducer,
  auth: authReducer,
});

export type AppState = ReturnType<typeof appReducer>;

export default function configureStore() {
  const middlewares = [thunkMiddleware];
  const middleWareEnhancer = applyMiddleware(...middlewares);

  const store = createStore(
    appReducer,
    composeWithDevTools(middleWareEnhancer)
  );
  return store;
}
export * from './book/actions';
export * from './localization/actions';
export * from './orbit/actions';
export * from './upload/actions';
export * from './paratext/actions';
export * from './importexport/actions';
export * from './auth/actions';
