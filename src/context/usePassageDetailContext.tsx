import { useState } from 'react';
import { useContext } from 'react';
import { PassageDetailContext } from './PassageDetailContext';

const usePassageDetailContext = () => {
  const { state } = useContext(PassageDetailContext);
  const [filter, setFilter] = useState(false);

  return {
    ...state,
    filter,
    setFilter,
    index: state?.index ?? 0,
    selected: state?.selected ?? '',
  };
};

export default usePassageDetailContext;
