import { Button, ButtonGroup } from '@mui/material';
import AddIcon from '@mui/icons-material/LibraryAddOutlined';
import VersionsIcon from '@mui/icons-material/List';
import AudioFileIcon from '@mui/icons-material/AudioFileOutlined';
import { AudacityLogo } from '../../control';
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
  onAudacity?: () => void;
}

export const RecordButtons = ({
  mediaId,
  mediaState,
  onVersions,
  onUpload,
  onReload,
  onAudacity,
}: IProps) => {
  const [offlineOnly] = useGlobal('offlineOnly');
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const t: IPassageRecordStrings = useSelector(
    passageRecordSelector,
    shallowEqual
  );

  const IconSize = { width: '14px', height: '14px' };

  return (
    <ButtonGroup size="small" sx={{ my: 1 }}>
      <Button
        id="pdRecordVersions"
        onClick={onVersions}
        title={ts.versionHistory}
        startIcon={<VersionsIcon sx={IconSize} />}
      >
        {ts.versionHistory}
      </Button>
      <Button
        id="pdRecordUpload"
        onClick={onUpload}
        title={!offlineOnly ? ts.uploadMediaSingular : ts.importMediaSingular}
        startIcon={<AddIcon sx={IconSize} />}
      >
        {!offlineOnly ? ts.uploadMediaSingular : ts.importMediaSingular}
      </Button>
      {mediaId &&
        mediaState &&
        mediaState.status === MediaSt.FETCHED &&
        mediaState.id === mediaId && (
          <Button
            id="pdRecordReload"
            onClick={onReload}
            startIcon={<AudioFileIcon sx={IconSize} />}
          >
            {t.loadfile}
          </Button>
        )}
      {onAudacity && (
        <Button
          id="pdAudacity"
          onClick={onAudacity}
          title={ts.launchAudacity}
          startIcon={<AudacityLogo sx={IconSize} />}
        >
          {ts.launchAudacity}
        </Button>
      )}
    </ButtonGroup>
  );
};
