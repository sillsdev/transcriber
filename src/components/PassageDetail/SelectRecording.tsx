import {
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
} from '@material-ui/core';
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
    label: { marginTop: theme.spacing(1) },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      display: 'flex',
      flexGrow: 1,
    },
  })
);

interface IStateProps {
  t: ISelectRecordingStrings;
  lang: string;
}

interface IProps extends IStateProps {
  inResource?: string;
  label?: string;
  onChange?: (resource: string) => void;
  required?: boolean;
  tags: string[];
}
interface IInfoProps {
  row: IRow;
}
export const SelectRecording = (props: IProps) => {
  const [memory] = useGlobal('memory');
  const { t, lang, onChange, inResource, required, tags } = props;
  const classes = useStyles();
  const ctx = useContext(PassageDetailContext);
  const { rowData, prettySegment } = ctx.state;
  const [resource, setResource] = useState('');
  const { localizedArtifactType } = useArtifactType();

  const handleUserChange = (e: any) => {
    console.log('handleUserChange', e);
    setResource(e.target.value);
    onChange && onChange(e.target.value);
  };
  const handleClick = (event: any, id: string) => {
    console.log('handleClick', id);
    setResource(id);
    onChange && onChange(id);
  };
  const RecordingHeader = () => {
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

  const RecordingInfo = (iprops: IInfoProps) => {
    const { row } = iprops;
    var version = '';
    var relatedMedia = related(row.mediafile, 'sourceMedia');
    if (relatedMedia) {
      var m = findRecord(memory, 'mediafile', relatedMedia) as MediaFile;
      version = m.attributes.versionNumber.toString();
    }
    return (
      <TableRow key={row.id} onClick={(event) => handleClick(event, row.id)}>
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

  useEffect(() => {
    if (inResource) setResource(inResource);
  }, [inResource]);

  const nameOnly = (n: string) => {
    const parts = n.split('.');
    return parts.length > 1 ? parts[0] : n;
  };

  const localTags = useMemo(() => {
    return tags.map((t) => localizedArtifactType(t));
  }, [tags, localizedArtifactType]);

  return (
    <TextField
      id="select-recording"
      className={classes.textField}
      select
      label={t.playItem}
      value={resource}
      onChange={handleUserChange}
      SelectProps={{
        MenuProps: {
          className: classes.menu,
        },
      }}
      variant="filled"
      required={required}
    >
      <TableContainer component={Paper}>
        <Table size="small" aria-label="a dense table">
          <TableHead>
            <RecordingHeader />
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
                <RecordingInfo row={r} />
              ))}
          </TableBody>
        </Table>
      </TableContainer>
    </TextField>
  );
};
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'selectRecording' }),
  lang: state.strings.lang,
});
export default connect(mapStateToProps)(SelectRecording) as any;
