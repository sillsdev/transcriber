import { TextField, MenuItem } from '@mui/material';
import { ArtifactTypeSlug, useArtifactType } from '../crud';

interface IProps {
  exportType: string;
  exportTypes: ArtifactTypeSlug[];
  setExportType: (t: ArtifactTypeSlug) => void;
}

export const SelectExportType = (props: IProps) => {
  const { exportType, setExportType, exportTypes } = props;
  const { localizedArtifactType } = useArtifactType();

  const handleExportType = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExportType(e.target.value as ArtifactTypeSlug);
  };

  return (
    <TextField
      id="select-export-type"
      select
      value={exportType}
      onChange={handleExportType}
      sx={{ pr: 2 }}
    >
      {exportTypes.map((t) => (
        <MenuItem id={`exp-${t}`} key={t} value={t}>
          {localizedArtifactType(t)}
        </MenuItem>
      ))}
    </TextField>
  );
};
