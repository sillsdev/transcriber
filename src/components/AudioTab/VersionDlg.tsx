import { useContext, useState, useEffect } from 'react';

import { useGlobal } from 'reactn';
import {
  MediaFile,
  MediaFileD,
  Passage,
  Section,
  Plan,
  BookName,
  IState,
} from '../../model';
import { related, useArtifactType, usePlan, useRole } from '../../crud';
import { IRow, IGetMedia } from '.';
import { getMedia } from './getMedia';
import AudioTable from './AudioTable';
import { ActionRow, GrowingDiv } from '../StepEditor';
import SelectLatest from './SelectLatest';
import { UpdateRecord } from '../../model/baseModel';
import { useOrbitData } from '../../hoc/useOrbitData';
import { useSelector } from 'react-redux';
import { PlanContext } from '../../context/PlanContext';

interface IProps {
  passId: string;
}
export const VersionDlg = (props: IProps) => {
  const { passId } = props;
  const mediaFiles = useOrbitData<MediaFile[]>('mediafile');
  const sections = useOrbitData<Section[]>('section');
  const passages = useOrbitData<Passage[]>('passage');

  const [plan] = useGlobal('plan');
  const [memory] = useGlobal('memory');
  const { getPlan } = usePlan();
  const [user] = useGlobal('user');
  const [planRec] = useState(getPlan(plan) || ({} as Plan));
  const [playItem, setPlayItem] = useState('');
  const [data, setData] = useState<IRow[]>([]);
  //const [sectionArr, setSectionArr] = useState<[number, string][]>([]);
  const [sectionMap, setSectionMap] = useState(new Map<number, string>());
  const [versions, setVersions] = useState<number[]>([]);
  const [refresh, setRefresh] = useState(0);
  const { IsVernacularMedia } = useArtifactType();
  const handleRefresh = () => setRefresh(refresh + 1);
  const allBookData: BookName[] = useSelector(
    (state: IState) => state.books.bookData
  );

  const { sectionArr } = useContext(PlanContext).state;

  const handleLatest = (version: number) => {
    const id = data.find((d) => parseInt(d.version) === version)?.id;
    const nextVersion = Math.max(...versions) + 1;
    if (id) {
      const pi = mediaFiles.find((m) => m.id === id) as MediaFileD | undefined;
      if (pi) {
        pi.attributes.versionNumber = nextVersion;
        memory
          .update((t) => UpdateRecord(t, pi, user))
          .then(() => handleRefresh());
      }
    }
  };
  useEffect(() => {
    setSectionMap(new Map(sectionArr || []));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sectionArr]);

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
      sectionMap,
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
      <ActionRow>
        <GrowingDiv />
        <SelectLatest versions={versions} onChange={handleLatest} />
      </ActionRow>
    </>
  );
};

export default VersionDlg;
