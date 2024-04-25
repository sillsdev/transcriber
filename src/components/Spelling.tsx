import React from 'react';
import { ISpellingStrings } from '../model';
import { IconButton } from '@mui/material';
import SpellCheckIcon from '@mui/icons-material/Spellcheck';
import SpellingTabs from './SpellingTabs';
import BigDialog from '../hoc/BigDialog';
import Confirm from './AlertDialog';
import { LightTooltip } from '../control';
import { relaunchApp, exitApp } from '../utils';
import { useSelector } from 'react-redux';
import { spellingSelector } from '../selector';
const ipc = (window as any)?.electron;

export const Spelling = () => {
  const t: ISpellingStrings = useSelector(spellingSelector);
  const [open, setOpen] = React.useState(false);
  const [codes, setCodes] = React.useState<string[]>([]);
  const [confirm, setConfirm] = React.useState(false);
  const [changed, setChanged] = React.useState(false);

  const handleOpen = () => {
    setOpen(!open);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const handleSave = () => {
    if (changed) {
      ipc?.setSpellLangs(codes);
      setConfirm(true);
    }
    setOpen(false);
  };

  const confirmed = () => {
    setConfirm(false);
  };

  const restart = async () => {
    await relaunchApp();
    setTimeout(() => exitApp(), 1000);
  };

  React.useEffect(() => {
    ipc?.setAddToDict(t.addToDict);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <span>
      <LightTooltip title={t.spellingLangsTip}>
        <IconButton onClick={handleOpen}>
          <SpellCheckIcon />
        </IconButton>
      </LightTooltip>
      {open && (
        <BigDialog
          title={t.spellingLangs}
          isOpen={open}
          onOpen={setOpen}
          onSave={handleSave}
          onCancel={handleCancel}
        >
          <SpellingTabs
            codes={codes}
            setCodes={setCodes}
            setChanged={setChanged}
          />
        </BigDialog>
      )}
      {confirm && (
        <Confirm
          text={t.restart}
          no={t.close}
          noResponse={confirmed}
          yes={t.restartApp}
          yesResponse={restart}
        />
      )}
    </span>
  );
};

export default Spelling;
