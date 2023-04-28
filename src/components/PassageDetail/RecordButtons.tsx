import { Button, ButtonGroup } from '@mui/material';
import AddIcon from '@mui/icons-material/LibraryAddOutlined';
import VersionsIcon from '@mui/icons-material/List';
import AudioFileIcon from '@mui/icons-material/AudioFileOutlined';
import { useGlobal } from 'reactn';
import { shallowEqual, useSelector } from 'react-redux';
import { passageRecordSelector, sharedSelector } from '../../selector';
import { IPassageRecordStrings, ISharedStrings } from '../../model';
import { IMediaState, MediaSt } from '../../crud';

interface IProps {
  mediaId: string;
  mediaState?: IMediaState;
  onVersions: () => void;
  onUpload: () => void;
  onReload: () => void;
}

export const RecordButtons = ({
  mediaId,
  mediaState,
  onVersions,
  onUpload,
  onReload,
}: IProps) => {
  const [offlineOnly] = useGlobal('offlineOnly');
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const t: IPassageRecordStrings = useSelector(
    passageRecordSelector,
    shallowEqual
  );

  return (
    <ButtonGroup size="small" sx={{ my: 1 }}>
      <Button
        id="pdRecordVersions"
        onClick={onVersions}
        title={ts.versionHistory}
      >
        <VersionsIcon />
        {ts.versionHistory}
      </Button>
      <Button
        id="pdRecordUpload"
        onClick={onUpload}
        title={!offlineOnly ? ts.uploadMediaSingular : ts.importMediaSingular}
      >
        <AddIcon />
        {!offlineOnly ? ts.uploadMediaSingular : ts.importMediaSingular}
      </Button>
      {mediaId &&
        mediaState &&
        mediaState.status === MediaSt.FETCHED &&
        mediaState.id === mediaId && (
          <Button id="pdRecordReload" onClick={onReload}>
            <AudioFileIcon />
            {t.loadfile}
          </Button>
        )}
    </ButtonGroup>
  );
};
