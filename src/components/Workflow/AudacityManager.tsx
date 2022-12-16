import React from 'react';
import { useGlobal } from 'reactn';
import moment from 'moment';
import { shallowEqual, useSelector } from 'react-redux';
import { IAudacityManagerStrings, MediaFile } from '../../model';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogActions,
  FormControl,
  TextField,
  Typography,
  styled,
  Grid,
  GridProps,
  Box,
  BoxProps,
} from '@mui/material';
import {
  useAudacityProjUpdate,
  useAudacityProjRead,
  useAudacityProjDelete,
  useAudProjName,
} from '../../crud';
import { useSnackBar } from '../../hoc/SnackBar';
import { debounce } from 'lodash';
import { RecordIdentity } from '@orbit/data';
import {
  launchAudacity,
  loadBlob,
  audPrefsName,
  setAudacityPref,
  execFolder,
} from '../../utils';
import { dataPath, PathType } from '../../utils';
import { extensions, mimes } from '.';
import SpeakerName from '../SpeakerName';
import { audacityManagerSelector } from '../../selector';

const ipc = (window as any)?.electron;
const path = require('path-browserify');

const StyledGrid = styled(Grid)<GridProps>(() => ({
  minWidth: '800px',
  '& .MuiAutocomplete-root': {
    paddingBottom: '20px',
    width: 'unset',
  },
}));

const ActionRow = styled(Box)<BoxProps>(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  padding: theme.spacing(2),
  marginLeft: theme.spacing(1),
  '& .MuiButton-root': {
    marginBottom: theme.spacing(2),
  },
}));

export interface IProps {
  item: number;
  passageId: RecordIdentity;
  mediaId: string;
  open: boolean;
  onClose: () => void;
  onImport: (i: number, list: File[]) => void;
  speaker?: string;
  onSpeaker?: (speaker: string) => void;
}

