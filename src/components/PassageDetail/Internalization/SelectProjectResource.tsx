import { useEffect, useState, useContext, useRef } from 'react';
import { useGlobal } from 'reactn';
import {
  MediaFileD,
  SectionResourceD,
  ISharedStrings,
  IPassageDetailArtifactsStrings,
} from '../../../model';
import {
  ListItemSecondaryAction,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import { PassageDetailContext } from '../../../context/PassageDetailContext';
import { useArtifactCategory, related, mediaFileName } from '../../../crud';
import {
  sharedSelector,
  passageDetailArtifactsSelector,
} from '../../../selector';
import { shallowEqual, useSelector } from 'react-redux';
import ShowIcon from '@mui/icons-material/Visibility';
import AudioIcon from '@mui/icons-material/Hearing';
import DeleteIcon from '@mui/icons-material/Delete';
import Confirm from '../../AlertDialog';
import { isVisual } from '../../../utils';
import { ActionRow, AltButton } from '../../../control';

interface IProps {
  onSelect?: (media: MediaFileD) => void;
  onOpen?: (open: boolean) => void;
}

export const SelectProjectResource = (props: IProps) => {
  const { onSelect, onOpen } = props;
  const [memory] = useGlobal('memory');
  const [complete, setComplete] = useGlobal('progress');
  const [isOffline] = useGlobal('offline');
  const [offlineOnly] = useGlobal('offlineOnly');
  const [resource, setResouce] = useState<MediaFileD[]>([]);
  const ctx = useContext(PassageDetailContext);
  const { getProjectResources } = ctx.state;
  const [confirm, setConfirm] = useState<MediaFileD | undefined>();
  const { localizedArtifactCategory, slugFromId } = useArtifactCategory();
  const t: IPassageDetailArtifactsStrings = useSelector(
    passageDetailArtifactsSelector,
    shallowEqual
  );
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const media = useRef<MediaFileD[]>();

  const handleSelect = (m: MediaFileD) => {
    onSelect && onSelect(m);
    onOpen && onOpen(false);
  };

  const handleClick = (m: MediaFileD) => () => handleSelect(m);

  const handleDelete = (m: MediaFileD) => () => {
    const mediafiles = memory.cache.query((q) =>
      q.findRecords('mediafile')
    ) as MediaFileD[];
    const affected = mediafiles.filter(
      (r) => related(r, 'sourceMedia') === m.id
    );
    media.current = affected;
    setConfirm(m);
  };
  const handleDeleteRefused = () => {
    setConfirm(undefined);
  };
  const handleDeleteAccepted = async () => {
    if (confirm && media.current) {
      const total = media.current.length + 1;
      let n = 0;
      const secResources = memory.cache.query((q) =>
        q.findRecords('sectionresource')
      ) as SectionResourceD[];
      for (let m of media.current) {
        const secRes = secResources.find(
          (r) => related(r, 'mediafile') === m.id
        );
        if (secRes) await memory.update((t) => t.removeRecord(secRes));
        await memory.update((t) => t.removeRecord(m));
        setComplete(Math.min((n * 100) / total, 100));
        n += 1;
      }
      await memory.update((t) => t.removeRecord(confirm));
      setComplete(0);
    }
    setConfirm(undefined);
  };

  const handleCancel = () => {
    if (complete === 0 || complete === 100) onOpen && onOpen(false);
  };

  useEffect(() => {
    getProjectResources().then((res) => {
      setResouce(res);
      if (res.length === 0) {
        onOpen && onOpen(false);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirm]);

  return (
    <div id="selectProjectResource">
      <List component="div">
        {resource.map((r, i) => (
          <ListItem button key={i} onClick={handleClick(r)} sx={{ m: 4 }}>
            <ListItemIcon>
              {isVisual(r) ? <ShowIcon /> : <AudioIcon />}
            </ListItemIcon>
            <ListItemText
              primary={r.attributes?.topic}
              secondary={mediaFileName(r)}
            />
            <ListItemSecondaryAction>
              <>
                {localizedArtifactCategory(
                  slugFromId(related(r, 'artifactCategory'))
                )}
                <IconButton
                  onClick={handleDelete(r)}
                  disabled={isOffline && !offlineOnly}
                >
                  <DeleteIcon />
                </IconButton>
              </>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <ActionRow>
        <AltButton
          id="proj-res-select-cancel"
          onClick={handleCancel}
          sx={{ m: 2 }}
        >
          {ts.cancel}
        </AltButton>
      </ActionRow>
      {confirm && (
        <Confirm
          text={ts.delete.replace(
            '{0}',
            (confirm.attributes.topic || mediaFileName(confirm)) +
              t.resourcesDeleted.replace(
                '{0}',
                media.current?.length.toString() || '0'
              )
          )}
          yesResponse={handleDeleteAccepted}
          noResponse={handleDeleteRefused}
        />
      )}
    </div>
  );
};

export default SelectProjectResource;
