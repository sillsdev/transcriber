import React, { PropsWithChildren, useEffect, useRef, useState } from 'react';
import { IHotKeyStrings } from '../model';
import { useMounted } from '../utils/useMounted';
import { useSelector } from 'react-redux';
import { hotKeySelector } from '../selector';
// see: https://upmostly.com/tutorials/how-to-use-the-usecontext-hook-in-react
const initState = {
  subscribe: (key: string, cb: () => boolean) => {},
  unsubscribe: (key: string) => {},
  localizeHotKey: (key: string) => {
    return '';
  },
};

export type ICtxState = typeof initState & {};

interface IContext {
  state: ICtxState;
  setState: React.Dispatch<React.SetStateAction<ICtxState>>;
}

const HotKeyContext = React.createContext({} as IContext);
interface hotKeyInfo {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  cb: () => boolean;
}

const HotKeyProvider = (props: PropsWithChildren) => {
  const t: IHotKeyStrings = useSelector(hotKeySelector);
  const hotKeys = useRef<hotKeyInfo[]>([]);

  const [state, setState] = useState({
    ...initState,
  });
  const lastKeyRef = useRef(0);
  const isMounted = useMounted('hotkeycontext');

  useEffect(() => {
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hotKeyCallback = (
    key: string,
    ctrl: boolean,
    alt: boolean,
    shift: boolean
  ) => {
    var ix = hotKeys.current.findIndex(
      (hk) =>
        hk.key === key.toUpperCase() &&
        hk.ctrl === ctrl &&
        hk.alt === alt &&
        hk.shift === shift
    );
    if (ix !== -1) return hotKeys.current[ix].cb;
    return undefined;
  };

  const handleKey = (e: KeyboardEvent) => {
    if (!e.key) return;
    switch (e.key.toUpperCase()) {
      case 'CONTROL':
      case 'ALT':
      case 'SHIFT':
        return;
      default:
        if (e.timeStamp !== lastKeyRef.current) {
          var cb = hotKeyCallback(e.key, e.ctrlKey, e.altKey, e.shiftKey);
          var handled = false;
          if (cb) handled = cb();
          if (handled) e.preventDefault();
          lastKeyRef.current = e.timeStamp;
        }
    }
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    handleKey(e.nativeEvent);
  };
  const newHotKey = (key: string, cb?: () => boolean) => {
    if (!cb)
      cb = () => {
        return false;
      };
    var hk = { key: '', ctrl: false, alt: false, shift: false, cb: cb };
    var keys = key.split('+');
    keys.forEach((p) => {
      switch (p) {
        case 'CTRL':
          hk.ctrl = true;
          break;
        case 'ALT':
          hk.alt = true;
          break;
        case 'SHIFT':
          hk.shift = true;
          break;
        case 'SPACE':
          hk.key = ' ';
          break;
        default:
          hk.key = p.toUpperCase();
      }
    });
    return hk;
  };
  const findHotKey = (key: string) => {
    var thiskey = newHotKey(key);
    return hotKeys.current.findIndex(
      (hk) =>
        hk.key === thiskey.key &&
        hk.ctrl === thiskey.ctrl &&
        hk.alt === thiskey.alt &&
        hk.shift === thiskey.shift
    );
  };
  const subscribe = (keys: string, cb: () => boolean) => {
    var akeys = keys.split(',');
    akeys.forEach((key) => {
      var ix = findHotKey(key);
      if (ix !== -1) {
        hotKeys.current[ix].cb = cb;
      } else {
        hotKeys.current.push(newHotKey(key, cb));
      }
    });
  };
  const unsubscribe = (keys: string) => {
    var akeys = keys.split(',');
    akeys.forEach((key) => {
      var ix = findHotKey(key);
      if (ix !== -1 && isMounted()) {
        hotKeys.current.splice(ix, 1);
      }
    });
  };
  const localizeHotKey = (key: string) => {
    return key
      .replace('CTRL', t.ctrlKey)
      .replace('ALT', t.altKey)
      .replace('SPACE', t.spaceKey)
      .replace('HOME', t.homeKey)
      .replace('END', t.endKey)
      .replace('ARROWLEFT', t.leftArrow)
      .replace('ARROWRIGHT', t.rightArrow)
      .replace('ARROWDOWN', t.downArrow)
      .replace('SHIFT', t.shiftKey)
      .split(',')
      .join(` ${t.or} `);
  };

  return (
    <HotKeyContext.Provider
      value={{
        state: {
          ...state,
          subscribe,
          unsubscribe,
          localizeHotKey,
        },
        setState,
      }}
    >
      <div onKeyDown={handleKeyDown}>{props.children}</div>
    </HotKeyContext.Provider>
  );
};

export { HotKeyContext, HotKeyProvider };
