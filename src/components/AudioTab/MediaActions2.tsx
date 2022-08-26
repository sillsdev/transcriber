import { IMediaActionsStrings } from '../../model';
import { IconButton, Box } from '@mui/material';
import DeleteIcon from '@mui/icons-material/DeleteOutline';
import { isElectron } from '../../api-variable';
import AudioDownload from '../AudioDownload';
import { mediaActionsSelector } from '../../selector';
import { shallowEqual, useSelector } from 'react-redux';

interface IStateProps {
  t: IMediaActionsStrings;
}
interface IProps extends IStateProps {
  rowIndex: number;
  mediaId: string;
  online: boolean;
  readonly: boolean;
  isPlaying: boolean;
  canDelete: boolean;
  onDownload: (mediaId: string) => void;
  onDelete: (i: number) => () => void;
}

export function MediaActions2(props: IProps) {
  const { rowIndex, mediaId, online, readonly, onDelete, canDelete } = props;
  const t: IMediaActionsStrings = useSelector(
    mediaActionsSelector,
    shallowEqual
  );

  const handleDelete = () => {
    onDelete(rowIndex);
  };

  return (
    <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
      {(isElectron || online) && <AudioDownload mediaId={mediaId} />}
      {canDelete && !readonly && (
        <IconButton
          id="audActDel"
          sx={{ color: 'primary.light' }}
          title={t.delete}
          onClick={handleDelete}
        >
          <DeleteIcon />
        </IconButton>
      )}
    </Box>
  );
}
export default MediaActions2;
