import React, { useState } from 'react';
import {
  Group,
  GroupMembership,
  IPeerStrings,
  ISharedStrings,
  User,
} from '../../model';
import Button from '@material-ui/core/Button';
import IconButton from '@material-ui/core/IconButton';
import TextField from '@material-ui/core/TextField';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import AddIcon from '@mui/icons-material/Add';
import { useSelector, shallowEqual } from 'react-redux';
import { peerSelector, sharedSelector } from '../../selector';
import Confirm from '../AlertDialog';
import { useSnackBar } from '../../hoc/SnackBar';
import { usePermissions } from '../../crud/usePermissions';
import {
  createStyles,
  FormControlLabel,
  FormLabel,
  makeStyles,
  Radio,
  RadioGroup,
  Theme,
  Tooltip,
} from '@material-ui/core';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../../mods/react-orbitjs';
const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    label: {
      marginTop: theme.spacing(3),
    },
  })
);
interface IRecordProps {
  users: Array<User>;
  groups: Array<Group>;
  memberships: Array<GroupMembership>;
}
interface IProps extends IRecordProps {
  cur?: Group;
  save: (name: string, permissions: string, id?: string) => void;
  remove?: (id: string) => void;
  isAdmin: boolean;
  inUse: string[];
}

export const GroupDialog = ({
  cur,
  save,
  remove,
  isAdmin,
  inUse,
  users,
  groups,
  memberships,
}: IProps) => {
  const classes = useStyles();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [confirm, setConfirm] = useState<string>();
  const { showMessage } = useSnackBar();
  const {
    allPermissions,
    localizedPermissions,
    permissionTip,
    getPermissionFromJson,
  } = usePermissions({ users, groups, memberships });
  const [permissionTitles] = useState(localizedPermissions());
  const [permissions, setPermissions] = React.useState(
    getPermissionFromJson(cur?.attributes.permissions ?? '')
  );
  const t = useSelector(peerSelector, shallowEqual) as IPeerStrings;
  const ts = useSelector(sharedSelector, shallowEqual) as ISharedStrings;
  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleClickOpen = () => {
    setOpen(true);
  };

  const handleCancel = () => {
    if (!cur) setName('');
    setOpen(false);
  };
  const showInUse = () =>
    (!cur || cur.attributes.name !== name) &&
    inUse.includes(name.toLocaleLowerCase());

  const handleSave = () => {
    if (showInUse()) {
      showMessage(t.inUse);
      return;
    }
    save(name, permissions, cur?.id);
    setName('');
    setOpen(false);
  };

  const handleRemove = () => {
    setConfirm(t.removeConfirm);
  };

  const handleRemoveRefused = () => {
    setConfirm(undefined);
  };

  const handleRemoveConfirmed = () => {
    setConfirm(undefined);
    remove && remove(cur?.id || '');
    setOpen(false);
  };

  React.useEffect(() => {
    if (cur) setName(cur.attributes?.name);
  }, [cur]);

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPermissions((event.target as HTMLInputElement).value);
  };

  return (
    <div>
      {cur ? (
        <Button
          id={`${cur.attributes.abbreviation}Open`}
          color="primary"
          onClick={handleClickOpen}
          disabled={!isAdmin}
        >
          {cur.attributes?.name}
        </Button>
      ) : (
        <IconButton
          id="peerOpen"
          color="primary"
          onClick={handleClickOpen}
          disabled={!isAdmin}
        >
          <AddIcon />
        </IconButton>
      )}

      <Dialog
        open={open}
        onClose={handleCancel}
        aria-labelledby="form-dialog-title"
      >
        <DialogTitle id="form-dialog-title">
          {cur ? t.editPeerGroup : t.newPeerGroup}
        </DialogTitle>
        <DialogContent>
          <DialogContentText>{t.peerDescription}</DialogContentText>
          <TextField
            autoFocus
            margin="dense"
            id="peerName"
            label={t.name}
            value={name}
            onChange={handleNameChange}
            helperText={showInUse() && t.inUse}
          />

          <FormLabel component="legend" className={classes.label}>
            {t.permissions}
          </FormLabel>
          <RadioGroup value={permissions} onChange={handleChange}>
            <FormControlLabel
              key="none"
              control={<Radio id="none" key="none" />}
              label={t.noSpecialPermission}
              value={''}
            />
            {allPermissions().map((p, i) => (
              <Tooltip title={permissionTip(p)}>
                <FormControlLabel
                  key={p}
                  control={<Radio id={p} key={p} />}
                  label={permissionTitles[i]}
                  value={p}
                />
              </Tooltip>
            ))}
          </RadioGroup>
        </DialogContent>
        <DialogActions>
          {cur && (
            <Button id="peerRemove" onClick={handleRemove} color="primary">
              {t.remove}
            </Button>
          )}
          <Button id="peerCancel" onClick={handleCancel} color="primary">
            {ts.cancel}
          </Button>
          <Button
            id="peerSave"
            onClick={handleSave}
            color="primary"
            disabled={!name}
          >
            {ts.save}
          </Button>
        </DialogActions>
      </Dialog>
      {confirm && (
        <Confirm
          text={confirm}
          yesResponse={handleRemoveConfirmed}
          noResponse={handleRemoveRefused}
        />
      )}
    </div>
  );
};

const mapRecordsToProps = {
  mediafiles: (q: QueryBuilder) => q.findRecords('mediafile'),
  users: (q: QueryBuilder) => q.findRecords('user'),
  groups: (q: QueryBuilder) => q.findRecords('group'),
  memberships: (q: QueryBuilder) => q.findRecords('groupmembership'),
};
export default withData(mapRecordsToProps)(GroupDialog as any) as any;
