import { applyMiddleware, combineReducers, createStore } from 'redux';
import bookReducer from './book/reducers';
import localizationReducer from './localization/reducers';
import orbitReducer from './orbit/reducers';
import uploadReducer from './upload/reducers';
import contextReducer from './context/reducer';
import mediaReducer from './media/reducers';
import paratextReducer from './paratext/reducers';
import authReducer from './auth/reducers';

import { composeWithDevTools } from 'redux-devtools-extension';
// import { systemReducer } from "./system/reducers";
import thunkMiddleware from 'redux-thunk';

const appReducer = combineReducers({
  context: contextReducer,
  strings: localizationReducer,
  books: bookReducer,
  orbit: orbitReducer,
  upload: uploadReducer,
  media: mediaReducer,
  paratext: paratextReducer,
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
export * from './context/actions';
export * from './book/actions';
export * from './localization/actions';
export * from './orbit/actions';
export * from './upload/actions';
export * from './media/actions';
export * from './paratext/actions';
export * from './auth/actions';
