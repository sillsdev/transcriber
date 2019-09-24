import { CONTEXT_LOADED, ContextMsgs, IContextState } from './types';

export const contextCleanState = {
  loaded: false,
};

export default function(
  state = contextCleanState,
  action: ContextMsgs
): IContextState {
  switch (action.type) {
    case CONTEXT_LOADED:
      return {
        loaded: true,
      };
    default:
      return { ...state };
  }
}
