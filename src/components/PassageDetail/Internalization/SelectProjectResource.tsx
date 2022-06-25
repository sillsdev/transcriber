import { useEffect, useState, useContext, useRef } from 'react';
import { useGlobal } from 'reactn';
import {
  MediaFile,
  SectionResource,
  ISharedStrings,
  IPassageDetailArtifactsStrings,
} from '../../../model';
import {
  makeStyles,
  createStyles,
  Theme,
  ListItemSecondaryAction,
  IconButton,
} from '@material-ui/core';
import {
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Button,
} from '@material-ui/core';
import { PassageDetailContext } from '../../../context/PassageDetailContext';
import { useArtifactCategory, related } from '../../../crud';
import {
  sharedSelector,
  passageDetailArtifactsSelector,
} from '../../../selector';
import { shallowEqual, useSelector } from 'react-redux';
import ShowIcon from '@material-ui/icons/Visibility';
import AudioIcon from '@material-ui/icons/Audiotrack';
import DeleteIcon from '@material-ui/icons/Delete';
import Confirm from '../../AlertDialog';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    actions: {
      display: 'flex',
      justifyContent: 'flex-end',
    },
    button: { margin: theme.spacing(2) },
    listItem: {
      margin: theme.spacing(4),
    },
  })
);

interface IProps {
  onSelect?: (media: MediaFile) => void;
  onOpen?: (open: boolean) => void;
}

export const SelectProjectResource = (props: IProps) => {
  const { onSelect, onOpen } = props;
  const classes = useStyles();
  const [memory] = useGlobal('memory');
  const [complete, setComplete] = useGlobal('progress');
  const [resource, setResouce] = useState<MediaFile[]>([]);
  const ctx = useContext(PassageDetailContext);
  const { getProjectResources } = ctx.state;
  const [confirm, setConfirm] = useState<MediaFile | undefined>();
  const { localizedArtifactCategory, slugFromId } = useArtifactCategory();
  const t: IPassageDetailArtifactsStrings = useSelector(
    passageDetailArtifactsSelector,
    shallowEqual
  );
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const media = useRef<MediaFile[]>();

  const handleSelect = (m: MediaFile) => {
    onSelect && onSelect(m);
    onOpen && onOpen(false);
  };

  const handleClick = (m: MediaFile) => () => handleSelect(m);

  const handleDelete = (m: MediaFile) => () => {
    const mediafiles = memory.cache.query((q) =>
      q.findRecords('mediafile')
    ) as MediaFile[];
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
      const total = media.current.length;
      let n = 0;
      const secResources = memory.cache.query((q) =>
        q.findRecords('sectionresource')
      ) as SectionResource[];
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
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [confirm]);

  return (
    <div id="selectProjectResource">
      <List component="div">
        {resource.map((r, i) => (
          <ListItem
            key={i}
            onClick={handleClick(r)}
            className={classes.listItem}
          >
            <ListItemIcon>
              {r.attributes.originalFile.endsWith('.pdf') ? (
                <ShowIcon />
              ) : (
                <AudioIcon />
              )}
            </ListItemIcon>
            <ListItemText
              primary={r.attributes?.topic}
              secondary={r.attributes?.originalFile}
            />
            <ListItemSecondaryAction>
              <>
                {localizedArtifactCategory(
                  slugFromId(related(r, 'artifactCategory'))
                )}
                <IconButton onClick={handleDelete(r)}>
                  <DeleteIcon />
                </IconButton>
              </>
            </ListItemSecondaryAction>
          </ListItem>
        ))}
      </List>
      <div className={classes.actions}>
        <Button
          id="proj-res-select-cancel"
          onClick={handleCancel}
          variant="contained"
          className={classes.button}
        >
          {ts.cancel}
        </Button>
      </div>
      {confirm && (
        <Confirm
          text={ts.delete.replace(
            '{0}',
            (confirm.attributes.topic || confirm.attributes.originalFile) +
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
