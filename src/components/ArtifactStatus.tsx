import { useEffect, useMemo, useState } from 'react';
import { Typography } from '@mui/material';
import { related } from '../crud/related';
import { prettySegment } from '../utils/prettySegment';
import usePassageDetailContext from '../context/usePassageDetailContext';
import { useArtifactType } from '../crud/useArtifactType';
import { ICommunityStrings } from '../model';
import { shallowEqual, useSelector } from 'react-redux';
import { communitySelector } from '../selector';
import { ArtifactTypeSlug } from '../crud/artifactTypeSlug';
import { getSortedRegions } from '../utils/namedSegments';

interface ArtifactStatusProps {
  recordType: ArtifactTypeSlug;
  currentVersion: number;
  segments: string;
}

export default function ArtifactStatus({
  recordType,
  currentVersion,
  segments,
}: ArtifactStatusProps) {
  const { rowData } = usePassageDetailContext();
  const { getTypeId } = useArtifactType();
  const [segsComp, setSegsComp] = useState('');
  const [segProgress, setSegProgress] = useState('');
  const [curVersionCount, setCurVersionCount] = useState(0);
  const [uniqueSegs, setUniqueSegs] = useState(0);
  const t: ICommunityStrings = useSelector(communitySelector, shallowEqual);

  const recordTypeId = useMemo(
    () => getTypeId(recordType),
    [recordType, getTypeId]
  );

  useEffect(() => {
    var mediaRec = rowData.filter(
      (r) => related(r.mediafile, 'artifactType') === recordTypeId
    );
    const curVer = mediaRec.filter((r) => r.sourceVersion === currentVersion);
    if (curVer.length !== curVersionCount) setCurVersionCount(curVer.length);
    const newSegsset = new Set(
      curVer.map((r) => {
        return prettySegment(r?.mediafile?.attributes?.sourceSegments).trim();
      })
    );
    const newUniqueSegs = newSegsset.size;
    if (newUniqueSegs !== uniqueSegs) setUniqueSegs(newUniqueSegs);
    const newSegsComp = Array.from(newSegsset)
      .sort((i, j) => parseFloat(i) - parseFloat(j))
      .join('; ');
    if (newSegsComp !== segsComp) setSegsComp(newSegsComp);
    const segs = getSortedRegions(segments);
    const newProgress = `${newUniqueSegs}/${segs?.length}`;
    if (newProgress !== segProgress) setSegProgress(newProgress);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowData, recordType, currentVersion, segments]);

  return recordType === ArtifactTypeSlug.PhraseBackTranslation ? (
    <Typography>
      {t.segmentsComplete
        .replace('{0}', currentVersion.toString())
        .replace('{1}', segsComp ? segsComp : t.none)
        .replace('{2}', segProgress)}
    </Typography>
  ) : recordType === ArtifactTypeSlug.WholeBackTranslation ? (
    <Typography>
      {t.backTranslationComplete
        .replace('{0}', currentVersion.toString())
        .replace('{1}', curVersionCount > 0 ? t.finished : t.none)}
    </Typography>
  ) : (
    <></>
  );
}
