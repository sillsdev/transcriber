import React from 'react';
import { connect } from 'react-redux';
import localStrings from '../selector/localize';
import { IState, ISpellingStrings } from '../model';
import { IconButton } from '@mui/material';
import SpellCheckIcon from '@mui/icons-material/Spellcheck';
import SpellingTabs from './SpellingTabs';
import BigDialog from '../hoc/BigDialog';
import Confirm from './AlertDialog';
import { LightTooltip } from '../control';
import { relaunchApp, exitApp } from '../utils';
import { isElectron } from '../api-variable';
const ipc = isElectron ? require('electron').ipcRenderer : null;

interface IStateProps {
  t: ISpellingStrings;
}

export const Spelling = (props: IStateProps) => {
  const { t } = props;
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
      ipc?.invoke('setSpellLangs', codes);
      setConfirm(true);
    }
    setOpen(false);
  };

  const confirmed = () => {
    setConfirm(false);
  };

  const restart = () => {
    relaunchApp();
    exitApp();
  };

  React.useEffect(() => {
    ipc?.invoke('setAddToDict', t.addToDict);
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

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'spelling' }),
});

export default connect(mapStateToProps)(Spelling);
