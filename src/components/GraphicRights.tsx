import React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import { withData } from 'react-orbitjs';
import { QueryBuilder } from '@orbit/data';
import { Graphic, IMediaTabStrings } from '../model';
import { Rights } from './Sheet';
import { shallowEqual, useSelector } from 'react-redux';
import { mediaTabSelector } from '../selector';

interface RightsHolderOption {
  inputValue?: string;
  title: string;
}

const filter = createFilterOptions<RightsHolderOption>();

interface IRecordProps {
  graphics: Array<Graphic>;
}
interface IProps {
  value: string;
  onChange: (value: string) => void;
}

export function GraphicRights(props: IProps & IRecordProps) {
  const { graphics, onChange } = props;
  const [value, setValuex] = React.useState<RightsHolderOption | null>(null);
  const t: IMediaTabStrings = useSelector(mediaTabSelector, shallowEqual);

  const setValue = (newValue: RightsHolderOption | null) => {
    setValuex(newValue);
    if (newValue) {
      onChange(newValue.inputValue ?? newValue.title);
    }
  };

  const rightsHolderOptions = React.useMemo(() => {
    return graphics
      .map((graphic) => {
        const json = JSON.parse(graphic.attributes.info ?? '{}');
        const rightsHolder = json[Rights] ?? null;
        return rightsHolder
          ? {
              title: rightsHolder,
            }
          : null;
      })
      .filter((r) => r !== null) as RightsHolderOption[];
  }, [graphics]);

  React.useEffect(() => {
    if (value?.title !== props.value && value?.inputValue !== props.value)
      setValue({ title: props.value });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value]);

  return (
    <Autocomplete
      value={value}
      onChange={(event, newValue) => {
        if (typeof newValue === 'string') {
          setValue({
            title: newValue,
          });
        } else if (newValue && newValue.inputValue) {
          // Create a new value from the user input
          setValue({
            title: newValue.inputValue,
          });
        } else {
          setValue(newValue);
        }
      }}
      filterOptions={(options, params) => {
        const filtered = filter(options, params);

        const { inputValue } = params;
        // Suggest the creation of a new value
        const isExisting = options.some(
          (option) => inputValue === option.title
        );
        if (inputValue !== '' && !isExisting) {
          filtered.push({
            inputValue,
            title: t.graphicRightsAdd.replace('{0}', inputValue),
          });
        }

        return filtered;
      }}
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      id="graphic-rights"
      options={rightsHolderOptions}
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
        return option.title;
      }}
      renderOption={(props, option) => <li {...props}>{option.title}</li>}
      sx={{ width: 300, p: 1 }}
      freeSolo
      renderInput={(params) => (
        <TextField {...params} label={t.graphicRightsTitle} />
      )}
    />
  );
}

const mapRecordsToProps = {
  graphics: (q: QueryBuilder) => q.findRecords('graphic'),
};

export default withData(mapRecordsToProps)(GraphicRights) as any as (
  props: IProps
) => JSX.Element;
