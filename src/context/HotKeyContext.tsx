import React, { useState } from 'react';
import { connect } from 'react-redux';
import { IHotKeyStrings, IState } from '../model';
import localStrings from '../selector/localize';
import { useMounted } from '../utils';
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
interface IStateProps {
  t: IHotKeyStrings;
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'hotKey' }),
});
interface IProps extends IStateProps {
  children: any;
}
interface hotKeyInfo {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  cb: () => boolean;
}

const HotKeyProvider = connect(mapStateToProps)((props: IProps) => {
  const { t } = props;
  const [hotKeys, setHotKeys] = useState<hotKeyInfo[]>([]);

  const [state, setState] = useState({
    ...initState,
  });
  const isMounted = useMounted('hotkeycontext');

  const hotKeyCallback = (key: string, ctrl: boolean, alt: boolean) => {
    var ix = hotKeys.findIndex(
      (hk) => hk.key === key.toUpperCase() && hk.ctrl === ctrl && hk.alt === alt
    );
    if (ix !== -1) return hotKeys[ix].cb;
    return undefined;
  };
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key.toUpperCase()) {
      case 'CONTROL':
      case 'ALT':
      case 'SHIFT':
        return;
      default:
        var cb = hotKeyCallback(e.key, e.ctrlKey, e.altKey);
        var handled = false;
        if (cb) handled = cb();
        if (handled) e.preventDefault();
    }
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
    return hotKeys.findIndex(
      (hk) =>
        hk.key === thiskey.key &&
        hk.ctrl === thiskey.ctrl &&
        hk.alt === thiskey.alt
    );
  };
  const subscribe = (keys: string, cb: () => boolean) => {
    var akeys = keys.split(',');
    akeys.forEach((key) => {
      var ix = findHotKey(key);
      if (ix !== -1) {
        hotKeys[ix].cb = cb;
      } else {
        hotKeys.push(newHotKey(key, cb));
      }
    });
  };
  const unsubscribe = (keys: string) => {
    var akeys = keys.split(',');
    akeys.forEach((key) => {
      var ix = findHotKey(key);
      if (ix !== -1 && isMounted()) {
        setHotKeys(hotKeys.splice(ix, 1));
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
});

export { HotKeyContext, HotKeyProvider };
