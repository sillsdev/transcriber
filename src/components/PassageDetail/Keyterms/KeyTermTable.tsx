import * as React from 'react';
import { styled } from '@mui/material/styles';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell, { tableCellClasses } from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import { Box, Grid, GridProps, IconButton } from '@mui/material';
import { elemOffset, generateUUID } from '../../../utils';
import { useSelector, shallowEqual } from 'react-redux';
import { IKeyTermsStrings, ISharedStrings } from '../../../model';
import { keyTermsSelector, sharedSelector } from '../../../selector';
import TargetWord from './TargetWordAdd';
import { useMediaUpload } from '../../../crud/useMediaUpload';
import { useArtifactType } from '../../../crud';
import { useKeyTermSave } from '../../../crud/useKeyTermSave';
import KeyTermChip from './KeyTermChip';
import { UnsavedContext } from '../../../context/UnsavedContext';
import {
  PassageDetailContext,
  PlayInPlayer,
} from '../../../context/PassageDetailContext';
import Confirm from '../../AlertDialog';
import MediaPlayer from '../../MediaPlayer';
import AddIcon from '@mui/icons-material/Add';
import { useCallback, useContext } from 'react';
import { useStepPermissions } from '../../../utils/useStepPermission';

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
  flexDirection: 'row',
  color: theme.palette.primary.dark,
  width: 'inherit',
  '& audio': {
    height: '32px',
  },
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
  const [confirm, setConfirm] = React.useState<string>();
  const [uploadSuccess, setUploadSuccess] = React.useState<
    boolean | undefined
  >();
  const { passage } = useContext(PassageDetailContext).state;
  const deleteId = React.useRef<string>();
  const [adding, setAdding] = React.useState<number[]>([]);
  const { saveCompleted } = React.useContext(UnsavedContext).state;
  const { canDoSectionStep } = useStepPermissions();
  const {
    setSelected,
    commentPlaying,
    setCommentPlaying,
    commentPlayId,
    handleCommentPlayEnd,
    handleCommentTogglePlay,
    currentstep,
    section,
  } = React.useContext(PassageDetailContext).state;
  const hasPermission = canDoSectionStep(currentstep, section);
  const t: IKeyTermsStrings = useSelector(keyTermsSelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  const reset = () => {
    setTargetText('');
    setCanSaveRecording(false);
    saveCompleted(`${rowRef.current?.index}`);
    rowRef.current = undefined;
  };

  const saveKeyTermTarget = useKeyTermSave({ cb: reset });

  const save = useCallback(
    async (mediaRemId: string) => {
      if (rowRef.current) {
        const { term, index } = rowRef.current;
        saveKeyTermTarget({
          term,
          termIndex: index,
          mediaRemId,
          target: targetText,
        });
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [targetText]
  );
  const afterUploadCb = async (mediaRemId: string) => {
    if (mediaRemId) await save(mediaRemId);
    else {
      saveCompleted(`${rowRef.current?.index}`, ts.NoSaveOffline);
    }
  };

  const { keyTermId } = useArtifactType();

  const uploadMedia = useMediaUpload({
    artifactId: keyTermId,
    passageId: passage.id,
    afterUploadCb,
    setUploadSuccess,
  });

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
      setSelected(mediaId, PlayInPlayer.no);
    }
  };

  const handlePlayEnd = () => {
    handleCommentPlayEnd();
    setMediaId(undefined);
  };

  const handleTogglePlay = () => {
    handleCommentTogglePlay();
  };

  const handleChipDelete = (chip: ITarget, source: string) => () => {
    if (chip.label) {
      setConfirm(
        t.chipDelete.replace('{0}', chip.label).replace('{1}', source)
      );
    } else {
      setConfirm(t.chipDeleteNoLabel.replace('{0}', source));
    }
    deleteId.current = chip.id;
  };

  const handleDeleteRejected = () => {
    setConfirm(undefined);
    deleteId.current = undefined;
  };

  const handleDeleteConfirmed = () => {
    if (targetDelete && deleteId.current) targetDelete(deleteId.current);
    handleDeleteRejected();
  };

  const handleEnableAdd = (id: number) => () => {
    setAdding(adding.concat(id));
  };

  const getFilename = (row: IKeyTermRow) => {
    const uuid = generateUUID();
    return `${row.fileName}-${row.target.length}-${uuid.slice(0, 4)}`;
  };

  const onOk = (row: IKeyTermRow) => {
    rowRef.current = row;
    // If we have a recording, save after upload
    if (!canSaveRecording) {
      save(''); // save without recording
    }
  };

  const onCancel = () => {
    reset();
  };

  const onTextChange = (text: string, row: IKeyTermRow) => {
    rowRef.current = text ? row : undefined;
    setTargetText(text);
  };

  const onSetRecordRow = (row: IKeyTermRow | undefined) => {
    if (row) rowRef.current = row;
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
          <TableRow key={'head'}>
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
                    <Box
                      sx={{
                        display: 'flex',
                        flexDirection: 'row',
                        alignItems: 'center',
                        width:
                          commentPlayId &&
                          mediaId === commentPlayId &&
                          t.mediaId === mediaId
                            ? 'inherit'
                            : undefined,
                      }}
                      key={t.id}
                    >
                      <KeyTermChip
                        label={t.label}
                        playerOpen={Boolean(
                          commentPlayId &&
                            mediaId === commentPlayId &&
                            t.mediaId === mediaId
                        )}
                        onPlay={
                          t.mediaId ? handleChipPlay(t.mediaId) : undefined
                        }
                        onClick={
                          hasPermission ? handleChipClick(t.label) : undefined
                        }
                        onDelete={
                          hasPermission
                            ? handleChipDelete(t, row.source)
                            : undefined
                        }
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
                              onCancel={handlePlayEnd}
                              onTogglePlay={handleTogglePlay}
                              controls={mediaId === commentPlayId}
                              sx={{ mb: 1 }}
                            />
                          </GridContainerCol>
                        )}
                    </Box>
                  ))}
                  {row.target.length > 0 &&
                  adding.indexOf(row.index) === -1 &&
                  hasPermission ? (
                    <IconButton
                      sx={{ height: '24px' }}
                      aria-label="add another translation"
                      onClick={handleEnableAdd(row.index)}
                    >
                      <AddIcon fontSize="small" />
                    </IconButton>
                  ) : !rowRef.current || rowRef.current.index === row.index ? (
                    <TargetWord
                      toolId={`${row.index}`}
                      fileName={getFilename(row)}
                      uploadMethod={uploadMedia}
                      uploadSuccess={uploadSuccess}
                      row={row}
                      onOk={onOk}
                      onCancel={onCancel}
                      cancelOnlyIfChanged
                      setCanSaveRecording={setCanSaveRecording}
                      onTextChange={hasPermission ? onTextChange : undefined}
                      onSetRecordRow={onSetRecordRow}
                    />
                  ) : (
                    <></>
                  )}
                </Grid>
              </StyledTableCell>
            </StyledTableRow>
          ))}
        </TableBody>
      </Table>
      {confirm && (
        <Confirm
          text={confirm}
          yesResponse={handleDeleteConfirmed}
          noResponse={handleDeleteRejected}
        />
      )}
    </TableContainer>
  );
}
