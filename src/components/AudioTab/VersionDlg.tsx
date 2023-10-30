import React, { useState, useEffect } from 'react';
import { useGlobal } from 'reactn';
import { connect } from 'react-redux';
import { withData } from 'react-orbitjs';
import {
  IState,
  MediaFile,
  Passage,
  Section,
  Plan,
  BookName,
  IMediaTabStrings,
} from '../../model';
import localStrings from '../../selector/localize';
import { QueryBuilder } from '@orbit/data';
import { related, useArtifactType, usePlan, useRole } from '../../crud';
import { IRow, getMedia, IGetMedia } from '.';
import AudioTable from './AudioTable';
import { ActionRow, GrowingDiv } from '../StepEditor';
import SelectLatest from './SelectLatest';
import { UpdateRecord } from '../../model/baseModel';

interface IStateProps {
  t: IMediaTabStrings;
  allBookData: BookName[];
}

interface IRecordProps {
  mediaFiles: Array<MediaFile>;
  passages: Array<Passage>;
  sections: Array<Section>;
}

interface IProps extends IStateProps, IRecordProps {
  passId: string;
}
export const VersionDlg = (props: IProps) => {
  const { passId, allBookData } = props;
  const { mediaFiles, passages, sections } = props;
  const [plan] = useGlobal('plan');
  const [memory] = useGlobal('memory');
  const { getPlan } = usePlan();
  const [user] = useGlobal('user');
  const { userIsAdmin } = useRole();
  const [planRec] = useState(getPlan(plan) || ({} as Plan));
  const [playItem, setPlayItem] = useState('');
  const [data, setData] = useState<IRow[]>([]);
  const [versions, setVersions] = useState<number[]>([]);
  const [refresh, setRefresh] = useState(0);
  const { IsVernacularMedia } = useArtifactType();
  const handleRefresh = () => setRefresh(refresh + 1);

  const handleLatest = (version: number) => {
    const id = data.find((d) => parseInt(d.version) === version)?.id;
    const nextVersion = Math.max(...versions) + 1;
    if (id) {
      const pi = mediaFiles.find((m) => m.id === id);
      if (pi) {
        pi.attributes.versionNumber = nextVersion;
        memory
          .update((t) => UpdateRecord(t, pi, user))
          .then(() => handleRefresh());
      }
    }
  };

  useEffect(() => {
    const playChange = data[0]?.playIcon !== playItem;
    const media: MediaFile[] = mediaFiles.filter(
      (m) => related(m, 'passage') === passId && IsVernacularMedia(m)
    );
    //filter
    const mediaData: IGetMedia = {
      planName: planRec?.attributes?.name,
      passages,
      sections,
      playItem,
      allBookData,
      isPassageDate: false,
    };
    const newData = getMedia(media, mediaData);
    if (newData.length !== data.length || playChange || refresh) {
      setData(newData);
      setVersions(newData.map((d) => parseInt(d.version)));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediaFiles, sections, passages, planRec, passId, playItem, refresh]);

  return (
    <>
      <AudioTable
        data={data}
        setRefresh={handleRefresh}
        playItem={playItem}
        setPlayItem={setPlayItem}
      />
      {userIsAdmin && (
        <ActionRow>
          <GrowingDiv />
          <SelectLatest versions={versions} onChange={handleLatest} />
        </ActionRow>
      )}
    </>
  );
};

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'mediaTab' }),
  allBookData: state.books.bookData,
});

const mapRecordsToProps = {
  mediaFiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  passages: (q: QueryBuilder) => q.findRecords('passage'),
  sections: (q: QueryBuilder) => q.findRecords('section'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(VersionDlg) as any
) as any;
