import { IMediaActionsStrings, IState } from '../../model';
import { IconButton, Box, SxProps } from '@mui/material';
import PlayIcon from '@mui/icons-material/PlayArrowOutlined';
import { FaPaperclip, FaUnlink } from 'react-icons/fa';
import PauseIcon from '@mui/icons-material/Pause';
import localStrings from '../../selector/localize';
import { connect } from 'react-redux';
import { isElectron } from '../../api-variable';

const actionProps = { color: 'primary.light' } as SxProps;

interface IStateProps {
  t: IMediaActionsStrings;
}
interface IProps extends IStateProps {
  rowIndex: number;
  mediaId: string;
  online: boolean;
  readonly: boolean;
  isPlaying: boolean;
  attached: boolean;
  onAttach: (where: number[], attach: boolean) => () => void;
  onPlayStatus: (mediaId: string) => void;
}

export function MediaActions(props: IProps) {
  const {
    t,
    rowIndex,
    mediaId,
    online,
    readonly,
    onAttach,
    onPlayStatus,
    isPlaying,
    attached,
  } = props;

  const handlePlayStatus = () => {
    onPlayStatus(mediaId);
  };

  const handleAttach = () => {
    onAttach([rowIndex], !attached);
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      {!readonly && (
        <IconButton
          id="audActAttach"
          sx={actionProps}
          title={!attached ? t.attach : t.detach}
          onClick={handleAttach}
        >
          {!attached ? (
            <FaPaperclip fontSize="16px" />
          ) : (
            <FaUnlink fontSize="16px" />
          )}
        </IconButton>
      )}
      {(isElectron || online) && (
        <IconButton
          id="audActPlayStop"
          sx={actionProps}
          title={isPlaying ? t.pause : t.play}
          disabled={(mediaId || '') === ''}
          onClick={handlePlayStatus}
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </IconButton>
      )}
    </Box>
  );
}
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'mediaActions' }),
});
export default connect(mapStateToProps)(MediaActions) as any as any;
