import * as React from 'react';
import { useGlobal } from '../context/GlobalContext';
import { ICommunityStrings, MediaFileD } from '../model';
import TextField from '@mui/material/TextField';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import IntellectualProperty from '../model/intellectualProperty';
import BigDialog from '../hoc/BigDialog';
import ProvideRights from './ProvideRights';
import { communitySelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { ArtifactTypeSlug, findRecord, related } from '../crud';
import { Typography } from '@mui/material';
import { useOrbitData } from '../hoc/useOrbitData';
import { useSnackBar } from '../hoc/SnackBar';

interface NameOptionType {
  inputValue?: string;
  name: string;
}

const filter = createFilterOptions<NameOptionType>();

interface IProps {
  name: string;
  noNewVoice?: boolean;
  onChange?: (name: string) => void;
  onRights?: (hasRights: boolean) => void;
  createProject?: (name: string) => Promise<string>;
  team?: string;
  recordingRequired?: boolean;
  disabled?: boolean;
}

export function SpeakerName({
  name,
  noNewVoice,
  onChange,
  onRights,
  createProject,
  team,
  recordingRequired,
  disabled,
}: IProps) {
  const ipRecs = useOrbitData<IntellectualProperty[]>('intellectualproperty');
  const [value, setValue] = React.useState<NameOptionType | null>({ name });
  const valueRef = React.useRef<string>('');
  const [speakers, setSpeakers] = React.useState<NameOptionType[]>([]);
  const [showDialog, setShowDialog] = React.useState(false);
  const [organization] = useGlobal('organization');
  const { showMessage } = useSnackBar();
  const [memory] = useGlobal('memory');
  const t: ICommunityStrings = useSelector(communitySelector, shallowEqual);

  const handleRights = () => {
    onRights && onRights(false);
    if (noNewVoice) {
      showMessage(t.noVoiceCreation);
      return;
    }
    setShowDialog(true);
  };

  const nameReset = () => {
    valueRef.current = '';
    onChange && onChange('');
    onRights && onRights(false);
  };

  const handleCancelRights = () => {
    setShowDialog(false);
    nameReset();
  };

  const getOptionLabel = (option: string | NameOptionType) => {
    // Value selected with enter, right from the input
    if (typeof option === 'string') {
      return option;
    }
    // Add "xxx" option created dynamically
    if (option.inputValue) {
      return option.inputValue;
    }
    // Regular option
    return option.name;
  };

  const handleRightsChange = (hasRights: boolean) => {
    onRights && onRights(hasRights);
    setShowDialog(false);
  };

  const handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    valueRef.current = event.target.value;
    onRights && onRights(false);
  };

  const inList = (name: string) => speakers.find((s) => s.name === name);

  const handleChoice = (newValue: string | NameOptionType | null) => {
    if (newValue === null) {
      nameReset();
    } else if (typeof newValue === 'string') {
      setValue({
        name: newValue,
      });
      onChange && onChange(newValue);
      if (inList(newValue)) {
        onRights && onRights(true);
      } else handleRights();
    } else if (newValue && newValue.inputValue) {
      // Create a new value from the user input
      setValue({
        name: newValue.inputValue,
      });
      onChange && onChange(newValue.inputValue);
      if (inList(newValue.inputValue)) {
        onRights && onRights(true);
      } else handleRights();
    } else {
      setValue(newValue);
      if (newValue) {
        onChange && onChange(newValue?.name || '');
        onRights && onRights(true);
      }
    }
  };

  const handleLeave = (event: any, reason: string) => {
    if (
      reason === 'blur' &&
      valueRef.current &&
      event?.relatedTarget?.id !== 'uploadCancel'
    )
      handleChoice(valueRef.current);
  };

  React.useEffect(() => {
    const newSpeakers = new Array<NameOptionType>();
    const orgId = team || organization;
    const orgIp = ipRecs.filter((r) => related(r, 'organization') === orgId);
    if (recordingRequired) {
      orgIp.forEach((r) => {
        const mediaRec = findRecord(
          memory,
          'mediafile',
          related(r, 'releaseMediafile')
        ) as MediaFileD;
        if (mediaRec?.attributes?.transcription) {
          newSpeakers.push({ name: r.attributes.rightsHolder });
        }
      });
    } else {
      newSpeakers.push(
        ...orgIp.map((r) => ({ name: r.attributes.rightsHolder }))
      );
    }
    setSpeakers(
      newSpeakers.sort((a, b) =>
        getOptionLabel(a).localeCompare(getOptionLabel(b))
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ipRecs, team, organization, recordingRequired]);

  React.useEffect(() => {
    if (inList(name)) {
      onRights && onRights(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [speakers, name]);

  React.useEffect(() => {
    const newName = valueRef.current ? valueRef.current : name;
    if (value?.name !== newName) setValue({ name: newName });
  }, [name, value?.name]);

  return (
    <>
      <Autocomplete
        value={value}
        onChange={(event, newValue) => handleChoice(newValue)}
        onClose={handleLeave}
        disabled={disabled}
        filterOptions={(options, params) => {
          const filtered = filter(options, params);

          const { inputValue } = params;
          // Suggest the creation of a new value
          const isExisting = options.some(
            (option) => inputValue === option.name
          );
          if (inputValue !== '' && !isExisting) {
            filtered.push({
              inputValue,
              name: t.addSpeaker.replace('{0}', inputValue),
            });
          }

          return filtered;
        }}
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        id="speaker-name"
        options={speakers}
        getOptionLabel={getOptionLabel}
        renderOption={(props, option) => <li {...props}>{option.name}</li>}
        sx={{ width: 300, marginTop: '5px' }}
        freeSolo
        renderInput={(params) => (
          <TextField
            required
            {...params}
            label={t.speaker}
            onChange={handleNameChange}
          />
        )}
      />
      <BigDialog
        title={t.provideRights}
        isOpen={showDialog}
        onOpen={handleCancelRights}
      >
        <>
          <Typography>
            {recordingRequired ? t.voiceRights : t.releaseRights}
          </Typography>
          <ProvideRights
            speaker={value?.name || ''}
            recordType={ArtifactTypeSlug.IntellectualProperty}
            onRights={handleRightsChange}
            createProject={createProject}
            team={team}
            recordingRequired={recordingRequired}
          />
        </>
      </BigDialog>
    </>
  );
}

export default SpeakerName;
