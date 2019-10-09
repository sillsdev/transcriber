import { applyMiddleware, combineReducers, createStore } from 'redux';
import bookReducer from './book/reducers';
import localizationReducer from './localization/reducers';
import orbitReducer from './orbit/reducers';
import uploadReducer from './upload/reducers';
import contextReducer from './context/reducer';
import langTagsReducer from './langPicker/reducers';
import mediaReducer from './media/reducers';
import paratextReducer from './paratext/reducers';

import { composeWithDevTools } from 'redux-devtools-extension';
// import { systemReducer } from "./system/reducers";
import thunkMiddleware from 'redux-thunk';

const appReducer = combineReducers({
  context: contextReducer,
  strings: localizationReducer,
  books: bookReducer,
  orbit: orbitReducer,
  upload: uploadReducer,
  langTag: langTagsReducer,
  media: mediaReducer,
  paratext: paratextReducer,
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
export * from './langPicker/actions';
export * from './media/actions';
export * from './paratext/actions';
