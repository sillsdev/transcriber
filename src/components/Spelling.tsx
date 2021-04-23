import React from 'react';
import { connect } from 'react-redux';
import localStrings from '../selector/localize';
import { IState, ISpellingStrings } from '../model';
import { IconButton } from '@material-ui/core';
import SpellCheckIcon from '@material-ui/icons/Spellcheck';
import SpellLanguagePicker from './SpellLanguagePicker';
import BigDialog from '../hoc/BigDialog';
import { LightTooltip } from '../control';
import { isElectron } from '../api-variable';
const ipc = isElectron ? require('electron').ipcRenderer : null;

interface IStateProps {
  t: ISpellingStrings;
}

export const Spelling = (props: IStateProps) => {
  const { t } = props;
  const [open, setOpen] = React.useState(false);
  const [codes, setCodes] = React.useState<string[]>([]);

  const handleOpen = () => {
    setOpen(!open);
  };

  const handleCancel = () => {
    setOpen(false);
  };

  const handleSave = () => {
    console.log(codes);
    ipc?.invoke('setSpellLangs', codes);
    setOpen(false);
  };

  const handleCodes = (codes: string[]) => {
    setCodes(codes);
  };

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
          <SpellLanguagePicker codes={codes} onSetCodes={handleCodes} />
        </BigDialog>
      )}
    </span>
  );
};

const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'spelling' }),
});

export default connect(mapStateToProps)(Spelling);
