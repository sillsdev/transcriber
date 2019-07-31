import { CONTEXT_LOADED } from './types';

export const loadedContext = () => {
  return {
    type: CONTEXT_LOADED,
  };
};
