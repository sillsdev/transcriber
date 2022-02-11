import { connect } from 'react-redux';
import {
  ICommunityStrings,
  ISharedStrings,
  IState,
  MediaFile,
  RoleNames,
} from '../../model';
import { useLocation } from 'react-router-dom';
import localStrings from '../../selector/localize';
import {
  Button,
  createStyles,
  debounce,
  FormControlLabel,
  Grid,
  IconButton,
  makeStyles,
  Paper,
  Radio,
  RadioGroup,
  TextField,
  Theme,
  Typography,
} from '@material-ui/core';
import TranscribeIcon from '../../control/TranscribeIcon';
import DeleteIcon from '@material-ui/icons/Delete';
import Auth from '../../auth/Auth';
import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArtifactTypeSlug,
  findRecord,
  pullPlanMedia,
  related,
  remoteIdGuid,
  remoteIdNum,
  useArtifactType,
  useFetchMediaUrl,
  useOfflnMediafileCreate,
} from '../../crud';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import * as actions from '../../store';
import { bindActionCreators } from 'redux';
import Memory from '@orbit/memory';
import JSONAPISource from '@orbit/jsonapi';
import { TransformBuilder } from '@orbit/data';
import { useSnackBar } from '../../hoc/SnackBar';
import { useMediaAttach } from '../../crud/useMediaAttach';
import { withData } from '../../mods/react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { cleanFileName } from '../../utils';
import styled from 'styled-components';
import SplitPane, { Pane } from 'react-split-pane';
import PassageDetailPlayer from './PassageDetailPlayer';
import DiscussionList from '../Discussions/DiscussionList';
import MediaPlayer from '../MediaPlayer';
import MediaRecord from '../MediaRecord';
import SelectRecording from './SelectRecording';
import { useGlobal } from 'reactn';
import { UnsavedContext } from '../../context/UnsavedContext';
import { LocalKey, localUserKey } from '../../utils';
import StickyRedirect from '../StickyRedirect';
import Confirm from '../AlertDialog';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    root: {},
    button: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
    },
    status: {
      marginRight: theme.spacing(2),
      alignSelf: 'center',
      display: 'block',
      gutterBottom: 'true',
    },
    unsupported: {
      color: theme.palette.secondary.light,
    },
    paper: {
      padding: theme.spacing(2),
      margin: 'auto',
      width: `calc(100% - 32px)`,
      '& audio': {
        display: 'flex',
        width: 'inherit',
      },
    },
    playSelect: {
      paddingRight: theme.spacing(4),
      paddingBottom: theme.spacing(1),
    },
    pane: {},
    formControl: {
      margin: theme.spacing(1),
      paddingBottom: theme.spacing(2),
    },
    playStatus: {
      margin: theme.spacing(1),
    },
    row: {
      display: 'flex',
    },
    grow: { flexGrow: 1 },
    playerRow: { width: '100%', display: 'flex' },
  })
);
const Wrapper = styled.div`
  .Resizer {
    -moz-box-sizing: border-box;
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    background: #000;
    opacity: 0.2;
    z-index: 1;
    -moz-background-clip: padding;
    -webkit-background-clip: padding;
    background-clip: padding-box;
  }

  .Resizer:hover {
    -webkit-transition: all 2s ease;
    transition: all 2s ease;
  }

  .Resizer.horizontal {
    height: 11px;
    margin: -5px 0;
    border-top: 5px solid rgba(255, 255, 255, 0);
    border-bottom: 5px solid rgba(255, 255, 255, 0);
    cursor: row-resize;
    width: 100%;
  }

  .Resizer.horizontal:hover {
    border-top: 5px solid rgba(0, 0, 0, 0.5);
    border-bottom: 5px solid rgba(0, 0, 0, 0.5);
  }

  .Resizer.vertical {
    width: 11px;
    margin: 0 -5px;
    border-left: 5px solid rgba(255, 255, 255, 0);
    border-right: 5px solid rgba(255, 255, 255, 0);
    cursor: col-resize;
  }

  .Resizer.vertical:hover {
    border-left: 5px solid rgba(0, 0, 0, 0.5);
    border-right: 5px solid rgba(0, 0, 0, 0.5);
  }
  .Pane1 {
    // background-color: blue;
    display: flex;
    min-height: 0;
  }
  .Pane2 {
    // background-color: red;
    display: flex;
    min-height: 0;
  }
`;
interface IStateProps {
  t: ICommunityStrings;
  ts: ISharedStrings;
  uploadError: string;
}
interface IDispatchProps {
  uploadFiles: typeof actions.uploadFiles;
  nextUpload: typeof actions.nextUpload;
  uploadComplete: typeof actions.uploadComplete;
  doOrbitError: typeof actions.doOrbitError;
}
interface IRecordProps {
  mediafiles: Array<MediaFile>;
}
interface IProps extends IRecordProps, IStateProps, IDispatchProps {
  auth: Auth;
  ready?: () => boolean;
  width: number;
  slugs: ArtifactTypeSlug[];
}

