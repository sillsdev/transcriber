import React, { useContext } from 'react';
import { TokenContext } from '../context/TokenProvider';
import { useSelector } from 'react-redux';
import {
  MediaFileD,
  IProjectDownloadStrings,
  OfflineProject,
  ProjectD,
} from '../model';
import Alert from './AlertDialog';
import ProjectDownload from './ProjectDownload';
import { dataPath, PathType } from '../utils';
import { related, useProjectPlans, getDownloadableMediaInPlans } from '../crud';
import { isElectron } from '../api-variable';
import { useOrbitData } from '../hoc/useOrbitData';
import { projectDownloadSelector } from '../selector';
import { useGlobal } from 'reactn';

interface PlanProject {
  [planId: string]: string;
}

interface IProps {
  cb: () => void;
}

export const ProjectDownloadAlert = (props: IProps) => {
  const { cb } = props;
  const t: IProjectDownloadStrings = useSelector(projectDownloadSelector);
  const offlineProjects = useOrbitData<OfflineProject[]>('offlineproject');
  const projects = useOrbitData<ProjectD[]>('project');
  const mediafiles = useOrbitData<MediaFileD[]>('mediafile');
  const tokenCtx = useContext(TokenContext);
  const [alert, setAlert] = React.useState(false);
  const [downloadSize, setDownloadSize] = React.useState(0);
  const [needyIds, setNeedyIds] = React.useState<string[]>([]);
  const [downloadOpen, setDownloadOpen] = React.useState(false);
  const [memory] = useGlobal('memory');

  const projectPlans = useProjectPlans();

  const getNeedyRemoteIds = async () => {
    const ops = offlineProjects.filter(
      (op) => op?.attributes?.offlineAvailable
    );
    let planIds = Array<string>();
    const planProject: PlanProject = {};
    ops.forEach((offlineProjRec) => {
      var projectId = related(offlineProjRec, 'project') as string;
      const project = projects.find((pr) => pr.id === projectId);
      if (project?.keys?.remoteId) {
        projectPlans(projectId).forEach((pl) => {
          planIds.push(pl.id as string);
          planProject[pl.id as string] = projectId;
        });
      }
    });
    const mediaInfo = getDownloadableMediaInPlans(planIds, memory);
    const needyProject = new Set<string>();
    let totalSize = 0;
    for (const m of mediaInfo) {
      if (related(m.media, 'artifactType') || related(m.media, 'passage')) {
        var local = { localname: '' };
        var path = await dataPath(
          m.media.attributes.audioUrl,
          PathType.MEDIA,
          local
        );
        if (path !== local.localname) {
          needyProject.add(planProject[m.plan]);
          totalSize += m.media.attributes?.filesize || 0;
        }
      }
    }
    if (downloadSize !== totalSize) setDownloadSize(totalSize);
    return Array.from(needyProject);
  };

  const handleDownload = () => {
    setDownloadOpen(true);
  };

  React.useEffect(() => {
    if (isElectron && tokenCtx.state.accessToken) {
      getNeedyRemoteIds().then((projRemIds) => {
        if (projRemIds.length > 0) {
          setNeedyIds(projRemIds);
          setAlert(true);
        } else cb();
      });
    } else cb();
    /* eslint-disable-next-line react-hooks/exhaustive-deps */
  }, [offlineProjects, projects, mediafiles]);

  return (
    <div>
      {alert && (
        <Alert
          title={t.download}
          text={t.downloadMb.replace(
            '{0}',
            Math.ceil(downloadSize / 1000 + 0.5).toString()
          )}
          yesResponse={handleDownload}
          no={t.downloadLater}
          noResponse={cb}
          noOnLeft={true}
        />
      )}
      <ProjectDownload open={downloadOpen} projectIds={needyIds} finish={cb} />
    </div>
  );
};

export default ProjectDownloadAlert;
