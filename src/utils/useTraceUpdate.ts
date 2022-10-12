import { useEffect, useRef } from 'react';

//to print out what props are changing
//useTraceUpdate(props)
//to your component
export const useTraceUpdate = (props: any) => {
  const prev = useRef(props);
  useEffect(() => {
    const changedProps = Object.entries(props).reduce((ps, [k, v]) => {
      if (prev.current[k as keyof typeof prev] !== v) {
        (ps as any)[k] = [prev.current[k], v];
      }
      return ps;
    }, {});
    if (Object.keys(changedProps).length > 0) {
      console.log('Changed props:');
      Object.keys(changedProps).forEach((key) => {
        console.log(key, changedProps[key as keyof typeof changedProps]);
      });
    }
    prev.current = props;
  });
};
