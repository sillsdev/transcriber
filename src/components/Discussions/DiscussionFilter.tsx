import { useEffect, useMemo, useState } from 'react';
import { connect } from 'react-redux';
import localStrings from '../../selector/localize';
import {
  Discussion,
  IDiscussionListStrings,
  IState,
  MediaFile,
  Passage,
} from '../../model';
import { Grid } from '@material-ui/core';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../../mods/react-orbitjs';
import DiscussionCard from './DiscussionCard';
import { getMediaInPlans, related, useArtifactType, useRole } from '../../crud';
import {
  CheckedChoice as ForYou,
  CheckedChoice as Resolved,
  CheckedChoice as LatestVersion,
  CheckedChoice as AllPassages,
  CheckedChoice as AllSteps,
} from '../../control';
import { useGlobal } from 'reactn';

interface IStateProps {
  t: IDiscussionListStrings;
}
interface IRecordProps {
  discussions: Discussion[];
  mediafiles: MediaFile[];
}
interface IProps extends IStateProps, IRecordProps {
  currentstep: string;
  planId: string;
  passage?: Passage;
}

export const DiscussionFilter = (props: IProps) => {
  const { discussions, mediafiles, currentstep, planId, passage, t } = props;
  const [user] = useGlobal('user');
  const [projRole] = useGlobal('projRole');
  const { getRoleRec } = useRole();
  const [displayDiscussions, setDisplayDiscussions] = useState<Discussion[]>(
    []
  );
  const { vernacularId } = useArtifactType();
  const [forYou, setForYou] = useState(false);
  const [resolved, setResolved] = useState(false);
  const [latestVersion, setLatestVersion] = useState(false);
  const [allPassages, setAllPassages] = useState(false || !Boolean(passage));
  const [allSteps, setAllSteps] = useState(false);

  const handleForYou = () => {
    setForYou(!forYou);
  };

  const handleResolved = () => {
    setResolved(!resolved);
  };

  const handleLatestVersion = () => {
    setLatestVersion(!latestVersion);
  };

  const handleAllPassages = () => {
    setAllPassages(!allPassages);
  };

  const handleAllSteps = () => {
    setAllSteps(!allSteps);
  };

  // All passages is currently giving all passages in all projects.
  // we would need this if we only wanted the passages of this project.
  // const planMedia = useMemo(
  //   () =>
  //     mediafiles.filter((m) => related(m, 'plan') === planId) as MediaFile[],
  //   [mediafiles, planId]
  // );

  const currentPassage = (d: Discussion) => {
    const mediaId = related(d, 'mediafile');
    const mediaRec = mediafiles.find((m) => m.id === mediaId);
    return mediaRec && passage && related(mediaRec, 'passage') === passage.id;
  };

  const projRoleId = useMemo(
    () => {
      if (!projRole) return '';
      const roleRec = getRoleRec(projRole, false);
      return roleRec.length > 0 ? roleRec[0].id : '';
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [projRole]
  );

  const latestMedia: string[] = useMemo(() => {
    return getMediaInPlans([planId], mediafiles, vernacularId, false).map(
      (r) => r.id
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [planId, mediafiles]);

  useEffect(() => {
    if (currentstep !== '') {
      setDisplayDiscussions(
        discussions
          .filter(
            (d) =>
              (!forYou ||
                related(d, 'user') === user ||
                related(d, 'role') === projRoleId) &&
              resolved === Boolean(d.attributes?.resolved) &&
              (!latestVersion ||
                latestMedia.indexOf(related(d, 'mediafile')) >= 0) &&
              (allPassages || currentPassage(d)) &&
              (allSteps || related(d, 'orgWorkflowStep') === currentstep)
          )
          .sort((x, y) =>
            x.attributes.resolved === y.attributes.resolved
              ? x.attributes.dateCreated < y.attributes.dateCreated
                ? -1
                : 1
              : x.attributes.resolved
              ? 1
              : -1
          )
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    discussions,
    currentstep,
    forYou,
    resolved,
    latestVersion,
    allPassages,
    allSteps,
  ]);

  return (
    <>
      <Grid container>
        <ForYou label={t.forYou} value={forYou} onChange={handleForYou} />
        <Resolved
          label={t.resolved}
          value={resolved}
          onChange={handleResolved}
        />
        <LatestVersion
          label={t.latestVersion}
          value={latestVersion}
          onChange={handleLatestVersion}
        />
        <AllPassages
          label={t.allPassages}
          value={allPassages || !Boolean(passage)}
          onChange={handleAllPassages}
          disabled={!Boolean(passage)}
        />
        <AllSteps
          label={t.allSteps}
          value={allSteps}
          onChange={handleAllSteps}
        />
      </Grid>
      <Grid container>
        {displayDiscussions.map((i, j) => (
          <DiscussionCard
            key={j}
            discussion={i}
            collapsed={true}
            onAddComplete={undefined}
          />
        ))}
      </Grid>
    </>
  );
};

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'discussionList' }),
});

const mapRecordsToProps = {
  discussions: (q: QueryBuilder) => q.findRecords('discussion'),
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(DiscussionFilter) as any as any
) as any;
