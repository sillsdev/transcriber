import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableCellProps,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  styled,
} from '@mui/material';
import BigDialog from '../../hoc/BigDialog';
import { useContext, useEffect, useState, useMemo } from 'react';
import { ISelectRecordingStrings, IState } from '../../model';
import { IRow, PassageDetailContext } from '../../context/PassageDetailContext';
import { ArtifactTypeSlug, useArtifactType } from '../../crud';
import { dateOrTime, prettySegment, removeExtension } from '../../utils';
import { connect } from 'react-redux';
import { ItemDescription } from '../../control/MediaDescription';
import { selectRecordingSelector } from '../../selector';
import { shallowEqual, useSelector } from 'react-redux';

interface StyledCellProps extends TableCellProps {
  old?: boolean;
}
const StyledCell = styled(TableCell, {
  shouldForwardProp: (prop) => prop !== 'old',
})<StyledCellProps>(({ old, theme }) => ({
  ...(old && {
    color: theme.palette.secondary.light,
  }),
}));

interface IHeaderProps {
  t: ISelectRecordingStrings;
  showTopic: boolean;
  showType: boolean;
}

const RecordingHeader = ({ t, showTopic, showType }: IHeaderProps) => {
  return (
    <TableRow key={0}>
      {showType && <TableCell>{t.artifactType}</TableCell>}
      <TableCell align="right">{t.sourceVersion}</TableCell>
      <TableCell align="left">{t.sourceSegment}</TableCell>
      {showTopic && <TableCell align="left">{t.topic}</TableCell>}
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
  showTopic: boolean;
  showType: boolean;
}

const RecordingInfo = (iprops: IInfoProps) => {
  const { row, lang, onClick, latestVernacular, showTopic, showType } = iprops;

  return (
    <TableRow
      key={row.id}
      onClick={onClick(row.id, row.sourceVersion === latestVernacular)}
    >
      {showType && (
        <TableCell component="th" scope="row">
          {row.artifactType}
        </TableCell>
      )}
      <StyledCell align="right" old={row.sourceVersion !== latestVernacular}>
        {row.sourceVersion}
      </StyledCell>
      <TableCell align="left">
        {prettySegment(row.mediafile.attributes?.sourceSegments || '')}
      </TableCell>
      {showTopic && (
        <TableCell align="left">{row.mediafile.attributes?.topic}</TableCell>
      )}
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
  const { lang, onChange, inItem, tags, latestVernacular } = props;
  const ctx = useContext(PassageDetailContext);
  const { rowData } = ctx.state;
  const [item, setItem] = useState('');
  const [chooser, setChooser] = useState(false);
  const { localizedArtifactType } = useArtifactType();
  const t: ISelectRecordingStrings = useSelector(
    selectRecordingSelector,
    shallowEqual
  );

  const showTopic = useMemo(() => {
    return (
      tags[0] !== ArtifactTypeSlug.WholeBackTranslation &&
      tags[0] !== ArtifactTypeSlug.PhraseBackTranslation
    );
  }, [tags]);

  const showType = useMemo(() => {
    return tags.length > 1;
  }, [tags]);

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
      <Box sx={{ display: 'flex', alignItems: 'center' }}>
        <Button id="select-recording" onClick={handleItem} variant="contained">
          {t.playItem}
        </Button>
        <ItemDescription
          mediafile={rowData.find((r) => r.id === item)?.mediafile}
        />
      </Box>
      {chooser && (
        <BigDialog title={'Select Item'} isOpen={chooser} onOpen={setChooser}>
          <TableContainer component={Paper}>
            <Table size="small" aria-label="a dense table">
              <TableHead>
                <RecordingHeader
                  t={t}
                  showTopic={showTopic}
                  showType={showType}
                />
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
                      showTopic={showTopic}
                      showType={showType}
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
  lang: state.strings.lang,
});
export default connect(mapStateToProps)(SelectRecording) as any;
