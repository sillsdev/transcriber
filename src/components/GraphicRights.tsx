import React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import { Graphic, IMediaTabStrings } from '../model';
import { Rights } from './Sheet';
import { shallowEqual, useSelector } from 'react-redux';
import { mediaTabSelector } from '../selector';
import { useOrbitData } from '../hoc/useOrbitData';

interface RightsHolderOption {
  inputValue?: string;
  title: string;
}

const filter = createFilterOptions<RightsHolderOption>();

interface IProps {
  value: string;
  onChange: (value: string) => void;
}

export function GraphicRights(props: IProps) {
  const { onChange } = props;
  const graphics = useOrbitData<Graphic[]>('graphic');
  const [value, setValuex] = React.useState<RightsHolderOption | null>(null);
  const t: IMediaTabStrings = useSelector(mediaTabSelector, shallowEqual);

  const setValue = (newValue: RightsHolderOption | null) => {
    setValuex(newValue);
    if (newValue) {
      onChange(newValue.inputValue ?? newValue.title);
    }
  };

  const rightsHolderOptions = React.useMemo(() => {
    const options = new Set<string>();
    graphics.forEach((graphic) => {
      const json = JSON.parse(graphic.attributes.info ?? '{}');
      const rightsHolder = json[Rights] ?? null;
      if (rightsHolder) {
        options.add(rightsHolder);
      }
    });
    return Array.from(options).map(
      (option) =>
        ({
          title: option,
        } as RightsHolderOption)
    );
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

export default GraphicRights;
