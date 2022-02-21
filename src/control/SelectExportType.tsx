import { TextField, MenuItem } from '@material-ui/core';
import { ArtifactTypeSlug, useArtifactType } from '../crud';
import { makeStyles, createStyles, Theme } from '@material-ui/core';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    typeSelect: {
      paddingRight: theme.spacing(2),
    },
  })
);
interface IProps {
  exportType: string;
  exportTypes: ArtifactTypeSlug[];
  setExportType: (t: ArtifactTypeSlug) => void;
}

export const SelectExportType = (props: IProps) => {
  const { exportType, setExportType, exportTypes } = props;
  const classes = useStyles();
  const { localizedArtifactType } = useArtifactType();

  const handleExportType = (e: React.ChangeEvent<HTMLInputElement>) => {
    setExportType(e.target.value as ArtifactTypeSlug);
  };

  return (
    <TextField
      select
      value={exportType}
      onChange={handleExportType}
      className={classes.typeSelect}
    >
      {exportTypes.map((t) => (
        <MenuItem key={t} value={t}>
          {localizedArtifactType(t)}
        </MenuItem>
      ))}
    </TextField>
  );
};