export function PassageDetailCommunity(props: IProps) {
  const { auth, t, ts, width, slugs } = props;
  const { uploadFiles, nextUpload, uploadComplete, doOrbitError } = props;
  const { pathname } = useLocation();
  const [view, setView] = useState('');
  const [reporter] = useGlobal('errorReporter');
  const [offline] = useGlobal('offline');
  const [plan] = useGlobal('plan');
  const [projRole] = useGlobal('projRole');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const { createMedia } = useOfflnMediafileCreate(doOrbitError);
  const [statusText, setStatusText] = useState('');
  const fileList = useRef<File[]>();
  const [canSave, setCanSave] = useState(false);
  const [defaultFilename, setDefaultFileName] = useState('');
  const classes = useStyles();
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator.getSource('memory') as Memory;
  const remote = coordinator.getSource('remote') as JSONAPISource;
  const [, setMediaRec] = useState<MediaFile>();
  const [speaker, setSpeaker] = useState('');
  const successCount = useRef(0);
  const mediaIdRef = useRef('');
  const [playItem, setPlayItem] = useState('');
  const [playing, setPlaying] = useState(false);
  const [resetMedia, setResetMedia] = useState(0);
  const [confirm, setConfirm] = useState('');
  const {
    passage,
    mediafileId,
    discussionSize,
    setDiscussionSize,
    playerSize,
    setPlayerSize,
    rowData,
  } = usePassageDetailContext();
  const { toolChanged, toolsChanged, startSave, saveCompleted, saveRequested } =
    useContext(UnsavedContext).state;
  const { getTypeId, localizedArtifactType } = useArtifactType();
  const { showMessage } = useSnackBar();
  const [attachPassage] = useMediaAttach({
    doOrbitError,
  });
  const [recordType, setRecordType] = useState<ArtifactTypeSlug>(slugs[0]);

  const toolId = 'CommunityTool';

  const handleSplitSize = debounce((e: number) => {
    setDiscussionSize(width - e);
  }, 50);

  const handleHorizonalSplitSize = debounce((e: number) => {
    setPlayerSize(e + 20);
  }, 50);

  useEffect(() => {
    toolChanged(toolId, canSave);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSave]);

  useEffect(() => {
    if (mediafileId !== mediaState.urlMediaId)
      fetchMediaUrl({ id: mediafileId, auth });
    setMediaRec(findRecord(memory, 'mediafile', mediafileId) as MediaFile);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediafileId]);

  const recordTypeId = useMemo(
    () => getTypeId(recordType),
    [recordType, getTypeId]
  );

  useEffect(() => {
    var tmp = (passage.attributes.book || '') + passage.attributes.reference;
    if (!tmp.length) tmp = passage.id.slice(0, 4);
    var mediaRec = rowData.filter(
      (r) => related(r.mediafile, 'artifactType') === recordTypeId
    );
    tmp += recordType + '_' + (mediaRec.length + 1).toString();
    if (speaker) tmp += '_' + speaker;
    setDefaultFileName(cleanFileName(tmp));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memory, passage, rowData, recordType, speaker]);

  useEffect(() => {
    if (saveRequested(toolId) && canSave) handleSave();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toolsChanged, canSave]);

  const handleSave = () => {
    //tell the media recorder to save
    if (!saveRequested(toolId)) {
      startSave(toolId);
    }
  };
  const finishMessage = () => {
    setTimeout(() => {
      if (fileList.current)
        showMessage(
          t.uploadComplete
            .replace('{0}', successCount.current.toString())
            .replace('{1}', fileList.current.length.toString())
        );
      uploadComplete();
      setResetMedia(resetMedia + 1);
    }, 1000);
  };
  const itemComplete = async (n: number, success: boolean, data?: any) => {
    if (success) successCount.current += 1;
    const uploadList = fileList.current;
    if (!uploadList) return; // This should never happen
    if (data?.stringId) {
      mediaIdRef.current = data?.stringId;
    } else if (success && data) {
      // offlineOnly
      await createMedia(
        data,
        1,
        uploadList[n].size,
        passage.id,
        data.artifactTypeId
      );
    }
    setStatusText('');
    if (!offline) {
      pullPlanMedia(plan, memory, remote).then(() => {
        var mediaId =
          remoteIdGuid('mediafile', mediaIdRef.current, memory.keyMap) ||
          mediaIdRef.current;
        attachPassage(
          passage.id,
          related(passage, 'section'),
          plan,
          mediaId
        ).then(() => {
          finishMessage();
          saveCompleted(toolId);
        });
      });
    } else {
      finishMessage();
      saveCompleted(toolId);
    }
  };
  const getPlanId = () => remoteIdNum('plan', plan, memory.keyMap) || plan;
  const getArtifactTypeId = () =>
    remoteIdNum('artifacttype', recordTypeId, memory.keyMap) || recordTypeId;
  const getPassageId = () =>
    remoteIdNum('passage', passage.id, memory.keyMap) || passage.id;
  const uploadMedia = async (files: File[]) => {
    uploadFiles(files);
    fileList.current = files;
    const mediaFile = {
      planId: getPlanId(),
      passageId: getPassageId(),
      versionNumber: 1,
      originalFile: files[0].name,
      contentType: files[0].type,
      artifactTypeId: getArtifactTypeId(),
      performedBy: speaker,
    } as any;
    nextUpload(mediaFile, files, 0, auth, offline, reporter, itemComplete);
  };
  const handleSetCanSave = (valid: boolean) => {
    if (valid !== canSave) {
      setCanSave(valid);
    }
  };
  const handleChangeType = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRecordType((event.target as HTMLInputElement).value as ArtifactTypeSlug);
  };
  const handleChangeSpeaker = (e: any) => {
    e.persist();
    setSpeaker(e.target.value);
  };
  const handleSelect = (id: string) => {
    setPlayItem(id);
    setPlaying(false);
  };
  const handleEnded = () => {
    setPlaying(false);
  };

  const handleDelete = (id: string) => () => {
    setConfirm(id);
  };

  const handleDeleteConfirmed = () => {
    memory
      .update((t: TransformBuilder) =>
        t.removeRecord({ type: 'mediafile', id: confirm })
      )
      .finally(() => {
        setConfirm('');
        setPlayItem('');
      });
  };
  const handleDeleteRefused = () => {
    setConfirm('');
  };

  const handleTranscribe = () => {
    localStorage.setItem(localUserKey(LocalKey.jumpBack), pathname);
    setView(pathname.replace('detail', 'work'));
  };

  const playItemId = useMemo(
    () => remoteIdNum('mediafile', playItem, memory.keyMap) || playItem,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playItem]
  );

  if (view)
    return <StickyRedirect to={`${view}/${recordType}/${playItemId}`} />;

  return (
    <div>
      <Paper className={classes.paper}>
        <>
          <Wrapper>
            <SplitPane
              defaultSize={width - discussionSize}
              style={{ position: 'static' }}
              split="vertical"
              onChange={handleSplitSize}
            >
              <Pane className={classes.pane}>
                <SplitPane
                  split="horizontal"
                  defaultSize={playerSize - 20}
                  minSize={150}
                  style={{ position: 'static' }}
                  onChange={handleHorizonalSplitSize}
                >
                  <Pane className={classes.pane}>
                    <PassageDetailPlayer />
                  </Pane>
                  <Pane className={classes.pane}>
                    <Paper className={classes.paper}>
                      <div className={classes.row}>
                        <Typography className={classes.status}>
                          {t.record}
                        </Typography>
                        {slugs.length > 1 && (
                          <RadioGroup
                            row={true}
                            id="filetype"
                            aria-label="filetype"
                            name="filetype"
                            value={recordType}
                            onChange={handleChangeType}
                          >
                            {slugs.map((s) => (
                              <FormControlLabel
                                id={s}
                                value={s}
                                control={<Radio />}
                                label={localizedArtifactType(s)}
                              />
                            ))}
                          </RadioGroup>
                        )}
                        <div className={classes.grow}>{'\u00A0'}</div>
                        <TextField
                          className={classes.formControl}
                          id="filename"
                          label={t.speaker}
                          value={speaker}
                          onChange={handleChangeSpeaker}
                          fullWidth={true}
                        />
                      </div>
                      <MediaRecord
                        toolId={toolId}
                        uploadMethod={uploadMedia}
                        defaultFilename={defaultFilename}
                        allowWave={false}
                        showFilename={false}
                        setCanSave={handleSetCanSave}
                        setStatusText={setStatusText}
                        doReset={resetMedia}
                        size={200}
                      />
                      <div className={classes.row}>
                        <Typography
                          variant="caption"
                          className={classes.status}
                        >
                          {statusText}
                        </Typography>
                        <div className={classes.grow}>{'\u00A0'}</div>
                        <Button
                          id="rec-save"
                          className={classes.button}
                          onClick={handleSave}
                          variant="contained"
                          color="primary"
                          disabled={!canSave}
                        >
                          {ts.save}
                        </Button>
                      </div>
                    </Paper>
                    <Paper className={classes.paper}>
                      <div className={classes.row}>
                        <Paper className={classes.paper}>
                          <div className={classes.playSelect}>
                            <SelectRecording
                              onChange={handleSelect}
                              ts={ts}
                              tags={slugs}
                            />
                          </div>
                          <div className={classes.playerRow}>
                            <MediaPlayer
                              auth={auth}
                              srcMediaId={playItem}
                              requestPlay={playing}
                              onEnded={handleEnded}
                              controls={true}
                            />
                            {playItem && (
                              <>
                                <IconButton onClick={handleTranscribe}>
                                  <TranscribeIcon />
                                </IconButton>
                                {projRole === RoleNames.Admin && (
                                  <IconButton onClick={handleDelete(playItem)}>
                                    <DeleteIcon />
                                  </IconButton>
                                )}
                              </>
                            )}
                          </div>
                        </Paper>
                      </div>
                    </Paper>
                  </Pane>
                </SplitPane>
              </Pane>
              <Pane className={classes.pane}>
                <Grid item xs={12} sm container>
                  <Grid item container direction="column">
                    <DiscussionList auth={auth} />
                  </Grid>
                </Grid>
              </Pane>
            </SplitPane>
          </Wrapper>
        </>
        {confirm && (
          <Confirm
            text={t.deleteItem}
            yesResponse={handleDeleteConfirmed}
            noResponse={handleDeleteRefused}
          />
        )}
      </Paper>
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
  uploadError: state.upload.errmsg,
  t: localStrings(state, { layout: 'community' }),
  ts: localStrings(state, { layout: 'shared' }),
});
const mapDispatchToProps = (dispatch: any): IDispatchProps => ({
  ...bindActionCreators(
    {
      uploadFiles: actions.uploadFiles,
      nextUpload: actions.nextUpload,
      uploadComplete: actions.uploadComplete,
      doOrbitError: actions.doOrbitError,
    },
    dispatch
  ),
});
const mapRecordsToProps = {
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
};
export default withData(mapRecordsToProps)(
  connect(mapStateToProps, mapDispatchToProps)(PassageDetailCommunity) as any
) as any;
