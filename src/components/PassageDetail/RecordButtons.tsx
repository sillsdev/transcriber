import { ButtonGroup, ButtonGroupProps, styled } from '@mui/material';
import AddIcon from '@mui/icons-material/LibraryAddOutlined';
import VersionsIcon from '@mui/icons-material/List';
import AudioFileIcon from '@mui/icons-material/AudioFileOutlined';
import { ReactComponent as RemoveNoiseIcon } from '../../assets/no-honk-icon.svg';
import { AltButton, AudacityLogo } from '../../control';
import { shallowEqual, useSelector } from 'react-redux';
import { passageRecordSelector, sharedSelector } from '../../selector';
import { IPassageRecordStrings, ISharedStrings } from '../../model';

const StyledButtonGroup = styled(ButtonGroup)<ButtonGroupProps>(() => ({
  '& button': {
    margin: 0,
  },
}));

interface IProps {
  onVersions?: () => void;
  onReload?: () => void;
  onUpload: () => void;
  onAudacity?: () => void;
  onNoiseRemoval?: () => void;
  noiseRemoveInProgress: boolean;
}

export const RecordButtons = ({
  onVersions,
  onUpload,
  onReload,
  onAudacity,
  onNoiseRemoval,
  noiseRemoveInProgress
}: IProps) => {
  const ts: ISharedStrings = useSelector(sharedSelector, shallowEqual);
  const t: IPassageRecordStrings = useSelector(
    passageRecordSelector,
    shallowEqual
  );

  const IconSize = { width: '14px', height: '14px' };

  return (
    <StyledButtonGroup size="small" sx={{ my: 1 }}>
      {onVersions && (
        <AltButton
          id="pdRecordVersions"
          onClick={onVersions}
          title={ts.versionHistory}
          startIcon={<VersionsIcon sx={IconSize} />}
        >
          {ts.versionHistory}
        </AltButton>
      )}
      {onReload && (
        <AltButton
          id="pdRecordReload"
          onClick={onReload}
          startIcon={<AudioFileIcon sx={IconSize} />}
        >
          {t.loadlatest}
        </AltButton>
      )}
      <AltButton
        id="pdRecordUpload"
        onClick={onUpload}
        title={ts.uploadMediaSingular}
        startIcon={<AddIcon sx={IconSize} />}
      >
        {ts.uploadMediaSingular}
      </AltButton>
      {onAudacity && (
        <AltButton
          id="pdAudacity"
          onClick={onAudacity}
          title={ts.launchAudacity}
          startIcon={<AudacityLogo sx={IconSize} />}
        >
          {ts.launchAudacity}
        </AltButton>
      )}
      {(onNoiseRemoval && (
        <AltButton 
          id="noiseremoval"
          onClick={onNoiseRemoval}
          title={ts.noiseRemoval}
          startIcon={<RemoveNoiseIcon style={IconSize} />}
          disabled = {noiseRemoveInProgress}
          color = {noiseRemoveInProgress ? 'warning' : 'primary'}
          >
            {ts.noiseRemoval}
        </AltButton>
      ))}
    </StyledButtonGroup>
  );
};
