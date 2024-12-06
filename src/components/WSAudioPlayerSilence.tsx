import { IconButton, InputLabel, Input, Box, SxProps } from '@mui/material';
import { LightTooltip } from '../control';
import { IWsAudioPlayerStrings } from '../model';
import { wsAudioPlayerSelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';
import SilenceIcon from '@mui/icons-material/SpaceBar';
import { useState } from 'react';

const labeledControlProp = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
};
const smallLabel = { fontSize: 'small' } as SxProps;

interface IProps {
  disabled: boolean;
  wsInsertSilence: (seconds: number, position: number) => void;
  wsPosition: () => number;
  handleChanged: () => void;
}
export function WSAudioPlayerSilence(props: IProps) {
  const { disabled, wsInsertSilence, wsPosition, handleChanged } = props;
  const [silence, setSilence] = useState(0.5);

  const t: IWsAudioPlayerStrings = useSelector(
    wsAudioPlayerSelector,
    shallowEqual
  );
  const handleAddSilence = () => () => {
    wsInsertSilence(silence, wsPosition());
    handleChanged();
  };
  const handleChangeSilence = (e: any) => {
    //check if its a number
    e.persist();
    setSilence(e.target.value);
  };
  return (
    <>
      <Box sx={labeledControlProp}>
        <>
          <InputLabel id="wsAudioAddSilenceLabel" sx={smallLabel}>
            {t.silence}
          </InputLabel>
          <LightTooltip id="wsAudioAddSilenceTip" title={t.silence}>
            <span>
              <IconButton
                id="wsAudioAddSilence"
                sx={{ mx: 1 }}
                onClick={handleAddSilence()}
                disabled={disabled}
              >
                <SilenceIcon />
              </IconButton>
            </span>
          </LightTooltip>
        </>
      </Box>
      <Box sx={labeledControlProp}>
        <>
          <InputLabel id="wsAudioSilenceLabel" sx={smallLabel}>
            {t.seconds}
          </InputLabel>
          <Input
            id="wsAudioSilence"
            sx={{ m: 1, maxWidth: 50 }}
            type="number"
            inputProps={{ min: '0.1', step: '0.1' }}
            value={silence}
            onChange={handleChangeSilence}
          />
        </>
      </Box>
    </>
  );
}
