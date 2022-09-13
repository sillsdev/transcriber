import * as React from 'react';
import { useGlobal } from 'reactn';
import { ICommunityStrings } from '../model';
import TextField from '@mui/material/TextField';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../mods/react-orbitjs';
import IntellectualProperty from '../model/intellectualProperty';
import BigDialog from '../hoc/BigDialog';
import ProvideRights from './ProvideRights';
import { communitySelector } from '../selector';
import { shallowEqual, useSelector } from 'react-redux';
import { ArtifactTypeSlug, related } from '../crud';
import { Typography } from '@material-ui/core';

interface NameOptionType {
  inputValue?: string;
  name: string;
}

const filter = createFilterOptions<NameOptionType>();

interface IRecordProps {
  ipRecs: IntellectualProperty[];
}

interface IProps {
  name: string;
  onChange?: (name: string) => void;
  onRights?: (hasRights: boolean) => void;
  createProject?: (name: string) => Promise<string>;
  team?: string;
}

export function SpeakerName({
  name,
  onChange,
  onRights,
  createProject,
  team,
  ipRecs,
}: IProps & IRecordProps) {
  const [value, setValue] = React.useState<NameOptionType | null>({ name });
  const [speakers, setSpeakers] = React.useState<NameOptionType[]>([]);
  const [showDialog, setShowDialog] = React.useState(false);
  const [organization] = useGlobal('organization');
  const t: ICommunityStrings = useSelector(communitySelector, shallowEqual);

  const handleRights = () => {
    setShowDialog(true);
  };

  const handleCloseRights = () => {
    setShowDialog(false);
  };

  const handleRightsChange = (hasRights: boolean) => {
    onRights && onRights(hasRights);
    setShowDialog(false);
  };

  React.useEffect(() => {
    const newSpeakers = new Array<NameOptionType>();
    const orgId = team || organization;
    ipRecs.forEach((r) => {
      if (related(r, 'organization') === orgId) {
        newSpeakers.push({ name: r.attributes.rightsHolder });
      }
    });
    setSpeakers(newSpeakers);
  }, [ipRecs, team, organization]);

  React.useEffect(() => {
    setValue({ name });
  }, [name]);

  return (
    <>
      <Autocomplete
        value={value}
        onChange={(event, newValue) => {
          if (typeof newValue === 'string') {
            setValue({
              name: newValue,
            });
            onChange && onChange(newValue);
            onRights && onRights(true);
          } else if (newValue && newValue.inputValue) {
            // Create a new value from the user input
            setValue({
              name: newValue.inputValue,
            });
            onChange && onChange(newValue.inputValue);
            handleRights();
          } else {
            setValue(newValue);
            if (newValue) {
              onChange && onChange(newValue?.name || '');
              onRights && onRights(true);
            }
          }
        }}
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
        getOptionLabel={(option) => {
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
        }}
        renderOption={(props, option) => <li {...props}>{option.name}</li>}
        sx={{ width: 300 }}
        freeSolo
        renderInput={(params) => (
          <TextField required {...params} label={t.speaker} />
        )}
      />
      <BigDialog
        title={t.provideRights}
        isOpen={showDialog}
        onOpen={handleCloseRights}
      >
        <>
          <Typography>{t.releaseRights}</Typography>
          <ProvideRights
            speaker={value?.name || ''}
            recordType={ArtifactTypeSlug.IntellectualProperty}
            onRights={handleRightsChange}
            createProject={createProject}
            team={team}
          />
        </>
      </BigDialog>
    </>
  );
}

const mapRecordsToProps = {
  ipRecs: (q: QueryBuilder) => q.findRecords('intellectualproperty'),
};
export default withData(mapRecordsToProps)(SpeakerName) as any as (
  props: IProps
) => JSX.Element;