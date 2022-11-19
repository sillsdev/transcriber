import React, { useContext } from 'react';
import { TokenContext } from '../context/TokenProvider';
import { connect } from 'react-redux';
import {
  IState,
  MediaFile,
  IProjectDownloadStrings,
  OfflineProject,
  Project,
} from '../model';
import localStrings from '../selector/localize';
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import Alert from './AlertDialog';
import ProjectDownload from './ProjectDownload';
import { dataPath, PathType } from '../utils';
import { related, useProjectPlans, getMediaInPlans } from '../crud';
import { isElectron } from '../api-variable';

import fs from 'fs';

interface PlanProject {
  [planId: string]: string;
}

interface IStateProps {
  t: IProjectDownloadStrings;
}

interface IRecordProps {
  offlineProjects: Array<OfflineProject>;
  projects: Array<Project>;
  mediafiles: Array<MediaFile>;
}

interface IProps extends IStateProps, IRecordProps {
  cb: () => void;
}

export const ProjectDownloadAlert = (props: IProps) => {
  const { cb, t } = props;
  const { offlineProjects, mediafiles, projects } = props;
  const tokenCtx = useContext(TokenContext);
  const [alert, setAlert] = React.useState(false);
  const [downloadSize, setDownloadSize] = React.useState(0);
  const [needyIds, setNeedyIds] = React.useState<string[]>([]);
  const [downloadOpen, setDownloadOpen] = React.useState(false);
  const projectPlans = useProjectPlans();

  const getNeedyRemoteIds = () => {
    const ops = offlineProjects.filter((op) => op.attributes.offlineAvailable);
    let planIds = Array<string>();
    const planProject: PlanProject = {};
    ops.forEach((offlineProjRec) => {
      var projectId = related(offlineProjRec, 'project');
      const project = projects.find((pr) => pr.id === projectId);
      if (project?.keys?.remoteId) {
        projectPlans(projectId).forEach((pl) => {
          planIds.push(pl.id);
          planProject[pl.id] = projectId;
        });
      }
    });
    const mediaRecs = getMediaInPlans(planIds, mediafiles, undefined, false);
    const needyProject = new Set<string>();
    let totalSize = 0;
    mediaRecs.forEach((m) => {
      if (related(m, 'artifactType') || related(m, 'passage')) {
        var local = { localname: '' };
        dataPath(m.attributes.audioUrl, PathType.MEDIA, local);
        if (!fs.existsSync(local.localname)) {
          needyProject.add(planProject[related(m, 'plan')]);
          totalSize += m?.attributes?.filesize || 0;
        }
      }
    });
    if (downloadSize !== totalSize) setDownloadSize(totalSize);
    return Array.from(needyProject);
  };

  const handleDownload = () => {
    setDownloadOpen(true);
  };

  React.useEffect(() => {
    if (isElectron && tokenCtx.state.accessToken) {
      const projRemIds = getNeedyRemoteIds();
      if (projRemIds.length > 0) {
        setNeedyIds(projRemIds);
        setAlert(true);
      } else cb();
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

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'projectDownload' }),
});

const mapRecordsToProps = {
  offlineProjects: (q: QueryBuilder) => q.findRecords('offlineproject'),
  projects: (q: QueryBuilder) => q.findRecords('project'),
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(ProjectDownloadAlert) as any
) as any;
