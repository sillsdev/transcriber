import { useEffect, useState } from 'react';
import { MediaFile } from '../../model';
import { ArtifactTypeSlug, useArtifactType, related } from '../../crud';
import MediaPlayer from '../MediaPlayer';
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

const StyledCell = styled(TableCell)<TableCellProps>(({ theme }) => ({
  padding: '4px',
}));

interface IProps {
  item: ArtifactTypeSlug;
}

export default function ConsultantCheckReview({ item }: IProps) {
  const { rowData } = usePassageDetailContext();
  const [mediaId, setMediaId] = useState<string>('');
  const [allMedia, setAllMedia] = useState<MediaFile[]>([]);
  const { localizedArtifactType } = useArtifactType();
  const t = useSelector(consultantSelector, shallowEqual);

  const handleSelect = (id: string) => () => {
    setMediaId(id);
  };

  const handleEnded = () => {
    setMediaId('');
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
      return i.mediafile.attributes.originalFile <=
        j.mediafile.attributes.originalFile
        ? -1
        : 1;
    }
  };

  useEffect(() => {
    if (item === ArtifactTypeSlug.Vernacular) {
      setMediaId(rowData[0]?.mediafile.id ?? '');
      setAllMedia(rowData[0]?.mediafile ? [rowData[0]?.mediafile] : []);
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
      setMediaId('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  return (
    <Stack id="check-review">
      {allMedia.length === 0 && (
        <Typography data-testid="no-media">{t.noMedia}</Typography>
      )}
      <MediaPlayer
        controls
        srcMediaId={mediaId}
        requestPlay={true}
        onEnded={handleEnded}
      />
      {allMedia.length > 0 && (
        <Table>
          {allMedia.length > 1 && (
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
                  {m.id !== mediaId && (
                    <IconButton onClick={handleSelect(m.id)} data-testid="play">
                      <PlayArrow />
                    </IconButton>
                  )}
                </StyledCell>
                <StyledCell>
                  <Typography data-testid="transcription">
                    {m.attributes.transcription ?? t.noTranscription}
                  </Typography>
                </StyledCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </Stack>
  );
}
