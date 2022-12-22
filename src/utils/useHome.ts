import { useNavigate } from 'react-router-dom';
import { useGlobal } from 'reactn';

export const useHome = () => {
  const [, setProject] = useGlobal('project');
  const [, setProjType] = useGlobal('projType');
  const [, setPlan] = useGlobal('plan');
  const [, setOrgRole] = useGlobal('orgRole');
  const [, setHome] = useGlobal('home');
  const navigate = useNavigate();

  const resetProject = () => {
    setProject('');
    setPlan('');
    setProjType('');
    setOrgRole(undefined);
  };
  const goHome = () => {
    resetProject();
    setHome(true);
    navigate('/team');
  };
  const leaveHome = () => {
    //assume all necessary project stuff is set;
    setHome(false);
  };
  return { goHome, leaveHome, resetProject };
};
