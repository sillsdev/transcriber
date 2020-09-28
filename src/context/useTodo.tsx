import { useState } from 'react';
import { useContext } from 'react';
import { TranscriberContext } from './TranscriberContext';

const useTodo = () => {
  const { state } = useContext(TranscriberContext);
  const [filter, setFilter] = useState(false);

  return {
    ...state,
    filter,
    setFilter,
    index: state.index,
    selected: state.selected,
    mediafiles: state.mediafiles,
  };
};

export default useTodo;
