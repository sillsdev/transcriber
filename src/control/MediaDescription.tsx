import { Chip } from '@material-ui/core';
import { MediaFile } from '../model';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { findRecord, related, useArtifactType } from '../crud';
import { dateOrTime, prettySegment } from '../utils';
import { useGlobal } from 'reactn';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    descriptionRow: {
      paddingLeft: theme.spacing(2),
      display: 'flex',
      flexDirection: 'row',
    },
    descriptionCol: {
      paddingLeft: theme.spacing(2),
      display: 'flex',
      flexDirection: 'column',
    },
  })
);

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
  const classes = useStyles();
  const { localizedArtifactTypeFromId } = useArtifactType();
  const [memory] = useGlobal('memory');
  const [locale] = useGlobal('lang');

  var version = '';
  const relatedMedia = related(mediafile, 'sourceMedia');
  if (relatedMedia) {
    var s = findRecord(memory, 'mediafile', relatedMedia) as MediaFile;
    version = s.attributes?.versionNumber?.toString();
  }
  return (
    <div className={col ? classes.descriptionCol : classes.descriptionRow}>
      <span>
        {mediafile
          ? localizedArtifactTypeFromId(related(mediafile, 'artifactType'))
          : ''}
        {'\u00A0'}
      </span>
      <PerformedBy mediafile={mediafile} />
      <Segments mediafile={mediafile} version={version} />
      <Created mediafile={mediafile} lang={locale} />
    </div>
  );
};
