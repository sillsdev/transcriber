import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
} from '@material-ui/core';
import BigDialog from '../../hoc/BigDialog';
import { useContext, useEffect, useState, useMemo } from 'react';
import { ISelectRecordingStrings, IState } from '../../model';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { IRow, PassageDetailContext } from '../../context/PassageDetailContext';
import { useArtifactType } from '../../crud';
import { dateOrTime, prettySegment, removeExtension } from '../../utils';
import { connect } from 'react-redux';
import { localStrings } from '../../selector';
import { ItemDescription } from '../../control/MediaDescription';

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
    version: {},
    oldVersion: {
      color: theme.palette.secondary.light,
    },
  })
);

const RecordingHeader = ({ t }: { t: ISelectRecordingStrings }) => {
  return (
    <TableRow key={0}>
      <TableCell>{t.artifactType}</TableCell>
      <TableCell align="right">{t.sourceVersion}</TableCell>
      <TableCell align="left">{t.sourceSegment}</TableCell>
      <TableCell align="left">{t.topic}</TableCell>
      <TableCell align="left">{t.created}</TableCell>
      <TableCell align="left">{t.speaker}</TableCell>
      <TableCell align="left">{t.filename}</TableCell>
    </TableRow>
  );
};

interface IInfoProps {
  row: IRow;
  lang: string;
  onClick: (id: string, latest: boolean) => () => void;
  latestVernacular: number;
}

const RecordingInfo = (iprops: IInfoProps) => {
  const { row, lang, onClick, latestVernacular } = iprops;
  const classes = useStyles();

  return (
    <TableRow
      key={row.id}
      onClick={onClick(row.id, row.sourceVersion === latestVernacular)}
    >
      <TableCell component="th" scope="row">
        {row.artifactType}
      </TableCell>
      <TableCell
        align="right"
        className={
          row.sourceVersion !== latestVernacular
            ? classes.oldVersion
            : classes.version
        }
      >
        {row.sourceVersion}
      </TableCell>
      <TableCell align="left">
        {prettySegment(row.mediafile.attributes?.sourceSegments || '')}
      </TableCell>
      <TableCell align="left">{row.mediafile.attributes?.topic}</TableCell>
      <TableCell align="left">
        {dateOrTime(row.mediafile.attributes?.dateCreated, lang)}
      </TableCell>
      <TableCell align="left">
        {row.mediafile.attributes?.performedBy}
      </TableCell>
      <TableCell align="left">
        {removeExtension(row.artifactName).name}
      </TableCell>
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
  onChange?: (resource: string, latest: boolean) => void;
  required?: boolean;
  tags: string[];
  latestVernacular: number;
}
export const SelectRecording = (props: IProps) => {
  const { t, lang, onChange, inItem, tags, latestVernacular } = props;
  const classes = useStyles();
  const ctx = useContext(PassageDetailContext);
  const { rowData } = ctx.state;
  const [item, setItem] = useState('');
  const [chooser, setChooser] = useState(false);
  const { localizedArtifactType } = useArtifactType();

  const handleClick = (id: string, latest: boolean) => () => {
    setItem(id);
    onChange && onChange(id, latest);
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
        <Button id="select-recording" onClick={handleItem} variant="contained">
          {t.playItem}
        </Button>
        <ItemDescription
          mediafile={rowData.find((r) => r.id === item)?.mediafile}
        />
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
                      : i.sourceVersion === j.sourceVersion
                      ? i.artifactName <= j.artifactName
                        ? -1
                        : 1
                      : j.sourceVersion - i.sourceVersion
                  )
                  .map((r) => (
                    <RecordingInfo
                      key={r.id}
                      row={r}
                      lang={lang}
                      onClick={handleClick}
                      latestVernacular={latestVernacular}
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
