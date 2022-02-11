import { MenuItem, TextField } from '@material-ui/core';
import { useContext, useEffect, useState, useMemo } from 'react';
import { ISharedStrings } from '../../model';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { PassageDetailContext } from '../../context/PassageDetailContext';
import { useArtifactType } from '../../crud';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    menu: {},
    label: { marginTop: theme.spacing(1) },
    textField: {
      marginLeft: theme.spacing(1),
      marginRight: theme.spacing(1),
      display: 'flex',
      flexGrow: 1,
    },
  })
);

interface IStateProps {
  ts: ISharedStrings;
}

interface IProps extends IStateProps {
  inResource?: string;
  label?: string;
  onChange?: (resource: string) => void;
  required?: boolean;
  tags: string[];
}

export const SelectRecording = (props: IProps) => {
  const { ts, onChange, inResource, required, tags } = props;
  const classes = useStyles();
  const ctx = useContext(PassageDetailContext);
  const { rowData } = ctx.state;
  const [resource, setResource] = useState('');
  const { localizedArtifactType } = useArtifactType();

  const handleUserChange = (e: any) => {
    setResource(e.target.value);
    onChange && onChange(e.target.value);
  };

  useEffect(() => {
    if (inResource) setResource(inResource);
  }, [inResource]);

  const nameOnly = (n: string) => {
    const parts = n.split('.');
    return parts.length > 1 ? parts[0] : n;
  };

  const localTags = useMemo(() => {
    return tags.map((t) => localizedArtifactType(t));
  }, [tags, localizedArtifactType]);

  return (
    <TextField
      id="select-recording"
      className={classes.textField}
      select
      label={ts.playItem}
      value={resource}
      onChange={handleUserChange}
      SelectProps={{
        MenuProps: {
          className: classes.menu,
        },
      }}
      variant="filled"
      required={required}
    >
      {rowData
        .filter((r) => localTags.includes(r.artifactType))
        .sort((i, j) =>
          i.artifactType < j.artifactType
            ? -1
            : i.artifactType > j.artifactType
            ? 1
            : i.artifactName <= j.artifactName
            ? -1
            : 1
        )
        .map((r) => (
          <MenuItem value={r.id} key={r.id}>
            {`${r.artifactType}:    ${nameOnly(r.artifactName)}`}
          </MenuItem> //TODO change rows to a table?
        ))}
    </TextField>
  );
};

export default SelectRecording;
