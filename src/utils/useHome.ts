import { To, useNavigate } from 'react-router-dom';
import { useGetGlobal, useGlobal } from '../context/GlobalContext';

export const useHome = () => {
  const [, setProject] = useGlobal('project');
  const [, setProjType] = useGlobal('projType');
  const [, setPlan] = useGlobal('plan');
  const [, setOrgRole] = useGlobal('orgRole');
  const [, setHome] = useGlobal('home');
  const getGlobal = useGetGlobal();
  const navigate = useNavigate();

  const resetProject = () => {
    setProject('');
    setPlan('');
    setProjType('');
    setOrgRole(undefined);
  };
  const goHome = () => {
    resetProject();
    if (!getGlobal('home')) setHome(true);
    setTimeout(() => {
      navigate('/team');
    }, 100);
  };
  const leaveHome = () => {
    if (getGlobal('home')) setHome(false);
  };
  const checkHome = (to: To) => {
    var gohome = !to || to === '/' || to === '/team';
    if (getGlobal('home') !== gohome) setHome(gohome);
  };

  return { goHome, leaveHome, checkHome, resetProject };
};
