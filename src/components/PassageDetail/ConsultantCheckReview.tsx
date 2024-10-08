import { useEffect, useState } from 'react';
import { MediaFileD } from '../../model';
import { mediaFileName } from '../../crud/media';
import { useArtifactType } from '../../crud/useArtifactType';
import { related } from '../../crud/related';
import { ArtifactTypeSlug } from '../../crud/artifactTypeSlug';
import { IRow } from '../../context/PassageDetailContext';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import {
  IconButton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableCellProps,
  TableHead,
  TableRow,
  Typography,
  styled,
} from '@mui/material';
import { shallowEqual, useSelector } from 'react-redux';
import { consultantSelector } from '../../selector';
import PlayArrow from '@mui/icons-material/PlayArrow';
import CancelPlay from '@mui/icons-material/Clear';
import { prettySegment } from '../../utils/prettySegment';
import ArtifactStatus from '../ArtifactStatus';
import { getSegments, NamedRegions } from '../../utils/namedSegments';

const StyledCell = styled(TableCell)<TableCellProps>(({ theme }) => ({
  padding: '4px',
}));

interface IProps {
  item: ArtifactTypeSlug;
  onPlayer?: (mediaId: string) => void;
  playId?: string;
}

export default function ConsultantCheckReview({
  item,
  onPlayer,
  playId,
}: IProps) {
  const { rowData, mediafileId } = usePassageDetailContext();
  const [allMedia, setAllMedia] = useState<MediaFileD[]>([]);
  const [segments, setSegments] = useState('');
  const { localizedArtifactType } = useArtifactType();
  const t = useSelector(consultantSelector, shallowEqual);

  const handleSelect = (id: string) => () => {
    if (playId !== id) {
      onPlayer && onPlayer(id);
    } else {
      onPlayer && onPlayer('');
    }
  };

  const sortRows = (i: IRow, j: IRow) => {
    const iSeg = i.mediafile.attributes.sourceSegments;
    const jSeg = j.mediafile.attributes.sourceSegments;
    let iStart = 0;
    let jStart = 1;
    try {
      iStart = parseFloat(JSON.parse(iSeg).start);
      jStart = parseFloat(JSON.parse(jSeg).start);
      return iStart - jStart;
    } catch (e) {
      return mediaFileName(i.mediafile) <= mediaFileName(j.mediafile) ? -1 : 1;
    }
  };

  useEffect(() => {
    if (item === ArtifactTypeSlug.Vernacular) {
      setAllMedia(
        rowData[0]?.mediafile && mediafileId === rowData[0]?.mediafile.id
          ? [rowData[0]?.mediafile]
          : []
      );
    } else {
      const mediaId = rowData[0]?.mediafile.id ?? '';
      const artifactType = localizedArtifactType(item);
      const media = rowData
        .filter(
          (r) =>
            r.artifactType === artifactType &&
            related(r.mediafile, 'sourceMedia') === mediaId
        )
        .sort(sortRows)
        .map((r) => r.mediafile);
      setAllMedia(media);
      onPlayer && onPlayer('');
    }

    if (item === ArtifactTypeSlug.PhraseBackTranslation) {
      const mediaRec =
        rowData[0]?.mediafile &&
        mediafileId === rowData[0]?.mediafile.id &&
        rowData[0]?.mediafile;
      if (mediaRec) {
        const defaultSegments = mediaRec?.attributes?.segments;
        setSegments(getSegments(NamedRegions.BackTranslation, defaultSegments));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  const hasTranscription = allMedia.some((m) => m.attributes.transcription);

  return (
    <Stack id="check-review">
      {allMedia.length === 0 && (
        <Typography data-testid="no-media">{t.noMedia}</Typography>
      )}
      {allMedia.length > 0 && (
        <>
          {[
            ArtifactTypeSlug.PhraseBackTranslation,
            ArtifactTypeSlug.WholeBackTranslation,
          ].includes(item) && (
            <ArtifactStatus
              recordType={item}
              currentVersion={rowData[0].mediafile.attributes?.versionNumber}
              rowData={rowData}
              segments={segments}
            />
          )}
          <Table>
            {allMedia.length > 1 && hasTranscription && (
              <TableHead>
                <TableRow>
                  <StyledCell />
                  <StyledCell>{t.transcription}</StyledCell>
                </TableRow>
              </TableHead>
            )}
            <TableBody>
              {allMedia.map((m) => (
                <TableRow key={m.id}>
                  <StyledCell sx={{ width: '40px' }}>
                    <>
                      <IconButton
                        onClick={handleSelect(m.id)}
                        data-testid="play"
                      >
                        {m.id !== playId ? <PlayArrow /> : <CancelPlay />}
                      </IconButton>
                      {item === ArtifactTypeSlug.PhraseBackTranslation &&
                        prettySegment(m.attributes.sourceSegments)}
                    </>
                  </StyledCell>
                  <StyledCell>
                    {hasTranscription && (
                      <Typography
                        data-testid="transcription"
                        sx={{ whiteSpace: 'break-spaces' }}
                      >
                        {m.attributes.transcription ?? t.noTranscription}
                      </Typography>
                    )}
                  </StyledCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </>
      )}
    </Stack>
  );
}
