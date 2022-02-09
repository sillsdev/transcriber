import { connect } from 'react-redux';
import { MenuItem, TextField } from '@material-ui/core';
import { useContext, useEffect, useState } from 'react';
import {
  ITeamCheckReferenceStrings,
  IState,
  SectionResource,
} from '../../../model';
import { makeStyles, createStyles, Theme } from '@material-ui/core/styles';
import { QueryBuilder } from '@orbit/data';
import { withData } from '../../../mods/react-orbitjs';
import localStrings from '../../../selector/localize';
import { PassageDetailContext } from '../../../context/PassageDetailContext';
import { useArtifactCategory } from '../../../crud';

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
  t: ITeamCheckReferenceStrings;
}
interface IRecordProps {
  sectionResource: Array<SectionResource>;
}
interface IProps extends IStateProps, IRecordProps {
  inResource?: string;
  label?: string;
  onChange?: (resource: string) => void;
  required?: boolean;
}
export const SelectMyResource = (props: IProps) => {
  const { t, onChange, inResource, required } = props;
  const classes = useStyles();
  const ctx = useContext(PassageDetailContext);
  const { rowData } = ctx.state;
  const [resource, setResource] = useState('');
  const { scriptureTypeCategory } = useArtifactCategory();

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

  const checkCategory = (localCat: string) => {
    return scriptureTypeCategory(localCat);
  };

  return (
    <TextField
      id="select-my-resource"
      className={classes.textField}
      select
      label={t.resource}
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
        .filter((r) => r.isResource && checkCategory(r.artifactCategory))
        .sort((i, j) => (i.artifactName < j.artifactName ? -1 : 1))
        .map((r) => (
          <MenuItem value={r.id} key={r.id}>
            {nameOnly(r.artifactName)}
          </MenuItem>
        ))}
    </TextField>
  );
};
const mapStateToProps = (state: IState): IStateProps => ({
  t: localStrings(state, { layout: 'teamCheckReference' }),
});

const mapRecordsToProps = {
  sectionResource: (q: QueryBuilder) => q.findRecords('sectionresource'),
};

export default withData(mapRecordsToProps)(
  connect(mapStateToProps)(SelectMyResource) as any
) as any;
