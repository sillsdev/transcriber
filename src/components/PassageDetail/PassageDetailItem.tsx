import { shallowEqual } from 'react-redux';
import { ICommunityStrings, ISharedStrings, MediaFileD } from '../../model';
import {
  Button,
  debounce,
  FormControlLabel,
  Grid,
  IconButton,
  Paper,
  Radio,
  RadioGroup,
  TextField,
  Typography,
  Box,
  SxProps,
  styled,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import {
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ArtifactTypeSlug,
  IRegionParams,
  related,
  useArtifactType,
  useFetchMediaUrl,
  useOrgDefaults,
  useRole,
} from '../../crud';
import usePassageDetailContext from '../../context/usePassageDetailContext';
import Memory from '@orbit/memory';
import { AlertSeverity, useSnackBar } from '../../hoc/SnackBar';
import { getSegments, NamedRegions } from '../../utils/namedSegments';
import styledHtml from 'styled-components';
import {
  default as SplitPaneBar,
  Pane as PaneBar,
  PaneProps,
  SplitPaneProps,
} from 'react-split-pane';
import PassageDetailPlayer, { SaveSegments } from './PassageDetailPlayer';
import DiscussionList from '../Discussions/DiscussionList';
import MediaPlayer from '../MediaPlayer';
import MediaRecord from '../MediaRecord';
import SelectRecording from './SelectRecording';
import { useGlobal } from 'reactn';
import { UnsavedContext } from '../../context/UnsavedContext';
import Confirm from '../AlertDialog';
import Uploader from '../Uploader';
import AddIcon from '@mui/icons-material/LibraryAddOutlined';
import { GrowingSpacer, LightTooltip, PriButton } from '../../control';
import { useSelector } from 'react-redux';
import { communitySelector, sharedSelector } from '../../selector';
import { passageDefaultFilename } from '../../utils/passageDefaultFilename';
import PassageDetailChooser from './PassageDetailChooser';
import ArtifactStatus from '../ArtifactStatus';
import { useOrbitData } from '../../hoc/useOrbitData';

export const btDefaultSegParams = {
  silenceThreshold: 0.004,
  timeThreshold: 0.12,
  segLenThreshold: 4.5,
};

const PlayerRow = styled('div')(() => ({
  width: '100%',
  '& audio': {
    display: 'flex',
    width: 'inherit',
  },
  display: 'flex',
}));

const paperProps = { p: 2, m: 'auto', width: `calc(100% - 32px)` } as SxProps;
const rowProp = { display: 'flex' };
const buttonProp = { mx: 1 } as SxProps;
const ctlProps = { m: 1, pb: 2 } as SxProps;
const statusProps = {
  mr: 2,
  alignSelf: 'center',
  display: 'block',
  gutterBottom: 'true',
} as SxProps;

const Wrapper = styledHtml.div`
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

const SplitPane = (props: SplitPaneProps & PropsWithChildren) => {
  return <SplitPaneBar {...props} />;
};

const Pane = (props: PaneProps & PropsWithChildren) => {
  return <PaneBar {...props} className={props.className || 'pane'} />;
};

interface IProps {
  ready?: () => boolean;
  width: number;
  slugs: ArtifactTypeSlug[];
  segments: NamedRegions | undefined;
  showTopic: boolean;
}

export function PassageDetailItem(props: IProps) {
  const { width, slugs, segments, showTopic } = props;
  const mediafiles = useOrbitData<MediaFileD[]>('mediafile');
  const oneTryOnly = slugs.includes(ArtifactTypeSlug.WholeBackTranslation);
  const t: ICommunityStrings = useSelector(communitySelector, shallowEqual);
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const [reporter] = useGlobal('errorReporter');
  const [organization] = useGlobal('organization');
  const [plan] = useGlobal('plan');
  const { fetchMediaUrl, mediaState } = useFetchMediaUrl(reporter);
  const [statusText, setStatusText] = useState('');
  const [canSave, setCanSave] = useState(false);
  const [defaultFilename, setDefaultFileName] = useState('');
  const [coordinator] = useGlobal('coordinator');
  const [offline] = useGlobal('offline');
  const memory = coordinator.getSource('memory') as Memory;
  const [speaker, setSpeaker] = useState('');
  const [topic, setTopic] = useState('');
  const [importList, setImportList] = useState<File[]>();
  const [uploadVisible, setUploadVisible] = useState(false);
  const [resetMedia, setResetMedia] = useState(false);
  const [confirm, setConfirm] = useState('');
  const { userIsAdmin } = useRole();
  const {
    passage,
    sharedResource,
    playerMediafile,
    discussionSize,
    setDiscussionSize,
    playerSize,
    setPlayerSize,
    rowData,
    currentSegment,
    currentSegmentIndex,
    getCurrentSegment,
    setCommentPlaying,
    playItem,
    setPlayItem,
    itemPlaying,
    setItemPlaying,
    chooserSize,
    handleItemTogglePlay,
    handleItemPlayEnd,
    setRecording,
  } = usePassageDetailContext();
  const { toolChanged, startSave, saveCompleted, saveRequested } =
    useContext(UnsavedContext).state;

  const { getTypeId, localizedArtifactType } = useArtifactType();
  const { showMessage } = useSnackBar();
  const [recordType, setRecordType] = useState<ArtifactTypeSlug>(slugs[0]);
  const [currentVersion, setCurrentVersion] = useState(1);
  const [segString, setSegString] = useState('{}');
  const [verses, setVerses] = useState('');
  const cancelled = useRef(false);
  const { getOrgDefault, setOrgDefault, canSetOrgDefault } = useOrgDefaults();
  const [segParams, setSegParams] = useState<IRegionParams>(btDefaultSegParams);
  const toolId = 'RecordArtifactTool';

  const mediafileId = useMemo(() => {
    return playerMediafile?.id ?? '';
  }, [playerMediafile]);
  useEffect(() => {
    if (segments) {
      var def = getOrgDefault(segments);
      if (def) setSegParams(def);
      else setSegParams(btDefaultSegParams);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [organization]);

  const handleSplitSize = debounce((e: number) => {
    setDiscussionSize({ width: width - e, height: discussionSize.height });
  }, 50);

  const handleHorizonalSplitSize = debounce((e: number) => {
    setPlayerSize(e + 20);
  }, 50);

  useEffect(() => {
    if (!slugs.find((s) => s === recordType)) setRecordType(slugs[0]);
    setSpeaker('');
  }, [slugs, recordType]);

  useEffect(() => {
    toolChanged(toolId, canSave);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canSave]);

  useEffect(() => {
    if (mediafileId !== mediaState.id) fetchMediaUrl({ id: mediafileId });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediafileId, mediaState.id]);

  const hasBtRecordings = useMemo(() => {
    const mediaRec = mediafiles.find((m) => m.id === mediafileId);
    const btType = localizedArtifactType(
      ArtifactTypeSlug.PhraseBackTranslation
    );
    const version = mediaRec?.attributes.versionNumber;
    return rowData.some(
      (r) => r.artifactType === btType && r.sourceVersion === version
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rowData, mediafileId, mediafiles]);

  useEffect(() => {
    const mediaRec = mediafiles.find((m) => m.id === mediafileId);
    const defaultSegments = mediaRec?.attributes?.segments ?? '{}';
    const newSegString = getSegments(
      NamedRegions.BackTranslation,
      defaultSegments
    );
    if (segString !== newSegString) {
      setSegString(newSegString);
      if (hasBtRecordings)
        showMessage(t.segmentsChanged, AlertSeverity.Warning);
    }
    setVerses(getSegments(NamedRegions.Verse, defaultSegments));
    setCurrentVersion(mediaRec?.attributes?.versionNumber || 0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mediafileId, mediafiles, hasBtRecordings]);

  const recordTypeId = useMemo(
    () => getTypeId(recordType),
    [recordType, getTypeId]
  );

  useEffect(() => {
    var mediaRec = rowData.filter(
      (r) => related(r.mediafile, 'artifactType') === recordTypeId
    );
    var postfix =
      recordType +
      (mediaRec.length + 1).toString() +
      '_v' +
      currentVersion.toString();
    if (currentSegmentIndex > 0)
      postfix += 's' + currentSegmentIndex.toString();
    setDefaultFileName(
      passageDefaultFilename(
        passage,
        plan,
        memory,
        recordTypeId,
        offline,
        postfix
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    memory,
    passage,
    rowData,
    recordType,
    currentSegmentIndex,
    currentVersion,
  ]);

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
    //latest isn't used anymore but might be useful...so leave it
    setPlayItem(id);
    setItemPlaying(true);
    setCommentPlaying(false);
  };

  const handleDelete = (id: string) => () => {
    setConfirm(id);
  };

  const handleDeleteConfirmed = () => {
    memory
      .update((t) => t.removeRecord({ type: 'mediafile', id: confirm }))
      .finally(() => {
        setConfirm('');
        setPlayItem('');
      });
  };
  const handleDeleteRefused = () => {
    setConfirm('');
  };

  const onRecordingOrPlaying = (doingsomething: boolean) => {
    setRecording(doingsomething);
  };
  const onSegmentParamChange = (
    params: IRegionParams,
    teamDefault: boolean
  ) => {
    setSegParams(params);
    if (teamDefault && segments) setOrgDefault(segments, params);
  };

  return (
    <div>
      <Paper sx={paperProps}>
        <div>
          <Wrapper>
            <SplitPane
              defaultSize={width - discussionSize.width}
              style={{ position: 'static' }}
              split="vertical"
              onChange={handleSplitSize}
            >
              <Pane>
                <SplitPane
                  split="horizontal"
                  defaultSize={playerSize}
                  minSize={150}
                  style={{ position: 'static' }}
                  onChange={handleHorizonalSplitSize}
                >
                  <Pane>
                    <PassageDetailChooser
                      width={width - discussionSize.width - 16}
                    />
                    <PassageDetailPlayer
                      allowSegment={segments}
                      allowAutoSegment={segments !== undefined}
                      saveSegments={
                        segments !== undefined
                          ? SaveSegments.showSaveButton
                          : undefined
                      }
                      defaultSegParams={segParams}
                      suggestedSegments={segString}
                      verses={verses}
                      canSetDefaultParams={canSetOrgDefault}
                      onSegmentParamChange={onSegmentParamChange}
                      chooserReduce={chooserSize}
                    />
                  </Pane>
                  {currentVersion !== 0 ? (
                    <Pane>
                      <Paper sx={paperProps}>
                        <Box sx={rowProp}>
                          <ArtifactStatus
                            recordType={recordType}
                            currentVersion={currentVersion}
                            rowData={rowData}
                            segments={segString}
                          />
                        </Box>
                        <Box sx={rowProp}>
                          <Button
                            sx={buttonProp}
                            id="pdRecordUpload"
                            onClick={handleUpload}
                            title={ts.uploadMediaSingular}
                          >
                            <AddIcon />
                            {ts.uploadMediaSingular}
                          </Button>
                          <GrowingSpacer />
                          {currentSegment && (
                            <TextField
                              sx={ctlProps}
                              id="segment"
                              value={currentSegment}
                              size={'small'}
                              label={t.segment}
                            />
                          )}
                        </Box>
                        <Box sx={rowProp}>
                          <Typography sx={statusProps}>{t.record}</Typography>
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
                          <GrowingSpacer />
                          {showTopic && (
                            <TextField
                              sx={ctlProps}
                              id="itemtopic"
                              label={t.topic}
                              value={topic}
                              fullWidth={true}
                              onChange={handleChangeTopic}
                            />
                          )}
                          <TextField
                            sx={ctlProps}
                            id="speaker"
                            label={t.speaker}
                            value={speaker}
                            onChange={handleChangeSpeaker}
                            fullWidth={true}
                          />
                        </Box>
                        <MediaRecord
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
                          oneTryOnly={oneTryOnly}
                        />
                        <Box sx={rowProp}>
                          <Typography variant="caption" sx={statusProps}>
                            {statusText}
                          </Typography>
                          <GrowingSpacer />
                          <PriButton
                            id="rec-save"
                            sx={buttonProp}
                            onClick={handleSave}
                            disabled={!canSave}
                          >
                            {ts.save}
                          </PriButton>
                        </Box>
                      </Paper>
                      <Paper sx={paperProps}>
                        <Box sx={rowProp}>
                          <Paper sx={paperProps}>
                            <Box
                              id="playselect"
                              sx={{
                                display: 'flex',
                                flexDirection: 'row',
                                pr: 4,
                                pb: 1,
                              }}
                            >
                              <SelectRecording
                                onChange={handleSelect}
                                tags={slugs}
                                latestVernacular={currentVersion}
                              />
                            </Box>
                            <PlayerRow id="rowplayer">
                              <MediaPlayer
                                srcMediaId={playItem}
                                requestPlay={itemPlaying}
                                onEnded={handleItemPlayEnd}
                                onTogglePlay={handleItemTogglePlay}
                                controls={true}
                              />
                              {playItem && userIsAdmin && (
                                <LightTooltip title={t.deleteItem}>
                                  <IconButton
                                    id="delete-recording"
                                    onClick={handleDelete(playItem)}
                                  >
                                    <DeleteIcon />
                                  </IconButton>
                                </LightTooltip>
                              )}
                            </PlayerRow>
                          </Paper>
                        </Box>
                      </Paper>
                    </Pane>
                  ) : (
                    <Pane>
                      <Paper sx={paperProps}>
                        <Typography variant="h2" align="center">
                          {ts.noAudio}
                        </Typography>
                      </Paper>
                    </Pane>
                  )}
                </SplitPane>
              </Pane>
              <Pane>
                <Grid item xs={12} sm container>
                  <Grid item container direction="column">
                    <DiscussionList />
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
        importList={importList}
        isOpen={uploadVisible}
        onOpen={handleUploadVisible}
        showMessage={showMessage}
        multiple={false}
        finish={afterUpload}
        cancelled={cancelled}
        passageId={related(sharedResource, 'passage') ?? passage.id}
        sourceSegments={JSON.stringify(getCurrentSegment())}
        sourceMediaId={mediafileId}
        artifactTypeId={recordTypeId}
        performedBy={speaker}
        topic={topic}
      />
    </div>
  );
}

export default PassageDetailItem;
