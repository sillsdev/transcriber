import React from 'react';
import TextField from '@mui/material/TextField';
import Autocomplete, { createFilterOptions } from '@mui/material/Autocomplete';
import Confirm from '../components/AlertDialog';
import { Graphic, IMediaTabStrings } from '../model';
import { shallowEqual, useSelector } from 'react-redux';
import { mediaTabSelector } from '../selector';
import { useOrbitData } from '../hoc/useOrbitData';
import { Rights } from './GraphicUploader';
import { useGlobal } from '../context/GlobalContext';
import { related } from '../crud';
import { JSONParse } from '../utils';

interface RightsHolderOption {
  inputValue?: string;
  title: string;
}

const filter = createFilterOptions<RightsHolderOption>();

interface IProps {
  value: string;
  teamId?: string;
  onChange: (value: string) => void;
}

export function GraphicRights(props: IProps) {
  const { onChange } = props;
  const [organization] = useGlobal('organization');
  const org = props.teamId ?? organization;
  const graphics = useOrbitData<Graphic[]>('graphic');
  const [value, setValuex] = React.useState<RightsHolderOption | null>(null);
  const valueRef = React.useRef<string>('');
  const [confirm, setConfirm] = React.useState('');

  const t: IMediaTabStrings = useSelector(mediaTabSelector, shallowEqual);

  const setValue = (newValue: RightsHolderOption | null) => {
    setValuex(newValue);
    const nextValue = newValue?.inputValue ?? newValue?.title ?? '';
    if (nextValue !== props.value) onChange(nextValue);
  };

  const getOptionLabel = (option: string | RightsHolderOption) => {
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
  };

  const rightsHolderOptions = React.useMemo(() => {
    const options = new Set<string>();
    graphics
      .filter((g) => related(g, 'organization') === org)
      .forEach((graphic) => {
        const json = JSONParse(graphic.attributes.info);
        const rightsHolder = json[Rights] ?? null;
        if (rightsHolder) {
          options.add(rightsHolder);
        }
      });
    return Array.from(options)
      .sort((a, b) => getOptionLabel(a).localeCompare(getOptionLabel(b)))
      .map(
        (option) =>
          ({
            title: option,
          } as RightsHolderOption)
      );
  }, [graphics, org]);

  const handleValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    valueRef.current = event.target.value;
  };

  const handleChoice = (newValue: string | RightsHolderOption | null) => {
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
  };

  const handleLeave = (event: any, reason: string) => {
    if (reason === 'blur' && valueRef.current) {
      setConfirm(valueRef.current);
    }
  };

  const handleConfirmChange = () => {
    handleChoice(valueRef.current);
    setConfirm('');
  };

  const handleRefuseChange = () => {
    setConfirm('');
  };

  React.useEffect(() => {
    if (value?.title !== props.value && value?.inputValue !== props.value)
      setValue({ title: props.value });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value]);

  return (
    <>
      <Autocomplete
        value={value}
        onChange={(event, newValue) => handleChoice(newValue)}
        onClose={handleLeave}
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
        getOptionLabel={getOptionLabel}
        renderOption={(props, option) => <li {...props}>{option.title}</li>}
        sx={{ width: 500, p: 1 }}
        freeSolo
        renderInput={(params) => (
          <TextField
            required
            {...params}
            label={t.graphicRightsTitle}
            onChange={handleValueChange}
          />
        )}
      />
      {confirm !== '' && (
        <Confirm
          title={t.confirmChange}
          text={t.confirmValue.replace('{0}', confirm)}
          yesResponse={handleConfirmChange}
          noResponse={handleRefuseChange}
        />
      )}
    </>
  );
}

export default GraphicRights;
