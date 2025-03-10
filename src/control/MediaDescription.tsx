import { Box, BoxProps, Chip, styled } from '@mui/material';
import { MediaFile } from '../model';
import { findRecord, related } from '../crud';
import { dateOrTime, prettySegment } from '../utils';
import { useGlobal } from '../context/GlobalContext';

// see: https://mui.com/material-ui/customization/how-to-customize/
interface StyledBoxProps extends BoxProps {
  col?: boolean;
}
const StyledBox = styled(Box, {
  shouldForwardProp: (prop) => prop !== 'col',
})<StyledBoxProps>(({ col, theme }) => ({
  ...(col
    ? {
        paddingLeft: theme.spacing(2),
      }
    : {
        paddingLeft: theme.spacing(2),
        display: 'flex',
        flexDirection: 'row',
      }),
}));

const PerformedBy = ({ mediafile }: { mediafile?: MediaFile }) => {
  const speaker = mediafile?.attributes?.performedBy;
  return speaker ? (
    <span>
      {speaker}:{'\u00A0'}
    </span>
  ) : (
    <></>
  );
};

const Segments = ({
  mediafile,
  version,
}: {
  mediafile?: MediaFile;
  version: string;
}) => {
  return (
    <span>
      {version && <Chip label={version} size="small" />}
      {'\u00A0'}
      {prettySegment(mediafile?.attributes?.sourceSegments || '')}
      {'\u00A0'}
    </span>
  );
};

const Created = ({
  mediafile,
  lang,
}: {
  mediafile?: MediaFile;
  lang: string;
}) => {
  const date = mediafile?.attributes?.dateCreated;

  return date ? <span>({dateOrTime(date, lang)})</span> : <></>;
};

export const ItemDescription = ({
  mediafile,
  col,
}: {
  mediafile?: MediaFile;
  col?: boolean;
}) => {
  const [memory] = useGlobal('memory');
  const [locale] = useGlobal('lang');

  var version = '';
  const relatedMedia = related(mediafile, 'sourceMedia');
  if (relatedMedia) {
    var s = findRecord(memory, 'mediafile', relatedMedia) as MediaFile;
    version = s.attributes?.versionNumber?.toString();
  }
  return (
    <StyledBox col={col} className="item-desc">
      <PerformedBy mediafile={mediafile} />
      <Segments mediafile={mediafile} version={version} />
      <Created mediafile={mediafile} lang={locale} />
    </StyledBox>
  );
};