function AudacityManager(props: IProps) {
  const { passageId, mediaId, onClose, open } = props;
  const { item, onImport } = props;
  const { speaker, onSpeaker } = props;
  const [hasRights, setHasRight] = React.useState(!onSpeaker);
  const audUpdate = useAudacityProjUpdate();
  const audRead = useAudacityProjRead();
  const audDelete = useAudacityProjDelete();
  const [reporter] = useGlobal('errorReporter');
  const [exists, setExists] = React.useState(false);
  const [name, setName] = React.useState('');
  const [memory] = useGlobal('memory');
  const [changed] = useGlobal('changed');
  const { showMessage } = useSnackBar();
  const getProjName = useAudProjName();
  const t: IAudacityManagerStrings = useSelector(
    audacityManagerSelector,
    shallowEqual
  );

  const handleClose = () => {
    onClose();
  };

  const handleAudacityName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleBrowse = () => {
    ipc?.audacityOpen().then((fullName: string[]) => {
      if (fullName && fullName.length > 0) {
        setAudacityPref(fullName[0]);
        // setAudacityPref creates the folders needed for audacity export
        setName(fullName[0]);
      }
    });
  };

  const getMediaUrl = (mediaId: string) => {
    let mediaUrl = '';
    if (mediaId !== '') {
      const mediaRec = memory.cache.query((q) =>
        q.findRecord({ type: 'mediafile', id: mediaId })
      ) as MediaFile;
      mediaUrl = mediaRec?.attributes?.audioUrl || '';
    }
    return mediaUrl;
  };

  const getMediaUpdated = (mediaId: string) => {
    let mediaUpdated = '';
    if (mediaId !== '') {
      const mediaRec = memory.cache.query((q) =>
        q.findRecord({ type: 'mediafile', id: mediaId })
      ) as MediaFile;
      mediaUpdated = mediaRec?.attributes?.dateUpdated || '';
    }
    return mediaUpdated;
  };

  const handleCreate = async () => {
    const prefsName = await audPrefsName();
    if (!prefsName) {
      showMessage(t.installError);
      return;
    }

    let mediaName = '';
    if ((mediaId || '') !== '') {
      const url = getMediaUrl(mediaId);
      mediaName = dataPath(url, PathType.MEDIA);
      if (!(await ipc?.exists(mediaName))) {
        showMessage(t.checkDownload);
        return;
      }
    }
    if ((passageId.id || '') !== '') {
      const fullName = await getProjName(passageId);
      const beforeContent = await setAudacityPref(fullName);
      // setAudacityPref creates the folders needed for the copy below
      if (!(await ipc?.exists(fullName))) {
        if (Boolean(mediaName)) {
          let ext = mediaName.split('.').pop() || 'mp3';
          const mp3FullName = fullName
            .replace('aup3', 'io')
            .replace('.aup3', `.${ext}`);
          if (!(await ipc?.exists(mp3FullName))) {
            showMessage(t.loadingAudio);
            await ipc?.copyFile(mediaName, mp3FullName);
            const updated = new Date(getMediaUpdated(mediaId));
            await ipc?.times(mp3FullName, updated, updated);
          }
        }
        await ipc?.copyFile(
          path.join(await execFolder(), 'resources', 'new.aup3'),
          fullName
        );
      }
      setExists(true);
      setName(fullName);
      if (beforeContent && (await ipc?.isProcessRunning('audacity'))) {
        showMessage(t.closeAudacity);
        return;
      }

      launchAudacity(fullName, reporter);
    }
  };

  const handleOpen = async () => {
    if (changed) {
      showMessage(t.saveFirst);
      return;
    }
    const prefsName = await audPrefsName();
    if (!prefsName) {
      showMessage(t.installError);
      return;
    }
    const beforeContent = await setAudacityPref(name);
    if (beforeContent && (await ipc?.isProcessRunning('audacity'))) {
      showMessage(t.closeAudacity);
      return;
    }

    launchAudacity(name, reporter);
  };

  const handleRights = (hasRights: boolean) => setHasRight(hasRights);
  const handleSpeaker = (speaker: string) => {
    onSpeaker && onSpeaker(speaker);
  };

  const handleImport = async () => {
    if (name.indexOf('.aup3') === -1) {
      showMessage(t.badProjName);
      return;
    }
    const nameOnly = name.replace('.aup3', '').split(path.sep).pop();
    const nmLen = nameOnly?.length;
    const audioFolder = path.dirname(name.replace('aup3', 'io'));
    const result = (await ipc?.readDir(audioFolder)) as string[];
    let mp3FullName = '';
    let mime = '';
    let lastTime = 0;
    for (const audioName of result) {
      const ext = audioName.split('.').pop() || '';
      const extIdx = extensions.indexOf(ext);
      const fullName = path.join(audioFolder, audioName);
      const stat = await ipc?.statSync(fullName);
      if (
        moment(stat.mtime).isAfter(moment(lastTime)) &&
        extensions.indexOf(ext) >= 0 &&
        nameOnly === audioName.slice(0, nmLen)
      ) {
        lastTime = stat.mtime;
        mp3FullName = fullName;
        mime = mimes[extIdx];
      }
    }
    if (!Boolean(mp3FullName)) {
      showMessage(t.missingImport.replace('{0}', audioFolder));
      return;
    }
    // YYYY-MM-DDTHH:MM:SS (= 19 characters)
    if (
      moment(lastTime).toISOString().slice(0, 19) <=
      getMediaUpdated(mediaId).slice(0, 19)
    ) {
      showMessage(t.exportFirst);
      return;
    }
    const mp3Name = mp3FullName.split(path.sep).pop();
    if (!mp3Name) {
      showMessage(t.badProjPath);
      return;
    }

    const prefsName = await audPrefsName();
    if (!prefsName) {
      showMessage(t.installError);
      return;
    }

    loadBlob(mp3FullName, (url, b) => {
      if (b) {
        onImport(item, [new File([b], mp3Name as string, { type: mime })]);
        onClose();
      } else showMessage(url);
    });
  };

  const handleUnlink = () => {
    audDelete(passageId.id);
    setName('');
  };

  const nameUpdate = debounce(() => {
    audUpdate(passageId.id, name);
  }, 100);

  React.useEffect(() => {
    if (name === '' && (passageId?.id || '') !== '') {
      const audRec = audRead(passageId.id);
      if (audRec?.attributes?.audacityName) {
        setName(audRec?.attributes?.audacityName);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    (async () => {
      if (name) {
        setExists(await ipc?.exists(name));
        nameUpdate();
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [passageId, name]);

  return (
    <Dialog
      onClose={handleClose}
      aria-labelledby="manager-title"
      open={open}
      maxWidth="md"
      disableEnforceFocus
    >
      <DialogTitle id="manager-title">{t.title}</DialogTitle>
      <StyledGrid container>
        {exists && name !== '' ? (
          <Grid container justifyContent="center">
            <Grid item xs={8}>
              <FormControl>
                <TextField
                  id="audacity-project"
                  autoFocus
                  required
                  label={t.audacityProject}
                  sx={{ m: 2, minWidth: '500px' }}
                  value={name}
                  onChange={handleAudacityName}
                  helperText={exists || name === '' ? null : t.missingProject}
                />
              </FormControl>
            </Grid>
            <Grid item xs={4}>
              <ActionRow>
                <Button onClick={handleOpen} variant="outlined">
                  {t.open}
                </Button>
                <SpeakerName
                  name={speaker || ''}
                  onRights={handleRights}
                  onChange={handleSpeaker}
                />
                <Button
                  onClick={handleImport}
                  variant="outlined"
                  disabled={!hasRights}
                >
                  {t.import}
                </Button>
                <Button onClick={handleUnlink} variant="outlined">
                  {t.unlink}
                </Button>
                {/* <Button onClick={handleDelete}>Delete</Button> */}
              </ActionRow>
            </Grid>
          </Grid>
        ) : (
          <Grid container justifyContent="center">
            <Grid item xs={9}>
              <FormControl sx={{ m: 2 }}>
                <Typography>{t.tip}</Typography>
              </FormControl>
            </Grid>
            <Grid item xs={3}>
              <ActionRow>
                <Button onClick={handleCreate} variant="outlined">
                  {t.create}
                </Button>
                <Button onClick={handleBrowse} variant="outlined">
                  {t.browse}
                </Button>
              </ActionRow>
            </Grid>
          </Grid>
        )}
      </StyledGrid>
      <DialogActions>
        <Button onClick={handleClose} variant="contained" color="primary">
          {t.close}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default AudacityManager;
