import { useEffect, useState } from 'react';
import { MediaFile } from '../../model';
import { ArtifactTypeSlug, useArtifactType, related } from '../../crud';
import MediaPlayer from '../MediaPlayer';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import {
  Icon,
  IconButton,
  Slider,
  Stack,
  TextField,
  Typography,
} from '@mui/material';

interface IProps {
  item: ArtifactTypeSlug;
}

export default function ConsultantCheckReview({ item }: IProps) {
  const { rowData } = usePassageDetailContext();
  const [mediaId, setMediaId] = useState<string>('');
  const [allMedia, setAllMedia] = useState<MediaFile[]>([]);
  const [sliderIndex, setSliderIndex] = useState<number>(0);
  const [marks, setMarks] = useState<{ label: string; value: number }[]>([]);
  const [transcription, setTranscription] = useState<string>('');
  const { localizedArtifactType } = useArtifactType();

  const handleEnded = () => {};

  const handleSliderChange = (event: any, newValue: number | number[]) => {
    const value = newValue as number;
    setMediaId(allMedia[value].id);
    setTranscription(allMedia[value].attributes.transcription ?? '');
    setSliderIndex(value);
  };

  const handleNext = () => {
    if (sliderIndex < allMedia.length - 1) {
      const index = sliderIndex + 1;
      setMediaId(allMedia[index].id);
      setTranscription(allMedia[index].attributes.transcription ?? '');
      setSliderIndex(index);
    }
  };

  useEffect(() => {
    if (item === ArtifactTypeSlug.Vernacular) {
      setMediaId(rowData[0]?.mediafile.id ?? '');
      setAllMedia([rowData[0]?.mediafile] ?? []);
      setTranscription(rowData[0]?.mediafile.attributes.transcription ?? '');
    } else {
      const mediaId = rowData[0]?.mediafile.id ?? '';
      const artifactType = localizedArtifactType(item);
      const media = rowData
        .filter(
          (r) =>
            r.artifactType === artifactType &&
            related(r.mediafile, 'sourceMedia') === mediaId
        )
        .map((r) => r.mediafile);
      setAllMedia(media);
      if (media.length > 0) {
        setMediaId(media[0].id);
        setTranscription(media[0].attributes.transcription ?? '');
        setSliderIndex(0);
        const sliderLength = media.length;
        for (let value = 0; value < sliderLength; value++) {
          setMarks((prev) => [
            ...prev,
            {
              value,
              label: `${value + 1} / ${sliderLength}`,
            },
          ]);
        }
      } else {
        setMediaId('');
        setTranscription('');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item]);

  return (
    <Stack id="check-review">
      {mediaId === '' && (
        <Typography data-testid="no-media">{'t.noMedia'}</Typography>
      )}
      {allMedia.length > 1 && (
        <Stack direction="row" alignItems="center" sx={{ my: 2 }}>
          <Slider
            data-testid="check-review-slider"
            value={sliderIndex}
            marks={marks}
            max={allMedia.length - 1}
            onChange={handleSliderChange}
            sx={{ mx: 2 }}
          />
          <Stack>
            <IconButton onClick={handleNext} color="primary">
              <Icon>skip_next</Icon>
            </IconButton>
            {'\u00A0' /* non-breaking space keeps button aligned with slider */}
          </Stack>
        </Stack>
      )}
      <MediaPlayer
        controls
        srcMediaId={mediaId}
        requestPlay={false}
        onEnded={handleEnded}
      />
      {mediaId !== '' && (
        <TextField
          data-testid="transcription"
          placeholder="t.NoTranscription"
          multiline
          sx={{ py: 2 }}
          value={transcription}
        />
      )}
    </Stack>
  );
}
