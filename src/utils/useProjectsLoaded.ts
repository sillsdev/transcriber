import { useGlobal } from '../mods/reactn';

export const useProjectsLoaded = () => {
  const [projectsLoaded, setProjectsLoaded] = useGlobal('projectsLoaded');

  function AddProjectLoaded(project: string) {
    if (projectsLoaded.includes(project)) return;
    var pl = [...projectsLoaded];
    pl.push(project);
    setProjectsLoaded(pl);
  }
  return AddProjectLoaded;
};
