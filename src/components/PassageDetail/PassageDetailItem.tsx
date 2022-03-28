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
  related,
  remoteIdNum,
  useArtifactType,
  useFetchMediaUrl,
} from '../../crud';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import * as actions from '../../store';
import { bindActionCreators } from 'redux';
import Memory from '@orbit/memory';
import { TransformBuilder } from '@orbit/data';
import { useSnackBar } from '../../hoc/SnackBar';
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
import Uploader from '../Uploader';
import AddIcon from '@material-ui/icons/LibraryAddOutlined';
import { LightTooltip } from '../StepEditor';

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
  segments: boolean;
  showTopic: boolean;
}

export function PassageDetailItem(props: IProps) {
  const { auth, t, ts, width, slugs, segments, showTopic, mediafiles } = props;
  const { pathname } = useLocation();
  const [view, setView] = useState('');
  const [reporter] = useGlobal('errorReporter');
  const [projRole] = useGlobal('projRole');
  const [offlineOnly] = useGlobal('offlineOnly');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const [statusText, setStatusText] = useState('');
  const [canSave, setCanSave] = useState(false);
  const [defaultFilename, setDefaultFileName] = useState('');
  const classes = useStyles();
  const [coordinator] = useGlobal('coordinator');
  const memory = coordinator.getSource('memory') as Memory;
  const [speaker, setSpeaker] = useState('');
  const [topic, setTopic] = useState('');
  const [importList, setImportList] = useState<File[]>();
  const [uploadVisible, setUploadVisible] = useState(false);
  const [playItemSourceIsLatest, setPlayItemSourceIsLatest] = useState(false);
  const [resetMedia, setResetMedia] = useState(false);
  const [confirm, setConfirm] = useState('');
  const {
    passage,
    mediafileId,
    discussionSize,
    setDiscussionSize,
    playerSize,
    setPlayerSize,
    rowData,
    currentSegment,
    currentSegmentIndex,
    getCurrentSegment,
    setPlaying,
    setCommentPlaying,
    playItem,
    setPlayItem,
    itemPlaying,
    setItemPlaying,
    handleItemTogglePlay,
    handleItemPlayEnd,
  } = usePassageDetailContext();
  const { toolChanged, toolsChanged, startSave, saveCompleted, saveRequested } =
    useContext(UnsavedContext).state;

  const { getTypeId, slugFromId, localizedArtifactType } = useArtifactType();
  const { showMessage } = useSnackBar();
  const [recordType, setRecordType] = useState<ArtifactTypeSlug>(slugs[0]);
  const [currentVersion, setCurrentVersion] = useState(1);
  const cancelled = useRef(false);

  const toolId = 'RecordArtifactTool';

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
    if (mediafileId !== mediaState.id) fetchMediaUrl({ id: mediafileId, auth });
    var mediaRec = findRecord(memory, 'mediafile', mediafileId) as MediaFile;
    setCurrentVersion(mediaRec?.attributes?.versionNumber || 0);
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
    tmp += recordType + (mediaRec.length + 1).toString();
    tmp += '_v' + currentVersion.toString();
    if (currentSegmentIndex > 0) tmp += 's' + currentSegmentIndex.toString();
    setDefaultFileName(cleanFileName(tmp));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [memory, passage, rowData, recordType, speaker, currentSegmentIndex]);

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

  const afterUpload = async (planId: string, mediaRemoteIds?: string[]) => {
    setStatusText('');
    setTopic('');
    saveCompleted(toolId);
    if (importList) {
      setImportList(undefined);
      setUploadVisible(false);
      setResetMedia(true);
    }
  };

  const handleUploadVisible = (v: boolean) => {
    setUploadVisible(v);
  };
  const handleUpload = () => {
    if (canSave) {
      showMessage(t.saveFirst);
      return;
    }
    setImportList(undefined);
    setUploadVisible(true);
  };
  //from recorder...send it on to uploader
  const uploadMedia = async (files: File[]) => {
    setImportList(files);
    setUploadVisible(true);
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
  const handleChangeTopic = (e: any) => {
    e.persist();
    setTopic(e.target.value);
  };
  const handleSelect = (id: string, latest: boolean) => {
    setPlayItem(id);
    setPlayItemSourceIsLatest(latest);
    setItemPlaying(false);
    setCommentPlaying(false);
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
  const playType = useMemo(() => {
    var pi = mediafiles.find((m) => m.id === playItem);
    if (pi) return slugFromId(related(pi, 'artifactType'));
    return '';
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playItem, mediafiles]);

  const onRecordingOrPlaying = (doingsomething: boolean) => {
    if (doingsomething) {
      setPlaying(false); //stop the vernacular
      setItemPlaying(false);
      setCommentPlaying(false);
    }
  };

  if (view) return <StickyRedirect to={`${view}/${playType}/${playItemId}`} />;

  return (
    <div>
      <Paper className={classes.paper}>
        <div>
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
                    <PassageDetailPlayer
                      allowSegment={segments}
                      saveSegments={false} //todo
                    />
                  </Pane>
                  <Pane className={classes.pane}>
                    <Paper className={classes.paper}>
                      <div className={classes.row}>
                        <Button
                          className={classes.button}
                          id="pdRecordUpload"
                          onClick={handleUpload}
                          title={
                            !offlineOnly
                              ? ts.uploadMediaSingular
                              : ts.importMediaSingular
                          }
                        >
                          <AddIcon />
                          {!offlineOnly
                            ? ts.uploadMediaSingular
                            : ts.importMediaSingular}
                        </Button>
                        <div className={classes.grow}>{'\u00A0'}</div>
                        {currentSegment && (
                          <TextField
                            className={classes.formControl}
                            id="segment"
                            value={currentSegment}
                            size={'small'}
                            label={t.segment}
                          />
                        )}
                      </div>
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
                                key={s}
                                id={s}
                                value={s}
                                control={<Radio />}
                                label={localizedArtifactType(s)}
                              />
                            ))}
                          </RadioGroup>
                        )}
                        <div className={classes.grow}>{'\u00A0'}</div>
                        {showTopic && (
                          <TextField
                            className={classes.formControl}
                            id="itemtopic"
                            label={t.topic}
                            value={topic}
                            fullWidth={true}
                            onChange={handleChangeTopic}
                          />
                        )}
                        <TextField
                          className={classes.formControl}
                          id="speaker"
                          label={t.speaker}
                          value={speaker}
                          onChange={handleChangeSpeaker}
                          fullWidth={true}
                        />
                      </div>
                      <MediaRecord
                        id="mediarecord"
                        toolId={toolId}
                        uploadMethod={uploadMedia}
                        defaultFilename={defaultFilename}
                        allowWave={false}
                        showFilename={false}
                        setCanSave={handleSetCanSave}
                        setStatusText={setStatusText}
                        doReset={resetMedia}
                        setDoReset={setResetMedia}
                        size={200}
                        onRecording={onRecordingOrPlaying}
                        onPlayStatus={onRecordingOrPlaying}
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
                          <div id="playselect" className={classes.playSelect}>
                            <SelectRecording
                              onChange={handleSelect}
                              ts={ts}
                              tags={slugs}
                              latestVernacular={currentVersion}
                            />
                          </div>
                          <div id="rowplayer" className={classes.playerRow}>
                            <MediaPlayer
                              auth={auth}
                              srcMediaId={playItem}
                              requestPlay={itemPlaying}
                              onEnded={handleItemPlayEnd}
                              onTogglePlay={handleItemTogglePlay}
                              controls={true}
                            />
                            {playItem && playItemSourceIsLatest && (
                              <LightTooltip title={t.transcribe}>
                                <IconButton
                                  id="load-transcriber"
                                  onClick={handleTranscribe}
                                >
                                  <TranscribeIcon />
                                </IconButton>
                              </LightTooltip>
                            )}
                            {playItem && projRole === RoleNames.Admin && (
                              <LightTooltip title={t.deleteItem}>
                                <IconButton
                                  id="delete-recording"
                                  onClick={handleDelete(playItem)}
                                >
                                  <DeleteIcon />
                                </IconButton>
                              </LightTooltip>
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
          {confirm && (
            <Confirm
              text={t.deleteItem}
              yesResponse={handleDeleteConfirmed}
              noResponse={handleDeleteRefused}
            />
          )}
        </div>
      </Paper>
      <Uploader
        noBusy={true}
        recordAudio={false}
        auth={auth}
        importList={importList}
        isOpen={uploadVisible}
        onOpen={handleUploadVisible}
        showMessage={showMessage}
        multiple={false}
        finish={afterUpload}
        cancelled={cancelled}
        passageId={passage.id}
        sourceSegments={JSON.stringify(getCurrentSegment())}
        sourceMediaId={mediafileId}
        artifactTypeId={recordTypeId}
        performedBy={speaker}
        topic={topic}
      />
    </div>
  );
}

const mapStateToProps = (state: IState): IStateProps => ({
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
  connect(mapStateToProps, mapDispatchToProps)(PassageDetailItem) as any
) as any;
