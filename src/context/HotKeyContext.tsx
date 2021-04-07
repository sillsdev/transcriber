import React, { useState } from 'react';
import { useMounted } from '../utils';
// see: https://upmostly.com/tutorials/how-to-use-the-usecontext-hook-in-react
const initState = {
  subscribe: (key: string, cb: () => boolean) => {},
  unsubscribe: (key: string) => {},
};

export type ICtxState = typeof initState & {};

interface IContext {
  state: ICtxState;
  setState: React.Dispatch<React.SetStateAction<ICtxState>>;
}

const HotKeyContext = React.createContext({} as IContext);

interface IProps {
  children: any;
}

const HotKeyProvider = (props: IProps) => {
  const [hotKeys, setHotKeys] = useState<string[]>([]);
  const [callbacks, setCallbacks] = useState<(() => boolean)[]>([]);
  const [state, setState] = useState({
    ...initState,
  });
  const isMounted = useMounted('hotkeycontext');

  const handleKey = (e: React.KeyboardEvent) => {
    console.log('got it', e.key);
    var ix = hotKeys.findIndex((hk) => hk === e.key.toUpperCase());
    var handled = false;
    if (ix !== -1) handled = callbacks[ix]();
    if (handled) e.preventDefault();
  };

  const subscribe = (key: string, cb: () => boolean) => {
    var ix = hotKeys.findIndex((hk) => hk === key.toUpperCase());
    if (ix !== -1) {
      callbacks[ix] = cb;
    } else {
      hotKeys.push(key.toUpperCase());
      callbacks.push(cb);
    }
  };
  const unsubscribe = (key: string) => {
    var ix = hotKeys.findIndex((hk) => hk === key.toUpperCase());
    if (ix !== -1 && isMounted()) {
      setHotKeys(hotKeys.splice(ix, 1));
      setCallbacks(callbacks.splice(ix, 1));
    }
  };

  return (
    <HotKeyContext.Provider
      value={{
        state: {
          ...state,
          subscribe,
          unsubscribe,
        },
        setState,
      }}
    >
      <div onKeyDown={handleKey}>{props.children}</div>
    </HotKeyContext.Provider>
  );
};

export { HotKeyContext, HotKeyProvider };
