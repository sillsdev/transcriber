import { useEffect, useState } from 'react';
import { Box, MenuItem, SxProps, TextField } from '@mui/material';
import {
  ArtifactTypeSlug,
  IArtifactType,
  useArtifactType,
} from '../../crud/useArtifactType';
import { ISelectArtifactTypeStrings } from '../../model';
import { shallowEqual, useSelector } from 'react-redux';
import { artifactTypeSelector } from '../../selector';

const smallProps = { fontSize: 'small' } as SxProps;

interface IProps {
  onTypeChange: (artifactTypeId: string | null) => void;
  initialValue?: string | null;
  limit?: ArtifactTypeSlug[];
  allowNew?: boolean;
}

export const SelectArtifactType = (props: IProps) => {
  const { onTypeChange, initialValue, limit } = props;
  const [artifactType, setArtifactType] = useState(
    ArtifactTypeSlug.Vernacular as string
  );
  const { getArtifactTypes } = useArtifactType();
  const [artifactTypes, setArtifactTypes] = useState<IArtifactType[]>([]);
  const t: ISelectArtifactTypeStrings = useSelector(
    artifactTypeSelector,
    shallowEqual
  );

  const handleArtifactTypeChange = (e: any) => {
    setArtifactType(e.target.value);
    onTypeChange(
      e.target.value === (ArtifactTypeSlug.Vernacular as string)
        ? null
        : e.target.value
    );
  };

  useEffect(() => {
    setArtifactTypes(
      getArtifactTypes(limit, true).map((a, i) =>
        !a.id ? { ...a, id: ArtifactTypeSlug.Vernacular as string } : a
      )
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [limit]);

  useEffect(() => {
    setArtifactType(
      initialValue ? initialValue : (ArtifactTypeSlug.Vernacular as string)
    );
  }, [initialValue]);

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
      <TextField
        id="artifact-type"
        select
        label={t.artifactType}
        sx={{ mx: 1, width: '400px' }}
        value={artifactType}
        onChange={handleArtifactTypeChange}
        SelectProps={{
          MenuProps: {
            sx: { width: '300px' },
          },
        }}
        InputProps={{
          sx: smallProps,
        }}
        InputLabelProps={{
          sx: smallProps,
        }}
        margin="normal"
        variant="filled"
        required={true}
      >
        {artifactTypes.map((option: IArtifactType) => (
          <MenuItem key={option.id} value={option.id}>
            {option.type}
          </MenuItem>
        ))}
      </TextField>
    </Box>
  );
};

export default SelectArtifactType;
