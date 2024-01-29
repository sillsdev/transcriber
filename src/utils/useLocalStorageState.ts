/**
 *
 * @param {String} key The key to set in localStorage for this value
 * @param {Object} defaultValue The value to use if it is not already in localStorage
 * @param {{serialize: Function, deserialize: Function}} options The serialize and deserialize functions to use (defaults to JSON.stringify and JSON.parse respectively)
 */

import React from 'react';

function useLocalStorageState(
  key: string,
  defaultValue: any = '',
  // the = {} fixes the error we would get from destructuring when no argument was passed
  // Check https://jacobparis.com/blog/destructure-arguments for a detailed explanation
  { serialize = JSON.stringify, deserialize = JSON.parse } = {}
) {
  const valueInLocalStorage = React.useRef(window.localStorage.getItem(key));
  const [state, setStatex] = React.useState(() => {
    if (valueInLocalStorage.current) {
      // the try/catch is here in case the localStorage value was set before
      // we had the serialization in place (like we do in previous extra credits)
      try {
        return deserialize(valueInLocalStorage.current);
      } catch (error) {
        window.localStorage.removeItem(key);
        valueInLocalStorage.current = null;
      }
    }
    return typeof defaultValue === 'function' ? defaultValue() : defaultValue;
  });

  // Check the example at src/examples/local-state-key-change.js to visualize a key change
  React.useEffect(() => {
    const serializedState = serialize(state);
    if (serializedState !== valueInLocalStorage.current) {
      window.localStorage.setItem(key, serialize(state));
    }
  }, [key, state, serialize]);

  const setState = (value: any) => {
    if (serialize(state) !== serialize(value)) setStatex(value);
  };

  return [state, setState];
}

export default useLocalStorageState;
