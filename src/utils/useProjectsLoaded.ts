import { useGetGlobal, useGlobal } from '../context/GlobalContext';

export const useProjectsLoaded = () => {
  const getGlobal = useGetGlobal();
  const [, setProjectsLoaded] = useGlobal('projectsLoaded');

  function AddProjectLoaded(project: string) {
    if (getGlobal('projectsLoaded').includes(project)) return;
    var pl = [...getGlobal('projectsLoaded')];
    pl.push(project);
    setProjectsLoaded(pl);
  }
  return AddProjectLoaded;
};
