import { useHistory } from 'react-router-dom';

export const useStickyRedirect = () => {
  const { push } = useHistory();

  return (to: string) => {
    localStorage.setItem('fromUrl', to);
    push(to);
  };
};
