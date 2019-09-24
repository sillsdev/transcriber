// Describing the shape of the context's slice of state

export interface IContextState {
  loaded: boolean;
}

// Describing the different ACTION NAMES available
export const CONTEXT_LOADED = 'CONTEXT_LOADED';

interface ContextMsg {
  type: typeof CONTEXT_LOADED;
}

export type ContextMsgs = ContextMsg;
