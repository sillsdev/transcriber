import * as React from 'react';
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Grid, GridProps } from '@mui/material';
import { elemOffset, generateUUID } from '../../utils';
import { useSelector, shallowEqual } from 'react-redux';
import { IKeyTermsStrings } from '../../model';
import { keyTermsSelector } from '../../selector';
import TargetWord from './TargetWordAdd';
import { useMediaUpload } from './useMediaUpload';
import { useArtifactType } from '../../crud';
import { useKeyTermSave } from '../../crud/useKeyTermSave';
import KeyTermChip from './KeyTermChip';
import { UnsavedContext } from '../../context/UnsavedContext';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import MediaPlayer from '../MediaPlayer';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  [`&.${tableCellClasses.head}`]: {
    backgroundColor: theme.palette.common.black,
    color: theme.palette.common.white,
    padding: `8px 16px`,
    overflowWrap: 'break-word',
    hyphens: 'manual',
  },
  [`&.${tableCellClasses.body}`]: {
    fontSize: 14,
    padding: `8px 16px`,
    paddingBottom: 0,
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.action.hover,
  },
  // hide last border
  '&:last-child td, &:last-child th': {
    border: 0,
  },
}));

const GridContainerCol = styled(Grid)<GridProps>(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  color: theme.palette.primary.dark,
}));

export interface ITarget {
  id: string;
  label: string;
  mediaId: string | undefined;
}

export interface IKeyTermRow {
  term: string;
  source: string;
  target: ITarget[];
  index: number;
  fileName: string;
}

interface IProps {
  rows: IKeyTermRow[];
  termClick?: (term: number) => void;
  chipClick?: (target: string) => void;
  targetDelete?: (id: string) => void;
}

export default function KeyTermTable({
  rows,
  termClick,
  chipClick,
  targetDelete,
}: IProps) {
  const bodyRef = React.useRef<HTMLTableSectionElement>(null);
  const [bodyHeight, setBodyHeight] = React.useState(window.innerHeight);
  const [targetText, setTargetText] = React.useState('');
  const rowRef = React.useRef<IKeyTermRow>();
  const [canSaveRecording, setCanSaveRecording] = React.useState(false);
  const [mediaId, setMediaId] = React.useState<string>();
  const { toolChanged } = React.useContext(UnsavedContext).state;
  const {
    setSelected,
    commentPlaying,
    setCommentPlaying,
    commentPlayId,
    handleCommentPlayEnd,
    handleCommentTogglePlay,
  } = React.useContext(PassageDetailContext).state;
  const t: IKeyTermsStrings = useSelector(keyTermsSelector, shallowEqual);

  const reset = () => {
    setTargetText('');
    setCanSaveRecording(false);
    toolChanged(`${rowRef.current?.index}`, false);
    rowRef.current = undefined;
  };
  const saveKeyTermTarget = useKeyTermSave({ cb: reset });
  const afterUploadCb = (mediaRemId: string) => {
    if (rowRef.current) {
      const { term, index } = rowRef.current;
      saveKeyTermTarget({
        term,
        termIndex: index,
        mediaRemId,
        target: targetText,
      });
    }
  };
  const { keyTermId } = useArtifactType();
  const uploadMedia = useMediaUpload({ artifactId: keyTermId, afterUploadCb });

  const handleTermClick = (term: number) => () => {
    termClick && termClick(term);
  };

  const handleChipClick = (target: string) => () => {
    chipClick && chipClick(target);
  };

  const handleChipPlay = (mediaId: string) => () => {
    setMediaId(mediaId);
    if (mediaId === commentPlayId) {
      setCommentPlaying(!commentPlaying);
    } else {
      setSelected(mediaId);
    }
  };

  const handlePlayEnd = () => {
    handleCommentPlayEnd();
    setMediaId(undefined);
  };

  const handleTogglePlay = () => {
    handleCommentTogglePlay();
  };

  const handleChipDelete = (id: string) => () => {
    targetDelete && targetDelete(id);
  };

  const getFilename = (row: IKeyTermRow) => {
    const uuid = generateUUID();
    return `${row.fileName}-${row.target.length}-${uuid.slice(0, 4)}`;
  };

  const onOk = (row: IKeyTermRow) => {
    rowRef.current = row;
    // If we have a recording, save after upload
    if (!canSaveRecording) {
      afterUploadCb(''); // save without recording
    }
  };

  const onCancel = () => {
    reset();
  };

  const onTextChange = (text: string) => {
    setTargetText(text);
  };

  React.useEffect(() => {
    const winHeight = window.innerHeight;
    if (bodyRef.current) {
      const { y } = elemOffset(bodyRef.current);
      const newHeight = winHeight - y;
      setBodyHeight(newHeight);
    }
  }, [rows]);

  return (
    <TableContainer component={Paper} style={{ height: `${bodyHeight}px` }}>
      <Table stickyHeader sx={{ minWidth: 400 }} aria-label="customized table">
        <TableHead>
          <TableRow>
            <StyledTableCell>{t.source}</StyledTableCell>
            <StyledTableCell>{t.translation}</StyledTableCell>
          </TableRow>
        </TableHead>
        <TableBody ref={bodyRef}>
          {rows.map((row) => (
            <StyledTableRow key={row.term}>
              <StyledTableCell
                component="th"
                scope="row"
                sx={{ cursor: 'pointer', whiteSpace: 'break-spaces' }}
                onClick={handleTermClick(row.index)}
              >
                {row.source}
              </StyledTableCell>
              <StyledTableCell sx={{ whiteSpace: 'break-spaces' }}>
                <Grid container>
                  {row.target.map((t) => (
                    <>
                      <KeyTermChip
                        label={t.label}
                        onPlay={
                          t.mediaId ? handleChipPlay(t.mediaId) : undefined
                        }
                        onClick={handleChipClick(t.label)}
                        onDelete={handleChipDelete(t.id)}
                      />
                      {commentPlayId &&
                        mediaId === commentPlayId &&
                        t.mediaId === mediaId && (
                          <GridContainerCol item id="keyTermPlayer">
                            <MediaPlayer
                              srcMediaId={
                                mediaId === commentPlayId ? commentPlayId : ''
                              }
                              requestPlay={commentPlaying}
                              onEnded={handlePlayEnd}
                              onTogglePlay={handleTogglePlay}
                              controls={mediaId === commentPlayId}
                            />
                          </GridContainerCol>
                        )}
                    </>
                  ))}
                  <TargetWord
                    toolId={`${row.index}`}
                    fileName={getFilename(row)}
                    uploadMethod={uploadMedia}
                    row={row}
                    onOk={onOk}
                    onCancel={onCancel}
                    cancelOnlyIfChanged
                    setCanSaveRecording={setCanSaveRecording}
                    onTextChange={onTextChange}
                  />
                </Grid>
              </StyledTableCell>
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
