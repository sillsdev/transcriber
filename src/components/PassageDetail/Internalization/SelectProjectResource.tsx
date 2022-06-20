import { useEffect, useState, useContext } from 'react';
import { useGlobal } from 'reactn';
import { MediaFile, ISharedStrings } from '../../../model';
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
import { sharedSelector } from '../../../selector';
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
  const [resource, setResouce] = useState<MediaFile[]>([]);
  const ctx = useContext(PassageDetailContext);
  const { getProjectResources } = ctx.state;
  const [confirm, setConfirm] = useState<MediaFile | undefined>();
  const { localizedArtifactCategory, slugFromId } = useArtifactCategory();
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);

  const handleSelect = (m: MediaFile) => {
    onSelect && onSelect(m);
    onOpen && onOpen(false);
  };

  const handleClick = (m: MediaFile) => () => handleSelect(m);

  const handleDelete = (m: MediaFile) => () => {
    setConfirm(m);
  };
  const handleDeleteRefused = () => {
    setConfirm(undefined);
  };
  const handleDeleteAccepted = () => {
    if (confirm) memory.update((t) => t.removeRecord(confirm));
    setConfirm(undefined);
  };

  const handleCancel = () => {
    onOpen && onOpen(false);
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
            confirm.attributes.topic || confirm.attributes.originalFile
          )}
          yesResponse={handleDeleteAccepted}
          noResponse={handleDeleteRefused}
        />
      )}
    </div>
  );
};

export default SelectProjectResource;
