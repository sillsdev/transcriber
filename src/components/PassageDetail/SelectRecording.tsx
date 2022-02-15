import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Chip,
} from '@material-ui/core';
import BigDialog from '../../hoc/BigDialog';
import { useContext, useEffect, useState, useMemo } from 'react';
import { ISelectRecordingStrings, IState, MediaFile } from '../../model';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { IRow, PassageDetailContext } from '../../context/PassageDetailContext';
import { findRecord, related, useArtifactType } from '../../crud';
import { dateOrTime } from '../../utils';
import { connect } from 'react-redux';
import { localStrings } from '../../selector';
import { useGlobal } from 'reactn';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    menu: {},
    choice: {
      display: 'flex',
      alignItems: 'center',
    },
    description: {
      paddingLeft: theme.spacing(2),
    },
    label: { marginTop: theme.spacing(1) },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      display: 'flex',
      flexGrow: 1,
    },
  })
);

const PerformedBy = ({ r }: { r?: IRow }) => {
  const speaker = r?.mediafile?.attributes?.performedBy;
  return speaker ? (
    <span>
      {speaker}:{'\u00A0'}
    </span>
  ) : (
    <></>
  );
};

const Segments = ({ r }: { r?: IRow }) => {
  const ctx = useContext(PassageDetailContext);
  const { prettySegment } = ctx.state;

  return (
    <span>
      {r?.version && <Chip label={r?.version} size="small" />}
      {'\u00A0'}
      {prettySegment(r?.mediafile.attributes?.sourceSegments || '')}
      {'\u00A0'}
    </span>
  );
};

const Created = ({ r, lang }: { r?: IRow; lang: string }) => {
  const date = r?.mediafile?.attributes?.dateCreated;

  return date ? <span>({dateOrTime(date, lang)})</span> : <></>;
};

const ItemDescription = ({ id, lang }: { id: string; lang: string }) => {
  const ctx = useContext(PassageDetailContext);
  const { rowData } = ctx.state;
  const classes = useStyles();

  const r = rowData.find((r) => r.id === id);

  return (
    <div className={classes.description}>
      <span>
        {r?.artifactType}
        {'\u00A0'}
      </span>
      <PerformedBy r={r} />
      <Segments r={r} />
      <Created r={r} lang={lang} />
    </div>
  );
};

const RecordingHeader = ({ t }: { t: ISelectRecordingStrings }) => {
  return (
    <TableRow key={0}>
      <TableCell>{t.artifactType}</TableCell>
      <TableCell align="right">{t.sourceVersion}</TableCell>
      <TableCell align="left">{t.sourceSegment}</TableCell>
      <TableCell align="left">{t.created}</TableCell>
      <TableCell align="left">{t.speaker}</TableCell>
      <TableCell align="left">{t.filename}</TableCell>
    </TableRow>
  );
};

interface IInfoProps {
  row: IRow;
  lang: string;
  onClick: (id: string) => () => void;
}

const RecordingInfo = (iprops: IInfoProps) => {
  const { row, lang, onClick } = iprops;
  const ctx = useContext(PassageDetailContext);
  const { prettySegment } = ctx.state;
  const [memory] = useGlobal('memory');

  const nameOnly = (n: string) => {
    const parts = n.split('.');
    return parts.length > 1 ? parts[0] : n;
  };

  let version = '';
  const relatedMedia = related(row.mediafile, 'sourceMedia');
  if (relatedMedia) {
    var m = findRecord(memory, 'mediafile', relatedMedia) as MediaFile;
    version = m.attributes.versionNumber.toString();
  }
  return (
    <TableRow key={row.id} onClick={onClick(row.id)}>
      <TableCell component="th" scope="row">
        {row.artifactType}
      </TableCell>
      <TableCell align="right">{version}</TableCell>
      <TableCell align="left">
        {prettySegment(row.mediafile.attributes?.sourceSegments || '')}
      </TableCell>
      <TableCell align="left">
        {dateOrTime(row.mediafile.attributes?.dateCreated, lang)}
      </TableCell>
      <TableCell align="left">
        {row.mediafile.attributes?.performedBy}
      </TableCell>
      <TableCell align="left">{nameOnly(row.artifactName)}</TableCell>
    </TableRow>
  );
};

interface IStateProps {
  t: ISelectRecordingStrings;
  lang: string;
}

interface IProps extends IStateProps {
  inItem?: string;
  label?: string;
  onChange?: (resource: string) => void;
  required?: boolean;
  tags: string[];
}
export const SelectRecording = (props: IProps) => {
  const { t, lang, onChange, inItem, tags } = props;
  const classes = useStyles();
  const ctx = useContext(PassageDetailContext);
  const { rowData } = ctx.state;
  const [item, setItem] = useState('');
  const [chooser, setChooser] = useState(false);
  const { localizedArtifactType } = useArtifactType();

  const handleClick = (id: string) => () => {
    setItem(id);
    onChange && onChange(id);
    setChooser(false);
  };

  const handleItem = () => {
    setChooser(true);
  };

  useEffect(() => {
    if (inItem) setItem(inItem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inItem]);

  const localTags = useMemo(() => {
    return tags.map((t) => localizedArtifactType(t));
  }, [tags, localizedArtifactType]);

  return (
    <>
      <div className={classes.choice}>
        <Button onClick={handleItem} variant="contained">
          {t.playItem}
        </Button>
        <ItemDescription id={item} lang={lang} />
      </div>
      {chooser && (
        <BigDialog title={'Select Item'} isOpen={chooser} onOpen={setChooser}>
          <TableContainer component={Paper}>
            <Table size="small" aria-label="a dense table">
              <TableHead>
                <RecordingHeader t={t} />
              </TableHead>
              <TableBody>
                {rowData
                  .filter((r) => localTags.includes(r.artifactType))
                  .sort((i, j) =>
                    i.artifactType < j.artifactType
                      ? -1
                      : i.artifactType > j.artifactType
                      ? 1
                      : i.artifactName <= j.artifactName
                      ? -1
                      : 1
                  )
                  .map((r) => (
                    <RecordingInfo
                      key={r.id}
                      row={r}
                      lang={lang}
                      onClick={handleClick}
                    />
                  ))}
              </TableBody>
            </Table>
          </TableContainer>
        </BigDialog>
      )}
    </>
  );
};
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'selectRecording' }),
  lang: state.strings.lang,
});
export default connect(mapStateToProps)(SelectRecording) as any;
