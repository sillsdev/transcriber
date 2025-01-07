import { To, useNavigate } from 'react-router-dom';
import { useGlobal } from '../context/GlobalContext';

export const useHome = () => {
  const [, setProject] = useGlobal('project');
  const [, setProjType] = useGlobal('projType');
  const [, setPlan] = useGlobal('plan');
  const [, setOrgRole] = useGlobal('orgRole');
  const [home, setHome] = useGlobal('home');
  const navigate = useNavigate();

  const resetProject = () => {
    setProject('');
    setPlan('');
    setProjType('');
    setOrgRole(undefined);
  };
  const goHome = () => {
    resetProject();
    if (!home) setHome(true);
    setTimeout(() => {
      navigate('/team');
    }, 100);
  };
  const leaveHome = () => {
    if (home) setHome(false);
  };
  const checkHome = (to: To) => {
    var gohome = !to || to === '/' || to === '/team';
    if (home !== gohome) setHome(gohome);
  };

  return { goHome, leaveHome, checkHome, resetProject };
};
