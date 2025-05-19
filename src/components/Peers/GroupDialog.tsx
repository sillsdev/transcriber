import React, { useMemo, useState } from 'react';
import { GroupD, IPeerStrings, ISharedStrings } from '../../model';
import {
  Button,
  IconButton,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  FormControlLabel,
  FormLabel,
  Radio,
  RadioGroup,
  Tooltip,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { useSelector, shallowEqual } from 'react-redux';
import { peerSelector, sharedSelector } from '../../selector';
import Confirm from '../AlertDialog';
import { useSnackBar } from '../../hoc/SnackBar';
import { usePermissions } from '../../crud/usePermissions';
import { AltButton, PriButton } from '../../control';
import { useOrbitData } from '../../hoc/useOrbitData';
import { OrganizationSchemeStepD } from '../../model/organizationSchemeStep';
import related from '../../crud/related';
import {
  orgDefaultPermissions,
  useOrgDefaults,
} from '../../crud/useOrgDefaults';

interface IProps {
  cur?: GroupD;
  save: (name: string, permissions: string, id?: string) => void;
  remove?: (id: string) => void;
  isAdmin: boolean;
  inUse: string[];
}

export const GroupDialog = ({ cur, save, remove, isAdmin, inUse }: IProps) => {
  const orgSchemeSteps = useOrbitData<OrganizationSchemeStepD[]>(
    'organizationschemestep'
  );
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [inUseSteps, setInUseSteps] = useState(0);
  const [inUseSchemes, setInUseSchemes] = useState(0);
  const [confirm, setConfirm] = useState<string>();
  const { showMessage } = useSnackBar();
  const {
    allPermissions,
    localizedPermissions,
    permissionTip,
    getPermissionFromJson,
  } = usePermissions();
  const [permissions, setPermissions] = React.useState('');
  const t = useSelector(peerSelector, shallowEqual) as IPeerStrings;
  const ts = useSelector(sharedSelector, shallowEqual) as ISharedStrings;
  const { getOrgDefault } = useOrgDefaults();
  const isPermission = useMemo(
    () => Boolean(getOrgDefault(orgDefaultPermissions)),
    [getOrgDefault]
  );

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

  const inSchemeUseMsg = useMemo(
    () =>
      t.inSchemeUse
        .replace('{0}', inUseSteps.toString())
        .replace('{1}', inUseSchemes.toString())
        .replace(/\{2\}/g, isPermission ? t.permission : t.assignment),
    [inUseSteps, inUseSchemes, isPermission, t]
  );

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

  const permissionTitles = React.useMemo(
    () => localizedPermissions(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [permissions]
  );

  React.useEffect(() => {
    const newName = cur?.attributes?.name ?? '';
    if (name !== newName) setName(newName);
    const newPermissions = getPermissionFromJson(
      cur?.attributes.permissions ?? ''
    );
    if (permissions !== newPermissions) {
      setPermissions(newPermissions);
    }

    const newInUseSteps = orgSchemeSteps.filter(
      (step) => related(step, 'group') === cur?.id
    );
    if (newInUseSteps.length !== inUseSteps) {
      setInUseSteps(newInUseSteps.length);
    }
    const newInUseSchemes = new Set<string>();
    newInUseSteps.forEach((step) => {
      newInUseSchemes.add(related(step, 'organizationscheme'));
    });
    if (newInUseSchemes.size !== inUseSchemes) {
      setInUseSchemes(newInUseSchemes.size);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cur]);

  const isChanged = useMemo(
    () =>
      name !== cur?.attributes.name ||
      permissions !== getPermissionFromJson(cur?.attributes.permissions ?? ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [name, permissions, cur]
  );

  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPermissions((event.target as HTMLInputElement).value);
  };

  return (
    <div>
      {cur ? (
        <Button
          key="open"
          id={`${cur.attributes.abbreviation}Open`}
          color="primary"
          onClick={handleClickOpen}
          disabled={!isAdmin}
        >
          {cur.attributes?.name}
        </Button>
      ) : (
        <IconButton
          key="peeropen"
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
        disableEnforceFocus
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
            helperText={
              showInUse() ? t.inUse : cur ? inSchemeUseMsg : undefined
            }
          />

          <FormLabel component="legend" sx={{ mt: 3 }}>
            {t.permissions}
          </FormLabel>
          <RadioGroup value={permissions} onChange={handleChange}>
            <Tooltip key="nsptip" title={permissionTip('')}>
              <FormControlLabel
                key="none"
                control={<Radio id="none" key="none" />}
                label={t.noSpecialPermission}
                value={''}
              />
            </Tooltip>
            {allPermissions().map((p, i) => (
              <Tooltip key={p + 'tip'} title={permissionTip(p)}>
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
            <AltButton id="peerRemove" onClick={handleRemove} color="primary">
              {t.remove}
            </AltButton>
          )}
          <AltButton id="peerCancel" onClick={handleCancel} color="primary">
            {ts.cancel}
          </AltButton>
          <PriButton
            id="peerSave"
            onClick={handleSave}
            color="primary"
            disabled={!name || !isChanged}
          >
            {ts.save}
          </PriButton>
        </DialogActions>
      </Dialog>
      {confirm && (
        <Confirm
          text={confirm}
          jsx={<p>{inSchemeUseMsg}</p>}
          yesResponse={handleRemoveConfirmed}
          noResponse={handleRemoveRefused}
        />
      )}
    </div>
  );
};

export default GroupDialog;
